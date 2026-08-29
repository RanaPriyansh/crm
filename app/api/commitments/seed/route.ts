import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isDevMode } from '@/lib/config'
import * as devStore from '@/lib/dev-store'
import * as commitmentStore from '@/lib/commitments/store'
import {
    SYNTHETIC_COUNTERPARTIES,
    SAMPLE_COMMITMENT_TEMPLATES,
    isoDateInDays,
} from '@/lib/commitments/seed'

export const dynamic = 'force-dynamic'

const SEED_REF = 'commitment-seed'

// POST /api/commitments/seed - populate synthetic counterparties + commitments.
export async function POST() {
    if (isDevMode) {
        const existing = devStore.getBusinesses().filter((b) => b.source_ref === SEED_REF)

        let counterparties = existing
        if (existing.length < SYNTHETIC_COUNTERPARTIES.length) {
            counterparties = SYNTHETIC_COUNTERPARTIES.map((cp) =>
                devStore.createBusiness({
                    name: cp.name,
                    city: cp.city,
                    province: cp.province,
                    category: cp.category,
                    email: cp.email,
                    description: 'Synthetic counterparty (seed)',
                    status: 'active',
                    source: 'other',
                    source_ref: SEED_REF,
                }),
            )
        }

        let commitmentsCreated = 0
        if (commitmentStore.getCommitments().length === 0 && counterparties.length > 0) {
            SAMPLE_COMMITMENT_TEMPLATES.forEach((tpl, i) => {
                const cp = counterparties[i % counterparties.length]
                commitmentStore.createCommitment(
                    {
                        business_id: cp.id,
                        commodity_class: tpl.commodity_class,
                        volume: tpl.volume,
                        unit: tpl.unit,
                        incoterm: tpl.incoterm,
                        ship_window_from: isoDateInDays(tpl.ship_offset_from_days),
                        ship_window_to: isoDateInDays(tpl.ship_offset_to_days),
                        currency: tpl.currency,
                        notes: tpl.notes,
                    },
                    'dev-user',
                    cp.name,
                )
                commitmentsCreated += 1
            })
        }

        return NextResponse.json({
            counterparties: counterparties.length,
            commitmentsCreated,
        })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Upsert synthetic counterparties by (source_ref, name).
    const { data: existing } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('source_ref', SEED_REF)

    let counterparties = existing ?? []
    if (counterparties.length < SYNTHETIC_COUNTERPARTIES.length) {
        const { data: inserted, error } = await supabase
            .from('businesses')
            .insert(
                SYNTHETIC_COUNTERPARTIES.map((cp) => ({
                    name: cp.name,
                    city: cp.city,
                    province: cp.province,
                    category: cp.category,
                    email: cp.email,
                    description: 'Synthetic counterparty (seed)',
                    status: 'active',
                    source: 'other',
                    source_ref: SEED_REF,
                    created_by: user.id,
                    updated_by: user.id,
                })),
            )
            .select('id, name')
        if (error) {
            return NextResponse.json({ error: 'Failed to seed counterparties' }, { status: 500 })
        }
        counterparties = inserted ?? []
    }

    const { count } = await supabase
        .from('commitments')
        .select('id', { count: 'exact', head: true })

    let commitmentsCreated = 0
    if ((count ?? 0) === 0 && counterparties.length > 0) {
        const now = new Date().toISOString()
        const rows = SAMPLE_COMMITMENT_TEMPLATES.map((tpl, i) => {
            const cp = counterparties[i % counterparties.length]
            return {
                business_id: cp.id,
                counterparty_name: cp.name,
                commodity_class: tpl.commodity_class,
                volume: tpl.volume,
                unit: tpl.unit,
                incoterm: tpl.incoterm,
                ship_window_from: isoDateInDays(tpl.ship_offset_from_days),
                ship_window_to: isoDateInDays(tpl.ship_offset_to_days),
                currency: tpl.currency,
                status: 'draft',
                human_ok: false,
                notes: tpl.notes,
                created_by: user.id,
            }
        })
        const { data: created, error } = await supabase.from('commitments').insert(rows).select('id')
        if (error) {
            return NextResponse.json({ error: 'Failed to seed commitments' }, { status: 500 })
        }
        commitmentsCreated = created?.length ?? 0
        if (created && created.length > 0) {
            await supabase.from('commitment_audit').insert(
                created.map((c) => ({
                    commitment_id: c.id,
                    actor: user.email ?? user.id,
                    from_status: null,
                    to_status: 'draft',
                    human_ok: false,
                    note: 'created',
                    at: now,
                })),
            )
        }
    }

    return NextResponse.json({ counterparties: counterparties.length, commitmentsCreated })
}
