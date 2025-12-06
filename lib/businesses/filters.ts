export interface FilterState {
    search: string
    provinces: string[]
    statuses: string[]
    sources: string[]
    sizeBands: string[]
    tags: string[]
    city: string
    category: string
    naicsCode: string
    hasEmail: boolean | null
    hasPhone: boolean | null
    hasWebsite: boolean | null
    hasContacts: boolean | null
    hasCoordinates: boolean | null
    createdAfter: string
    createdBefore: string
    interactionAfter: string
    interactionBefore: string
}

export const defaultFilters: FilterState = {
    search: '',
    provinces: [],
    statuses: [],
    sources: [],
    sizeBands: [],
    tags: [],
    city: '',
    category: '',
    naicsCode: '',
    hasEmail: null,
    hasPhone: null,
    hasWebsite: null,
    hasContacts: null,
    hasCoordinates: null,
    createdAfter: '',
    createdBefore: '',
    interactionAfter: '',
    interactionBefore: '',
}

export const BUSINESS_PAGE_SIZE = 20

export function parseBooleanParam(value?: string | string[] | null): boolean | null {
    if (value === 'true') return true
    if (value === 'false') return false
    return null
}

export function getArrayParam(value?: string | string[] | null, fallback?: string): string[] {
    if (Array.isArray(value)) return value
    if (value) return value.split(',').filter(Boolean)
    if (fallback) return [fallback]
    return []
}

export function parseFiltersFromSearchParams(searchParams: Record<string, string | string[] | undefined>): {
    filters: FilterState
    page: number
} {
    const filters: FilterState = {
        ...defaultFilters,
        search: (searchParams.search as string) || '',
        provinces: getArrayParam(searchParams.provinces, searchParams.province as string),
        statuses: getArrayParam(searchParams.statuses, searchParams.status as string),
        sources: getArrayParam(searchParams.sources),
        sizeBands: getArrayParam(searchParams.sizeBands),
        tags: getArrayParam(searchParams.tags, searchParams.tag as string),
        city: (searchParams.city as string) || '',
        category: (searchParams.category as string) || '',
        naicsCode: (searchParams.naicsCode as string) || '',
        hasEmail: parseBooleanParam(searchParams.hasEmail as string),
        hasPhone: parseBooleanParam(searchParams.hasPhone as string),
        hasWebsite: parseBooleanParam(searchParams.hasWebsite as string),
        hasContacts: parseBooleanParam(searchParams.hasContacts as string),
        hasCoordinates: parseBooleanParam(searchParams.hasCoordinates as string),
        createdAfter: (searchParams.createdAfter as string) || '',
        createdBefore: (searchParams.createdBefore as string) || '',
        interactionAfter: (searchParams.interactionAfter as string) || '',
        interactionBefore: (searchParams.interactionBefore as string) || '',
    }

    const page = Math.max(1, Number(searchParams.page) || 1)

    return { filters, page }
}

export function filtersToSearchParams(filters: FilterState, page: number): URLSearchParams {
    const params = new URLSearchParams()

    if (filters.search) params.set('search', filters.search)
    if (filters.provinces.length > 0) params.set('provinces', filters.provinces.join(','))
    if (filters.statuses.length > 0) params.set('statuses', filters.statuses.join(','))
    if (filters.sources.length > 0) params.set('sources', filters.sources.join(','))
    if (filters.sizeBands.length > 0) params.set('sizeBands', filters.sizeBands.join(','))
    if (filters.tags.length > 0) params.set('tags', filters.tags.join(','))
    if (filters.city) params.set('city', filters.city)
    if (filters.category) params.set('category', filters.category)
    if (filters.naicsCode) params.set('naicsCode', filters.naicsCode)
    if (filters.hasEmail !== null) params.set('hasEmail', String(filters.hasEmail))
    if (filters.hasPhone !== null) params.set('hasPhone', String(filters.hasPhone))
    if (filters.hasWebsite !== null) params.set('hasWebsite', String(filters.hasWebsite))
    if (filters.hasContacts !== null) params.set('hasContacts', String(filters.hasContacts))
    if (filters.hasCoordinates !== null) params.set('hasCoordinates', String(filters.hasCoordinates))
    if (filters.createdAfter) params.set('createdAfter', filters.createdAfter)
    if (filters.createdBefore) params.set('createdBefore', filters.createdBefore)
    if (filters.interactionAfter) params.set('interactionAfter', filters.interactionAfter)
    if (filters.interactionBefore) params.set('interactionBefore', filters.interactionBefore)

    if (page > 1) params.set('page', page.toString())

    return params
}

export function filtersEqual(a: FilterState, b: FilterState) {
    return (
        a.search === b.search &&
        a.city === b.city &&
        a.category === b.category &&
        a.naicsCode === b.naicsCode &&
        a.hasEmail === b.hasEmail &&
        a.hasPhone === b.hasPhone &&
        a.hasWebsite === b.hasWebsite &&
        a.hasContacts === b.hasContacts &&
        a.hasCoordinates === b.hasCoordinates &&
        a.createdAfter === b.createdAfter &&
        a.createdBefore === b.createdBefore &&
        a.interactionAfter === b.interactionAfter &&
        a.interactionBefore === b.interactionBefore &&
        arraysEqual(a.provinces, b.provinces) &&
        arraysEqual(a.statuses, b.statuses) &&
        arraysEqual(a.sources, b.sources) &&
        arraysEqual(a.sizeBands, b.sizeBands) &&
        arraysEqual(a.tags, b.tags)
    )
}

function arraysEqual(a: string[], b: string[]) {
    if (a.length !== b.length) return false
    return a.every(value => b.includes(value))
}
