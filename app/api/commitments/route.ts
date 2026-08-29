import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isDevMode } from '@/lib/config'
import * as devStore from '@/lib/dev-store'
import * as commitmentStore from '@/lib/commitments/store'
import { validateCommitmentInput } from '@/lib/commitments/validation'

export const dynamic = 'force-dynamic'

// GET /api/commitments - list commitments
export async function GET() {
    if (isDevMode) {
        return NextResponse.json({ data: commitmentStore.getCommitments() })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('commitments')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch commitments' }, { status: 500 })
    }
    return NextResponse.json({ data: data ?? [] })
}

// POST /api/commitments - create a commitment (fail closed)
export async function POST(request: Request) {
    const body = await request.json().catch(() => null)

    const parsed = validateCommitmentInput(body)
    if (!parsed.ok) {
        return NextResponse.json(
            { error: 'Validation failed', code: 'validation_failed', details: parsed.errors },
            { status: 400 },
        )
    }
    const input = parsed.value

    if (isDevMode) {
        // Fail closed: the counterparty business must exist.
        const business = devStore.getBusinessById(input.business_id)
        if (!business) {
            return NextResponse.json(
                { error: 'Counterparty business not found', code: 'business_not_found' },
                { status: 400 },
            )
        }
        const commitment = commitmentStore.createCommitment(input, 'dev-user', business.name)
        return NextResponse.json(commitment, { status: 201 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fail closed: the counterparty business must exist.
    const { data: business } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('id', input.business_id)
        .is('deleted_at', null)
        .single()

    if (!business) {
        return NextResponse.json(
            { error: 'Counterparty business not found', code: 'business_not_found' },
            { status: 400 },
        )
    }

    const now = new Date().toISOString()
    const { data: commitment, error } = await supabase
        .from('commitments')
        .insert({
            business_id: input.business_id,
            counterparty_name: business.name,
            commodity_class: input.commodity_class,
            volume: input.volume,
            unit: input.unit,
            incoterm: input.incoterm,
            ship_window_from: input.ship_window_from,
            ship_window_to: input.ship_window_to,
            currency: input.currency,
            status: 'draft',
            human_ok: false,
            notes: input.notes ?? null,
            created_by: user.id,
        })
        .select()
        .single()

    if (error || !commitment) {
        return NextResponse.json({ error: 'Failed to create commitment' }, { status: 500 })
    }

    await supabase.from('commitment_audit').insert({
        commitment_id: commitment.id,
        actor: user.email ?? user.id,
        from_status: null,
        to_status: 'draft',
        human_ok: false,
        note: 'created',
        at: now,
    })

    return NextResponse.json(commitment, { status: 201 })
}
