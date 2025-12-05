import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { businessInputSchema } from '@/lib/validations'
import { normalizePhone } from '@/lib/utils/phone'
import * as devStore from '@/lib/dev-store'
import { isDevMode } from '@/lib/config'

export const dynamic = 'force-dynamic'

// GET /api/businesses - List businesses with pagination and advanced filters
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)

    // Parse all filter parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search')

    // Multi-value filters (comma-separated)
    const provinces = searchParams.get('provinces')?.split(',').filter(Boolean) || []
    const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || []
    const sources = searchParams.get('sources')?.split(',').filter(Boolean) || []
    const sizeBands = searchParams.get('sizeBands')?.split(',').filter(Boolean) || []
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []

    // Legacy single-value filters (backward compatibility)
    const province = searchParams.get('province')
    const status = searchParams.get('status')
    const tag = searchParams.get('tag')

    // Text filters
    const city = searchParams.get('city')
    const category = searchParams.get('category')
    const naicsCode = searchParams.get('naicsCode')

    // Boolean filters
    const hasEmail = searchParams.get('hasEmail')
    const hasPhone = searchParams.get('hasPhone')
    const hasWebsite = searchParams.get('hasWebsite')
    const hasContacts = searchParams.get('hasContacts')
    const hasCoordinates = searchParams.get('hasCoordinates')

    // Date filters
    const createdAfter = searchParams.get('createdAfter')
    const createdBefore = searchParams.get('createdBefore')
    const interactionAfter = searchParams.get('interactionAfter')
    const interactionBefore = searchParams.get('interactionBefore')

    // Dev mode: use local store
    if (isDevMode) {
        let businesses = devStore.getBusinesses()

        // Apply province filter (multi or single)
        const effectiveProvinces = provinces.length > 0 ? provinces : (province ? [province] : [])
        if (effectiveProvinces.length > 0) {
            businesses = businesses.filter(b => effectiveProvinces.includes(b.province))
        }

        // Apply status filter
        const effectiveStatuses = statuses.length > 0 ? statuses : (status ? [status] : [])
        if (effectiveStatuses.length > 0) {
            businesses = businesses.filter(b => effectiveStatuses.includes(b.status))
        }

        // Apply source filter
        if (sources.length > 0) {
            businesses = businesses.filter(b => sources.includes(b.source))
        }

        // Apply size band filter
        if (sizeBands.length > 0) {
            businesses = businesses.filter(b => b.size_band && sizeBands.includes(b.size_band))
        }

        // Apply tag filter
        const effectiveTags = tags.length > 0 ? tags : (tag ? [tag] : [])
        if (effectiveTags.length > 0) {
            const allBusinessIds = new Set<string>()
            effectiveTags.forEach(t => {
                devStore.getBusinessIdsByTag(t).forEach(id => allBusinessIds.add(id))
            })
            businesses = businesses.filter(b => allBusinessIds.has(b.id))
        }

        // Apply city filter
        if (city) {
            const q = city.toLowerCase()
            businesses = businesses.filter(b => b.city?.toLowerCase().includes(q))
        }

        // Apply category filter
        if (category) {
            const q = category.toLowerCase()
            businesses = businesses.filter(b => b.category?.toLowerCase().includes(q))
        }

        // Apply NAICS code filter
        if (naicsCode) {
            businesses = businesses.filter(b => b.naics_code?.startsWith(naicsCode))
        }

        // Apply boolean filters
        if (hasEmail === 'true') {
            businesses = businesses.filter(b => b.email)
        } else if (hasEmail === 'false') {
            businesses = businesses.filter(b => !b.email)
        }

        if (hasPhone === 'true') {
            businesses = businesses.filter(b => b.phone_raw)
        } else if (hasPhone === 'false') {
            businesses = businesses.filter(b => !b.phone_raw)
        }

        if (hasWebsite === 'true') {
            businesses = businesses.filter(b => b.website)
        } else if (hasWebsite === 'false') {
            businesses = businesses.filter(b => !b.website)
        }

        if (hasContacts === 'true') {
            businesses = businesses.filter(b => b.contact_count > 0)
        } else if (hasContacts === 'false') {
            businesses = businesses.filter(b => b.contact_count === 0)
        }

        if (hasCoordinates === 'true') {
            businesses = businesses.filter(b => b.latitude && b.longitude)
        } else if (hasCoordinates === 'false') {
            businesses = businesses.filter(b => !b.latitude || !b.longitude)
        }

        // Apply date filters
        if (createdAfter) {
            const date = new Date(createdAfter)
            businesses = businesses.filter(b => new Date(b.created_at) >= date)
        }
        if (createdBefore) {
            const date = new Date(createdBefore)
            date.setDate(date.getDate() + 1) // Include the end date
            businesses = businesses.filter(b => new Date(b.created_at) <= date)
        }
        if (interactionAfter) {
            const date = new Date(interactionAfter)
            businesses = businesses.filter(b => b.last_interaction_at && new Date(b.last_interaction_at) >= date)
        }
        if (interactionBefore) {
            const date = new Date(interactionBefore)
            date.setDate(date.getDate() + 1)
            businesses = businesses.filter(b => b.last_interaction_at && new Date(b.last_interaction_at) <= date)
        }

        // Apply search filter
        if (search) {
            const q = search.toLowerCase()
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

        return NextResponse.json({
            data,
            count: total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        })
    }

    // Production mode: use Supabase
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const offset = (page - 1) * pageSize

    let query = supabase
        .from('businesses')
        .select('*, business_tags!left(tag_id)', { count: 'exact' })
        .is('deleted_at', null)

    // Apply province filter
    const effectiveProvinces = provinces.length > 0 ? provinces : (province ? [province] : [])
    if (effectiveProvinces.length > 0) {
        query = query.in('province', effectiveProvinces)
    }

    // Apply status filter
    const effectiveStatuses = statuses.length > 0 ? statuses : (status ? [status] : [])
    if (effectiveStatuses.length > 0) {
        query = query.in('status', effectiveStatuses)
    }

    // Apply source filter
    if (sources.length > 0) {
        query = query.in('source', sources)
    }

    // Apply size band filter
    if (sizeBands.length > 0) {
        query = query.in('size_band', sizeBands)
    }

    // Apply city filter
    if (city) {
        query = query.ilike('city', `%${city}%`)
    }

    // Apply category filter
    if (category) {
        query = query.ilike('category', `%${category}%`)
    }

    // Apply NAICS filter
    if (naicsCode) {
        query = query.ilike('naics_code', `${naicsCode}%`)
    }

    // Apply boolean filters
    if (hasEmail === 'true') {
        query = query.not('email', 'is', null)
    } else if (hasEmail === 'false') {
        query = query.is('email', null)
    }

    if (hasPhone === 'true') {
        query = query.not('phone_raw', 'is', null)
    } else if (hasPhone === 'false') {
        query = query.is('phone_raw', null)
    }

    if (hasWebsite === 'true') {
        query = query.not('website', 'is', null)
    } else if (hasWebsite === 'false') {
        query = query.is('website', null)
    }

    if (hasContacts === 'true') {
        query = query.gt('contact_count', 0)
    } else if (hasContacts === 'false') {
        query = query.eq('contact_count', 0)
    }

    if (hasCoordinates === 'true') {
        query = query.not('latitude', 'is', null).not('longitude', 'is', null)
    } else if (hasCoordinates === 'false') {
        query = query.or('latitude.is.null,longitude.is.null')
    }

    // Apply date filters
    if (createdAfter) {
        query = query.gte('created_at', createdAfter)
    }
    if (createdBefore) {
        query = query.lte('created_at', createdBefore + 'T23:59:59')
    }
    if (interactionAfter) {
        query = query.gte('last_interaction_at', interactionAfter)
    }
    if (interactionBefore) {
        query = query.lte('last_interaction_at', interactionBefore + 'T23:59:59')
    }

    // Apply text search
    if (search) {
        query = query.textSearch('search_vector', search, {
            type: 'websearch',
            config: 'english'
        })
    }

    // Apply tag filter
    const effectiveTags = tags.length > 0 ? tags : (tag ? [tag] : [])
    if (effectiveTags.length > 0) {
        query = query.in('business_tags.tag_id', effectiveTags)
    }

    query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

    const { data, count, error } = await query

    if (error) {
        console.error('Error fetching businesses:', error)
        return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 })
    }

    return NextResponse.json({
        data,
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
    })
}

// POST /api/businesses - Create a new business
export async function POST(request: Request) {
    const body = await request.json()
    const result = businessInputSchema.safeParse(body)

    if (!result.success) {
        return NextResponse.json({
            error: 'Validation failed',
            details: result.error.flatten().fieldErrors
        }, { status: 400 })
    }

    const phone_e164 = normalizePhone(result.data.phone_raw)

    // Dev mode: use local store
    if (isDevMode) {
        const business = devStore.createBusiness({
            ...result.data,
            phone_e164,
        })
        return NextResponse.json(business, { status: 201 })
    }

    // Production mode: use Supabase
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('businesses')
        .insert({
            ...result.data,
            phone_e164,
            created_by: user.id,
            updated_by: user.id,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating business:', error)
        return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
}
