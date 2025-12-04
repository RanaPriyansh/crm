import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { businessInputSchema } from '@/lib/validations'
import { normalizePhone } from '@/lib/utils/phone'

export const dynamic = 'force-dynamic'

// GET /api/businesses/[id] - Get single business with contacts
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business with contacts and recent interactions
    const { data: business, error } = await supabase
        .from('businesses')
        .select(`
      *,
      contacts (*),
      interactions (
        id,
        type,
        direction,
        subject,
        notes,
        occurred_at,
        user_id
      )
    `)
        .eq('id', id)
        .is('deleted_at', null)
        .order('occurred_at', { referencedTable: 'interactions', ascending: false })
        .limit(10, { referencedTable: 'interactions' })
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 })
        }
        console.error('Error fetching business:', error)
        return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 })
    }

    return NextResponse.json(business)
}

// PUT /api/businesses/[id] - Update business
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate body
    const body = await request.json()
    const result = businessInputSchema.partial().safeParse(body)

    if (!result.success) {
        return NextResponse.json({
            error: 'Validation failed',
            details: result.error.flatten().fieldErrors
        }, { status: 400 })
    }

    // Normalize phone if provided
    const updateData: Record<string, unknown> = {
        ...result.data,
        updated_by: user.id,
    }

    if (result.data.phone_raw !== undefined) {
        updateData.phone_e164 = normalizePhone(result.data.phone_raw)
    }

    // Update business
    const { data, error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', id)
        .is('deleted_at', null)
        .select()
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 })
        }
        console.error('Error updating business:', error)
        return NextResponse.json({ error: 'Failed to update business' }, { status: 500 })
    }

    return NextResponse.json(data)
}

// DELETE /api/businesses/[id] - Soft delete business
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Soft delete
    const { error } = await supabase
        .from('businesses')
        .update({
            deleted_at: new Date().toISOString(),
            updated_by: user.id
        })
        .eq('id', id)
        .is('deleted_at', null)

    if (error) {
        console.error('Error deleting business:', error)
        return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
