/**
 * Registry Fetcher - Unified interface for all data sources
 */

import type { RegistrySource, NormalizedBusiness, Province } from '../types'

export interface FetchOptions {
    query?: string
    limit?: number
    offset?: number
    status?: string
}

export interface RawRecord {
    source: RegistrySource
    data: Record<string, unknown>
    dedupeKey: string
}

export interface RegistryFetcher {
    source: RegistrySource
    connect(options?: FetchOptions): Promise<void>
    stream(callback: (row: RawRecord) => Promise<void>): Promise<number>
    disconnect(): Promise<void>
}

// Status normalization - M&A "Active" filter
const ACTIVE_STATUSES = new Set([
    'active',
    'good standing',
    'live',
    'registered',
    'incorporated',
])

const DISSOLVED_STATUSES = new Set([
    'dissolved',
    'struck off',
    'cancelled',
    'revoked',
    'amalgamated',
    'discontinued',
])

export function normalizeStatus(status: string): { isActive: boolean; statusRaw: string } {
    const normalized = status.toLowerCase().trim()
    return {
        isActive: ACTIVE_STATUSES.has(normalized),
        statusRaw: status,
    }
}

// Detect numbered companies (e.g., "3294821 Nova Scotia Ltd")
const NUMBERED_COMPANY_PATTERN = /^\d+\s+(NS|NB|PE|NL|Nova Scotia|New Brunswick|Prince Edward Island|Newfoundland)/i

export function isNumberedCompany(name: string): boolean {
    return NUMBERED_COMPANY_PATTERN.test(name)
}

// Generate dedupe key
export function generateDedupeKey(source: RegistrySource, registryId: string): string {
    return `${source}:${registryId.trim().toLowerCase()}`
}

// Parse address to extract city, province, postal
export function parseAddress(address: string | null): {
    city: string | null
    province: Province
    postalCode: string | null
} {
    if (!address) {
        return { city: null, province: 'NS', postalCode: null }
    }

    // Extract postal code (Canadian format: A1A 1A1 or A1A1A1)
    const postalMatch = address.match(/([A-Z]\d[A-Z])\s?(\d[A-Z]\d)/i)
    const postalCode = postalMatch ? `${postalMatch[1]} ${postalMatch[2]}`.toUpperCase() : null

    // Extract province
    let province: Province = 'NS'
    if (/\bNS\b|Nova Scotia/i.test(address)) province = 'NS'
    else if (/\bNB\b|New Brunswick/i.test(address)) province = 'NB'
    else if (/\bPE\b|PEI\b|Prince Edward Island/i.test(address)) province = 'PE'
    else if (/\bNL\b|Newfoundland|Labrador/i.test(address)) province = 'NL'

    // Try to extract city (before province abbreviation or comma-separated)
    let city: string | null = null
    const parts = address.split(',')
    if (parts.length >= 2) {
        city = parts[parts.length - 2]?.trim() || null
    }

    return { city, province, postalCode }
}

// Create normalized business from raw data
export function createNormalizedBusiness(
    legalName: string,
    operatingName: string | null,
    registryId: string,
    status: string,
    incorporationDate: string | null,
    address: string | null,
    defaultProvince: Province = 'NS'
): NormalizedBusiness {
    const { isActive, statusRaw } = normalizeStatus(status)
    const { city, province, postalCode } = parseAddress(address)

    return {
        legal_name: legalName,
        operating_name: operatingName,
        name: operatingName || legalName,
        registry_id: registryId,
        is_numbered_company: isNumberedCompany(legalName),
        is_active: isActive,
        status_raw: statusRaw,
        incorporation_date: incorporationDate,
        dissolution_date: null,
        address,
        city,
        province: province || defaultProvince,
        postal_code: postalCode,
    }
}
