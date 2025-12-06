/**
 * Nova Scotia Registry Fetcher
 * 
 * Note: The NS Registry of Joint Stock Companies doesn't have a public API.
 * This uses sample data for demonstration. In production, you would:
 * 1. Partner with NS government for data access
 * 2. Use periodic bulk CSV exports
 * 3. Or use OpenCorporates API for enrichment
 */

import type { RegistrySource } from '../../types'
import type { RegistryFetcher, FetchOptions, RawRecord } from '../fetcher'
import { generateDedupeKey } from '../fetcher'

// Sample data for demonstration
const SAMPLE_NS_COMPANIES = [
    { registry_number: 'NS-3001234', company_name: 'Atlantic Tech Solutions Ltd.', status: 'Active', date_of_incorporation: '2019-03-15', registered_office_address: '1969 Upper Water St, Halifax, NS B3J 3R7' },
    { registry_number: 'NS-3001235', company_name: 'Maritime Seafood Exports Inc.', status: 'Active', date_of_incorporation: '2015-07-22', registered_office_address: '45 Fisherman\'s Lane, Lunenburg, NS B0J 2C0' },
    { registry_number: 'NS-3001236', company_name: '1234567 Nova Scotia Limited', status: 'Active', date_of_incorporation: '2020-01-10', registered_office_address: '200 Main St, Dartmouth, NS B2Y 1C8' },
    { registry_number: 'NS-3001237', company_name: 'Cape Breton Mining Corp.', status: 'Dissolved', date_of_incorporation: '2010-05-18', registered_office_address: '88 George St, Sydney, NS B1P 1J3' },
    { registry_number: 'NS-3001238', company_name: 'Valley Farms Co-operative', status: 'Active', date_of_incorporation: '2018-09-01', registered_office_address: '120 Cornwallis Ave, Wolfville, NS B4P 2K5' },
    { registry_number: 'NS-3001239', company_name: 'Acadian Hospitality Group Inc.', status: 'Good Standing', date_of_incorporation: '2016-04-30', registered_office_address: '5657 Spring Garden Rd, Halifax, NS B3J 1G9' },
    { registry_number: 'NS-3001240', company_name: '9876543 NS Ltd.', status: 'Active', date_of_incorporation: '2021-11-05', registered_office_address: '77 Grafton St, Charlottetown, PE C1A 1K3' },
    { registry_number: 'NS-3001241', company_name: 'Bluenose Brewing Company Ltd.', status: 'Active', date_of_incorporation: '2017-08-12', registered_office_address: '2045 Gottingen St, Halifax, NS B3K 3B2' },
    { registry_number: 'NS-3001242', company_name: 'South Shore Construction Inc.', status: 'Struck Off', date_of_incorporation: '2012-02-28', registered_office_address: '34 King St, Bridgewater, NS B4V 1A2' },
    { registry_number: 'NS-3001243', company_name: 'Halifax FinTech Innovations Ltd.', status: 'Active', date_of_incorporation: '2022-06-15', registered_office_address: '1505 Barrington St, Halifax, NS B3J 3K5' },
]

interface NSSocrataRecord {
    company_name?: string
    registry_number?: string
    registry_id?: string
    status?: string
    date_of_incorporation?: string
    registered_office_address?: string
    [key: string]: unknown
}

export class NovaScotiaFetcher implements RegistryFetcher {
    source: RegistrySource = 'ns_registry'
    private options: FetchOptions = {}
    private useDemoData: boolean = true // Default to demo mode

    async connect(options: FetchOptions = {}): Promise<void> {
        this.options = options
    }

    async stream(callback: (row: RawRecord) => Promise<void>): Promise<number> {
        // Use sample data for demonstration
        const data = this.filterSampleData()
        let totalFetched = 0

        for (const row of data) {
            const registryId = row.registry_number || ''
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
        // No persistent connection
    }

    private filterSampleData(): NSSocrataRecord[] {
        let data = [...SAMPLE_NS_COMPANIES]

        // Apply status filter if provided
        if (this.options.status) {
            const statusLower = this.options.status.toLowerCase()
            data = data.filter(d =>
                d.status.toLowerCase().includes(statusLower)
            )
        }

        // Apply query filter if provided  
        if (this.options.query) {
            const queryLower = this.options.query.toLowerCase()
            data = data.filter(d =>
                d.company_name.toLowerCase().includes(queryLower) ||
                d.registry_number.toLowerCase().includes(queryLower)
            )
        }

        // Apply limit
        if (this.options.limit) {
            data = data.slice(0, this.options.limit)
        }

        return data
    }
}

// Helper to normalize NS Socrata record to our format
export function normalizeNSRecord(raw: NSSocrataRecord): {
    legalName: string
    registryId: string
    status: string
    incorporationDate: string | null
    address: string | null
} {
    return {
        legalName: raw.company_name || 'Unknown',
        registryId: raw.registry_number || raw.registry_id || '',
        status: raw.status || 'Unknown',
        incorporationDate: raw.date_of_incorporation || null,
        address: raw.registered_office_address || null,
    }
}
