import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { businessInputSchema, businessQuerySchema } from '@/lib/validations'
import { normalizePhone } from '@/lib/utils/phone'

export const dynamic = 'force-dynamic'

// GET /api/businesses - List businesses with pagination and filters
export async function GET(request: Request) {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params
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

    // Build query
    let query = supabase
        .from('businesses')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)

    // Apply filters
    if (province) {
        query = query.eq('province', province)
    }
    if (status) {
        query = query.eq('status', status)
    }
    if (source) {
        query = query.eq('source', source)
    }

    // Full-text search
    if (search) {
        query = query.textSearch('search_vector', search, {
            type: 'websearch',
            config: 'english'
        })
    }

    // Apply sorting and pagination
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
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate body
    const body = await request.json()
    const result = businessInputSchema.safeParse(body)

    if (!result.success) {
        return NextResponse.json({
            error: 'Validation failed',
            details: result.error.flatten().fieldErrors
        }, { status: 400 })
    }

    // Normalize phone number
    const phone_e164 = normalizePhone(result.data.phone_raw)

    // Insert business
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
