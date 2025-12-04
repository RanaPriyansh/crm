import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { businessInputSchema, businessQuerySchema } from '@/lib/validations'
import { normalizePhone } from '@/lib/utils/phone'
import * as devStore from '@/lib/dev-store'
import { isDevMode } from '@/lib/config'

export const dynamic = 'force-dynamic'

// GET /api/businesses - List businesses with pagination and filters
export async function GET(request: Request) {
    // Dev mode: use local store
    if (isDevMode) {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = parseInt(searchParams.get('pageSize') || '20')
        const search = searchParams.get('search')
        const province = searchParams.get('province')
        const status = searchParams.get('status')

        let businesses = devStore.getBusinesses()

        // Apply filters
        if (province) businesses = businesses.filter(b => b.province === province)
        if (status) businesses = businesses.filter(b => b.status === status)
        if (search) {
            const q = search.toLowerCase()
            businesses = businesses.filter(b =>
                b.name.toLowerCase().includes(q) ||
                b.city?.toLowerCase().includes(q)
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

    const { searchParams } = new URL(request.url)
    const queryResult = businessQuerySchema.safeParse({
        page: searchParams.get('page'),
        pageSize: searchParams.get('pageSize'),
        search: searchParams.get('search'),
        province: searchParams.get('province'),
        status: searchParams.get('status'),
        source: searchParams.get('source'),
        sortBy: searchParams.get('sortBy'),
        sortOrder: searchParams.get('sortOrder'),
    })

    if (!queryResult.success) {
        return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
    }

    const { page, pageSize, search, province, status, source, sortBy, sortOrder } = queryResult.data
    const offset = (page - 1) * pageSize

    let query = supabase
        .from('businesses')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)

    if (province) query = query.eq('province', province)
    if (status) query = query.eq('status', status)
    if (source) query = query.eq('source', source)

    if (search) {
        query = query.textSearch('search_vector', search, {
            type: 'websearch',
            config: 'english'
        })
    }

    query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
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
