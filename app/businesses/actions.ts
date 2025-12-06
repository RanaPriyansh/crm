'use server'

import { createClient } from '@/lib/supabase/server'
import { isDevMode } from '@/lib/config'
import * as devStore from '@/lib/dev-store'
import { FilterState, BUSINESS_PAGE_SIZE } from '@/lib/businesses/filters'
import { PaginatedResponse } from '@/lib/businesses/types'

export async function fetchBusinessesFromServer({
    filters,
    page = 1,
    pageSize = BUSINESS_PAGE_SIZE,
}: {
    filters: FilterState
    page?: number
    pageSize?: number
}): Promise<PaginatedResponse> {
    if (isDevMode) {
        return fetchBusinessesFromDev(filters, page, pageSize)
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { data: [], count: 0, page, pageSize, totalPages: 0 }
    }

    const offset = (page - 1) * pageSize

    let query = supabase
        .from('businesses')
        .select('*, business_tags!left(tag_id)', { count: 'exact' })
        .is('deleted_at', null)

    if (filters.provinces.length > 0) {
        query = query.in('province', filters.provinces)
    }

    if (filters.statuses.length > 0) {
        query = query.in('status', filters.statuses)
    }

    if (filters.sources.length > 0) {
        query = query.in('source', filters.sources)
    }

    if (filters.sizeBands.length > 0) {
        query = query.in('size_band', filters.sizeBands)
    }

    if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`)
    }

    if (filters.category) {
        query = query.ilike('category', `%${filters.category}%`)
    }

    if (filters.naicsCode) {
        query = query.ilike('naics_code', `${filters.naicsCode}%`)
    }

    if (filters.hasEmail === true) {
        query = query.not('email', 'is', null)
    } else if (filters.hasEmail === false) {
        query = query.is('email', null)
    }

    if (filters.hasPhone === true) {
        query = query.not('phone_raw', 'is', null)
    } else if (filters.hasPhone === false) {
        query = query.is('phone_raw', null)
    }

    if (filters.hasWebsite === true) {
        query = query.not('website', 'is', null)
    } else if (filters.hasWebsite === false) {
        query = query.is('website', null)
    }

    if (filters.hasContacts === true) {
        query = query.gt('contact_count', 0)
    } else if (filters.hasContacts === false) {
        query = query.eq('contact_count', 0)
    }

    if (filters.hasCoordinates === true) {
        query = query.not('latitude', 'is', null).not('longitude', 'is', null)
    } else if (filters.hasCoordinates === false) {
        query = query.or('latitude.is.null,longitude.is.null')
    }

    if (filters.createdAfter) {
        query = query.gte('created_at', filters.createdAfter)
    }

    if (filters.createdBefore) {
        query = query.lte('created_at', filters.createdBefore + 'T23:59:59')
    }

    if (filters.interactionAfter) {
        query = query.gte('last_interaction_at', filters.interactionAfter)
    }

    if (filters.interactionBefore) {
        query = query.lte('last_interaction_at', filters.interactionBefore + 'T23:59:59')
    }

    if (filters.search) {
        query = query.textSearch('search_vector', filters.search, {
            type: 'websearch',
            config: 'english'
        })
    }

    if (filters.tags.length > 0) {
        query = query.in('business_tags.tag_id', filters.tags)
    }

    query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

    const { data, count, error } = await query

    if (error) {
        console.error('Error fetching businesses:', error)
        return { data: [], count: 0, page, pageSize, totalPages: 0 }
    }

    const totalCount = count || 0

    return {
        data: data || [],
        count: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
    }
}

function fetchBusinessesFromDev(filters: FilterState, page: number, pageSize: number): PaginatedResponse {
    let businesses = devStore.getBusinesses()

    if (filters.provinces.length > 0) {
        businesses = businesses.filter(b => filters.provinces.includes(b.province))
    }

    if (filters.statuses.length > 0) {
        businesses = businesses.filter(b => filters.statuses.includes(b.status))
    }

    if (filters.sources.length > 0) {
        businesses = businesses.filter(b => filters.sources.includes(b.source))
    }

    if (filters.sizeBands.length > 0) {
        businesses = businesses.filter(b => b.size_band && filters.sizeBands.includes(b.size_band))
    }

    if (filters.tags.length > 0) {
        const allBusinessIds = new Set<string>()
        filters.tags.forEach(t => {
            devStore.getBusinessIdsByTag(t).forEach(id => allBusinessIds.add(id))
        })
        businesses = businesses.filter(b => allBusinessIds.has(b.id))
    }

    if (filters.city) {
        const q = filters.city.toLowerCase()
        businesses = businesses.filter(b => b.city?.toLowerCase().includes(q))
    }

    if (filters.category) {
        const q = filters.category.toLowerCase()
        businesses = businesses.filter(b => b.category?.toLowerCase().includes(q))
    }

    if (filters.naicsCode) {
        businesses = businesses.filter(b => b.naics_code?.startsWith(filters.naicsCode))
    }

    if (filters.hasEmail === true) {
        businesses = businesses.filter(b => b.email)
    } else if (filters.hasEmail === false) {
        businesses = businesses.filter(b => !b.email)
    }

    if (filters.hasPhone === true) {
        businesses = businesses.filter(b => b.phone_raw)
    } else if (filters.hasPhone === false) {
        businesses = businesses.filter(b => !b.phone_raw)
    }

    if (filters.hasWebsite === true) {
        businesses = businesses.filter(b => b.website)
    } else if (filters.hasWebsite === false) {
        businesses = businesses.filter(b => !b.website)
    }

    if (filters.hasContacts === true) {
        businesses = businesses.filter(b => b.contact_count > 0)
    } else if (filters.hasContacts === false) {
        businesses = businesses.filter(b => b.contact_count === 0)
    }

    if (filters.hasCoordinates === true) {
        businesses = businesses.filter(b => b.latitude && b.longitude)
    } else if (filters.hasCoordinates === false) {
        businesses = businesses.filter(b => !b.latitude || !b.longitude)
    }

    if (filters.createdAfter) {
        const date = new Date(filters.createdAfter)
        businesses = businesses.filter(b => new Date(b.created_at) >= date)
    }

    if (filters.createdBefore) {
        const date = new Date(filters.createdBefore)
        date.setDate(date.getDate() + 1)
        businesses = businesses.filter(b => new Date(b.created_at) <= date)
    }

    if (filters.interactionAfter) {
        const date = new Date(filters.interactionAfter)
        businesses = businesses.filter(b => b.last_interaction_at && new Date(b.last_interaction_at) >= date)
    }

    if (filters.interactionBefore) {
        const date = new Date(filters.interactionBefore)
        date.setDate(date.getDate() + 1)
        businesses = businesses.filter(b => b.last_interaction_at && new Date(b.last_interaction_at) <= date)
    }

    if (filters.search) {
        const q = filters.search.toLowerCase()
        businesses = businesses.filter(b =>
            b.name.toLowerCase().includes(q) ||
            b.city?.toLowerCase().includes(q) ||
            b.category?.toLowerCase().includes(q) ||
            b.email?.toLowerCase().includes(q)
        )
    }

    const total = businesses.length
    const offset = (page - 1) * pageSize
    const data = businesses.slice(offset, offset + pageSize)

    return {
        data,
        count: total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
    }
}
