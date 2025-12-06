/**
 * CSV Stream Parser for NB/PEI/NL bulk uploads
 * Memory-efficient row-by-row processing
 */

import type { RegistrySource } from '../../types'
import type { RegistryFetcher, FetchOptions, RawRecord } from '../fetcher'
import { generateDedupeKey } from '../fetcher'

// Column mappings for different provinces
export interface ColumnMapping {
    name: string | string[]           // Which column(s) contain business name
    registryId: string | string[]
    status: string | string[]
    incorporationDate?: string
    address?: string | string[]
    operatingName?: string
}

const DEFAULT_MAPPINGS: Record<string, ColumnMapping> = {
    nb_registry: {
        name: ['Business Name', 'Legal Name', 'Company Name'],
        registryId: ['Registry Number', 'Registration Number', 'ID'],
        status: ['Status', 'State'],
        incorporationDate: 'Incorporation Date',
        address: ['Address', 'Registered Address'],
    },
    pei_registry: {
        name: ['Name', 'Business Name'],
        registryId: ['Registration Number', 'Registry ID'],
        status: ['Status'],
        incorporationDate: 'Date of Incorporation',
        address: ['Address'],
    },
    nl_registry: {
        name: ['Company Name', 'Name'],
        registryId: ['Registry Number', 'Company Number'],
        status: ['Status', 'Company Status'],
        incorporationDate: 'Incorporation Date',
        address: ['Registered Office'],
    },
}

export class CSVStreamParser implements RegistryFetcher {
    source: RegistrySource
    private csvData: string = ''
    private mapping: ColumnMapping

    constructor(source: RegistrySource) {
        this.source = source
        this.mapping = DEFAULT_MAPPINGS[source] || DEFAULT_MAPPINGS.nb_registry
    }

    setCSVData(data: string): void {
        this.csvData = data
    }

    setMapping(mapping: ColumnMapping): void {
        this.mapping = mapping
    }

    async connect(_options?: FetchOptions): Promise<void> {
        // CSV data should be set via setCSVData before streaming
        if (!this.csvData) {
            throw new Error('CSV data not set. Call setCSVData() first.')
        }
    }

    async stream(callback: (row: RawRecord) => Promise<void>): Promise<number> {
        const lines = this.csvData.split('\n')
        if (lines.length < 2) return 0

        // Parse header row
        const headers = this.parseCSVLine(lines[0])
        let totalFetched = 0

        // Process data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            const values = this.parseCSVLine(line)
            const row: Record<string, string> = {}

            headers.forEach((header, idx) => {
                row[header.trim()] = values[idx]?.trim() || ''
            })

            // Extract registry ID using mapping
            const registryId = this.getFieldValue(row, this.mapping.registryId)
            if (!registryId) continue

            await callback({
                source: this.source,
                data: row,
                dedupeKey: generateDedupeKey(this.source, registryId),
            })
            totalFetched++
        }

        return totalFetched
    }

    async disconnect(): Promise<void> {
        this.csvData = ''
    }

    private parseCSVLine(line: string): string[] {
        const result: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"'
                    i++
                } else {
                    inQuotes = !inQuotes
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current)
                current = ''
            } else {
                current += char
            }
        }

        result.push(current)
        return result
    }

    private getFieldValue(row: Record<string, string>, field: string | string[]): string {
        const fields = Array.isArray(field) ? field : [field]
        for (const f of fields) {
            if (row[f]) return row[f]
        }
        return ''
    }
}

// Helper to normalize CSV row to our format
export function normalizeCSVRecord(
    row: Record<string, string>,
    mapping: ColumnMapping
): {
    legalName: string
    operatingName: string | null
    registryId: string
    status: string
    incorporationDate: string | null
    address: string | null
} {
    const getField = (field: string | string[] | undefined): string => {
        if (!field) return ''
        const fields = Array.isArray(field) ? field : [field]
        for (const f of fields) {
            if (row[f]) return row[f]
        }
        return ''
    }

    return {
        legalName: getField(mapping.name) || 'Unknown',
        operatingName: mapping.operatingName ? getField(mapping.operatingName) || null : null,
        registryId: getField(mapping.registryId),
        status: getField(mapping.status) || 'Unknown',
        incorporationDate: mapping.incorporationDate ? getField(mapping.incorporationDate) || null : null,
        address: getField(mapping.address) || null,
    }
}
