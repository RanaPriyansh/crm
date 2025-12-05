import { NextResponse } from 'next/server'
import * as devStore from '@/lib/dev-store'
import { z } from 'zod'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isDevMode = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseUrl.startsWith('https://')

export const dynamic = 'force-dynamic'

const interactionSchema = z.object({
    business_id: z.string().uuid(),
    contact_id: z.string().uuid().optional().nullable(),
    type: z.enum(['call', 'email', 'meeting', 'note', 'other']),
    direction: z.enum(['inbound', 'outbound', 'internal']),
    subject: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    occurred_at: z.string().datetime().optional(),
})

// GET /api/interactions
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('business_id')

    if (isDevMode) {
        const interactions = devStore.getInteractions(businessId || undefined)
        return NextResponse.json(interactions)
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
        .from('interactions')
        .select('*, businesses(name), contacts(first_name, last_name)')
        .order('occurred_at', { ascending: false })

    if (businessId) {
        query = query.eq('business_id', businessId)
    }

    const { data, error } = await query.limit(100)

    if (error) {
        console.error('Error fetching interactions:', error)
        return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 })
    }

    return NextResponse.json(data)
}

// POST /api/interactions
export async function POST(request: Request) {
    const body = await request.json()
    const result = interactionSchema.safeParse(body)

    if (!result.success) {
        return NextResponse.json({
            error: 'Validation failed',
            details: result.error.flatten().fieldErrors
        }, { status: 400 })
    }

    if (isDevMode) {
        const interaction = devStore.createInteraction(result.data)
        return NextResponse.json(interaction, { status: 201 })
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('interactions')
        .insert({
            ...result.data,
            occurred_at: result.data.occurred_at || new Date().toISOString(),
            created_by: user.id,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating interaction:', error)
        return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 })
    }

    // Update business last_interaction_at
    await supabase
        .from('businesses')
        .update({ last_interaction_at: data.occurred_at })
        .eq('id', result.data.business_id)

    return NextResponse.json(data, { status: 201 })
}
