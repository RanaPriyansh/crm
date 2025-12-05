import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js'

/**
 * Normalize a phone number to E.164 format
 * Defaults to Canadian numbers (CA)
 */
export function normalizePhone(phone: string | null | undefined, defaultCountry: CountryCode = 'CA'): string | null {
    if (!phone) return null

    // Clean up the input
    const cleaned = phone.replace(/[^\d+]/g, '')
    if (!cleaned) return null

    try {
        // Try to parse with default country
        if (isValidPhoneNumber(cleaned, defaultCountry)) {
            const parsed = parsePhoneNumber(cleaned, defaultCountry)
            return parsed.format('E.164')
        }

        // Try without default country (for international numbers)
        if (isValidPhoneNumber(cleaned)) {
            const parsed = parsePhoneNumber(cleaned)
            return parsed.format('E.164')
        }

        return null
    } catch {
        return null
    }
}

/**
 * Format a phone number for display
 */
export function formatPhone(phone: string | null | undefined, defaultCountry: CountryCode = 'CA'): string {
    if (!phone) return ''

    try {
        const parsed = parsePhoneNumber(phone, defaultCountry)
        if (parsed) {
            return parsed.formatNational()
        }
    } catch {
        // Return original if parsing fails
    }

    return phone
}

/**
 * Validate Canadian postal code format
 */
export function isValidPostalCode(postalCode: string): boolean {
    // Canadian postal code: A1A 1A1 or A1A1A1
    const regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/
    return regex.test(postalCode)
}

/**
 * Format postal code consistently (A1A 1A1)
 */
export function formatPostalCode(postalCode: string | null | undefined): string | null {
    if (!postalCode) return null

    const cleaned = postalCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (cleaned.length !== 6) return postalCode.toUpperCase()

    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
}

/**
 * Province display names
 */
export const PROVINCE_NAMES: Record<string, string> = {
    NS: 'Nova Scotia',
    NB: 'New Brunswick',
    PE: 'Prince Edward Island',
    NL: 'Newfoundland & Labrador',
}

/**
 * Status display names and colors
 */
export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    active: { label: 'Active', color: 'bg-green-100 text-green-800' },
    inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
    do_not_contact: { label: 'Do Not Contact', color: 'bg-red-100 text-red-800' },
    bad_data: { label: 'Bad Data', color: 'bg-yellow-100 text-yellow-800' },
    duplicate: { label: 'Duplicate', color: 'bg-orange-100 text-orange-800' },
}

/**
 * Source display names
 */
export const SOURCE_CONFIG: Record<string, { label: string; icon: string }> = {
    manual: { label: 'Manual Entry', icon: '✏️' },
    csv_import: { label: 'CSV Import', icon: '📄' },
    api_import: { label: 'API Import', icon: '🔗' },
    scraper: { label: 'Web Scraper', icon: '🤖' },
    other: { label: 'Other', icon: '📌' },
}

/**
 * Status options for select dropdowns
 */
export const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'do_not_contact', label: 'Do Not Contact' },
    { value: 'bad_data', label: 'Bad Data' },
    { value: 'duplicate', label: 'Duplicate' },
]

/**
 * Source options for select dropdowns
 */
export const SOURCE_OPTIONS = [
    { value: 'manual', label: 'Manual Entry' },
    { value: 'csv_import', label: 'CSV Import' },
    { value: 'api_import', label: 'API Import' },
    { value: 'scraper', label: 'Web Scraper' },
    { value: 'other', label: 'Other' },
]

/**
 * Size band options for select dropdowns
 */
export const SIZE_BAND_OPTIONS = [
    { value: 'micro', label: 'Micro (1-4 employees)' },
    { value: 'small', label: 'Small (5-19 employees)' },
    { value: 'medium', label: 'Medium (20-99 employees)' },
    { value: 'large', label: 'Large (100+ employees)' },
]

