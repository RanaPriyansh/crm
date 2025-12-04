import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { contactInputSchema } from '@/lib/validations'
import { normalizePhone } from '@/lib/utils/phone'
import * as devStore from '@/lib/dev-store'
import { isDevMode } from '@/lib/config'

export const dynamic = 'force-dynamic'

// GET /api/contacts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('business_id')

    // Dev mode
    if (isDevMode) {
        const contacts = devStore.getContacts(businessId || undefined)
        return NextResponse.json(contacts)
    }

    // Production mode
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
        .from('contacts')
        .select('*, businesses!inner(name, city, province)')

    if (businessId) {
        query = query.eq('business_id', businessId)
    }

    query = query.order('created_at', { ascending: false }).limit(100)

    const { data, error } = await query

    if (error) {
        console.error('Error fetching contacts:', error)
        return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    return NextResponse.json(data)
}

// POST /api/contacts
export async function POST(request: Request) {
    const body = await request.json()
    const result = contactInputSchema.safeParse(body)

    if (!result.success) {
        return NextResponse.json({
            error: 'Validation failed',
            details: result.error.flatten().fieldErrors
        }, { status: 400 })
    }

    const phone_e164 = normalizePhone(result.data.phone_raw)

    // Dev mode
    if (isDevMode) {
        const contact = devStore.createContact({
            ...result.data,
            phone_e164,
        })
        return NextResponse.json(contact, { status: 201 })
    }

    // Production mode
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (result.data.is_primary) {
        await supabase
            .from('contacts')
            .update({ is_primary: false })
            .eq('business_id', result.data.business_id)
    }

    const { data, error } = await supabase
        .from('contacts')
        .insert({
            ...result.data,
            phone_e164,
            created_by: user.id,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating contact:', error)
        return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
}
