/**
 * Registry Job Processor
 * Orchestrates the ETL pipeline: FETCH → NORMALIZE → MATCH → UPSERT
 */

import * as devStore from '../dev-store'
import type { RegistrySource, RegistryJob, Province } from '../types'
import { NovaScotiaFetcher, normalizeNSRecord } from './sources/nova-scotia'
import { CSVStreamParser, normalizeCSVRecord } from './sources/csv-stream'
import type { RegistryFetcher, RawRecord } from './fetcher'
import { createNormalizedBusiness } from './fetcher'

// Get appropriate fetcher for source
function getFetcher(source: RegistrySource): RegistryFetcher | null {
    switch (source) {
        case 'ns_registry':
            return new NovaScotiaFetcher()
        case 'nb_registry':
        case 'pei_registry':
        case 'nl_registry':
            return new CSVStreamParser(source)
        default:
            return null
    }
}

// Province mapping
const SOURCE_TO_PROVINCE: Record<RegistrySource, Province> = {
    ns_registry: 'NS',
    nb_registry: 'NB',
    pei_registry: 'PE',
    nl_registry: 'NL',
    opencorporates: 'NS', // Default, will be overridden
    statscan: 'NS',
}

export interface ProcessOptions {
    query?: string
    csvData?: string // For file uploads
}

export async function processRegistryJob(
    jobId: string,
    options: ProcessOptions = {}
): Promise<void> {
    const job = devStore.getRegistryJobById(jobId)
    if (!job) {
        console.error(`Job ${jobId} not found`)
        return
    }

    // Update status to running
    devStore.updateRegistryJob(jobId, {
        status: 'running',
        started_at: new Date().toISOString(),
    })
    devStore.appendJobLog(jobId, 'Job started')

    const fetcher = getFetcher(job.source)
    if (!fetcher) {
        devStore.updateRegistryJob(jobId, { status: 'failed' })
        devStore.appendJobLog(jobId, `Unknown source: ${job.source}`)
        return
    }

    // Set CSV data for file uploads
    if (options.csvData && fetcher instanceof CSVStreamParser) {
        fetcher.setCSVData(options.csvData)
    }

    const stats = { ...job.stats }
    const province = SOURCE_TO_PROVINCE[job.source]

    try {
        await fetcher.connect({ query: options.query || job.query || undefined })
        devStore.appendJobLog(jobId, 'Connected to data source')

        // Stream and process records
        const totalFetched = await fetcher.stream(async (raw: RawRecord) => {
            stats.fetched++

            // Add to staging
            const record = devStore.addRegistryRecord({
                job_id: jobId,
                source: raw.source,
                raw_data: raw.data,
                dedupe_key: raw.dedupeKey,
            })

            if (!record) {
                stats.duplicates++
                return
            }

            // Normalize based on source
            try {
                let normalized;

                if (job.source === 'ns_registry') {
                    const nsData = normalizeNSRecord(raw.data as Record<string, string>)
                    normalized = createNormalizedBusiness(
                        nsData.legalName,
                        null,
                        nsData.registryId,
                        nsData.status,
                        nsData.incorporationDate,
                        nsData.address,
                        province
                    )
                } else {
                    // CSV sources
                    const csvData = normalizeCSVRecord(
                        raw.data as Record<string, string>,
                        { name: 'name', registryId: 'registry_id', status: 'status' }
                    )
                    normalized = createNormalizedBusiness(
                        csvData.legalName,
                        csvData.operatingName,
                        csvData.registryId,
                        csvData.status,
                        csvData.incorporationDate,
                        csvData.address,
                        province
                    )
                }

                devStore.updateRegistryRecord(record.id, {
                    normalized_data: normalized,
                    status: 'processed',
                })
                stats.normalized++

            } catch (err) {
                devStore.updateRegistryRecord(record.id, {
                    status: 'error',
                    error_message: err instanceof Error ? err.message : 'Unknown error',
                })
                stats.errors++
            }

            // Log progress every 100 records
            if (stats.fetched % 100 === 0) {
                devStore.appendJobLog(jobId, `Processed ${stats.fetched} records...`)
                devStore.updateRegistryJob(jobId, { stats })
            }
        })

        await fetcher.disconnect()

        devStore.updateRegistryJob(jobId, {
            status: 'completed',
            stats,
            finished_at: new Date().toISOString(),
        })
        devStore.appendJobLog(jobId, `Completed: ${totalFetched} records fetched, ${stats.normalized} normalized, ${stats.duplicates} duplicates, ${stats.errors} errors`)

    } catch (error) {
        devStore.updateRegistryJob(jobId, {
            status: 'failed',
            finished_at: new Date().toISOString(),
        })
        devStore.appendJobLog(jobId, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.error('Registry job error:', error)
    }
}

// Import selected records to businesses
export function importRecords(jobId: string, recordIds: string[]): number {
    let imported = 0
    const job = devStore.getRegistryJobById(jobId)
    if (!job) return 0

    for (const recordId of recordIds) {
        const business = devStore.importRegistryRecord(recordId)
        if (business) {
            imported++
        }
    }

    // Update job stats
    const currentStats = job.stats
    devStore.updateRegistryJob(jobId, {
        stats: {
            ...currentStats,
            created: currentStats.created + imported,
        }
    })
    devStore.appendJobLog(jobId, `Imported ${imported} records to businesses`)

    return imported
}
