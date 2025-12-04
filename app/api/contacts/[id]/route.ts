import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { contactInputSchema } from '@/lib/validations'
import { normalizePhone } from '@/lib/utils/phone'
import * as devStore from '@/lib/dev-store'
import { isDevMode } from '@/lib/config'

export const dynamic = 'force-dynamic'

// GET /api/contacts/[id]
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    // Dev mode - not implemented for single contact
    if (isDevMode) {
        return NextResponse.json({ error: 'Not implemented in dev mode' }, { status: 501 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('contacts')
        .select('*, businesses(name)')
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
    }

    return NextResponse.json(data)
}

// PUT /api/contacts/[id]
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const body = await request.json()
    const result = contactInputSchema.partial().safeParse(body)

    if (!result.success) {
        return NextResponse.json({
            error: 'Validation failed',
            details: result.error.flatten().fieldErrors
        }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { ...result.data }
    if (result.data.phone_raw !== undefined) {
        updateData.phone_e164 = normalizePhone(result.data.phone_raw)
    }

    // Dev mode
    if (isDevMode) {
        const contact = devStore.updateContact(id, updateData)
        if (!contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
        }
        return NextResponse.json(contact)
    }

    // Production mode
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (result.data.is_primary && result.data.business_id) {
        await supabase
            .from('contacts')
            .update({ is_primary: false })
            .eq('business_id', result.data.business_id)
            .neq('id', id)
    }

    const { data, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
    }

    return NextResponse.json(data)
}

// DELETE /api/contacts/[id]
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    // Dev mode
    if (isDevMode) {
        const success = devStore.deleteContact(id)
        if (!success) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
        }
        return NextResponse.json({ success: true })
    }

    // Production mode
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting contact:', error)
        return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
