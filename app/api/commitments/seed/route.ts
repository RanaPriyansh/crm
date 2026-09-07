import { NextResponse } from 'next/server'
import { isDevMode } from '@/lib/config'
import * as devStore from '@/lib/dev-store'
import { createClient } from '@/lib/supabase/server'
import {
    SYNTHETIC_COUNTERPARTIES,
    SYNTHETIC_SOURCE_REF,
    draftCommitmentFor,
} from '@/lib/commitments/seed'
import { createCommitment, transitionCommitment } from '@/lib/commitments/service'
import { getCommitmentStore, currentActor } from '@/lib/commitments/get-store'

export const dynamic = 'force-dynamic'

export async function POST() {
    const actor = await currentActor()
    const createdBusinesses: { id: string; name: string }[] = []

    for (const counterparty of SYNTHETIC_COUNTERPARTIES) {
        if (isDevMode) {
            const existing = devStore
                .getBusinesses()
                .find((b) => b.name === counterparty.name && b.source_ref === SYNTHETIC_SOURCE_REF)
            const business = existing ?? devStore.createBusiness(counterparty)
            createdBusinesses.push({ id: business.id, name: business.name })
        } else {
            const supabase = await createClient()
            const { data: existing } = await supabase
                .from('businesses')
                .select('id, name')
                .eq('source_ref', SYNTHETIC_SOURCE_REF)
                .eq('name', counterparty.name)
                .is('deleted_at', null)
                .maybeSingle()

            if (existing) {
                createdBusinesses.push(existing)
            } else {
                const { data, error } = await supabase
                    .from('businesses')
                    .insert({
                        name: counterparty.name,
                        category: counterparty.category,
                        city: counterparty.city,
                        province: counterparty.province,
                        source: counterparty.source,
                        source_ref: counterparty.source_ref,
                        status: counterparty.status,
                        description: counterparty.description,
                    })
                    .select('id, name')
                    .single()
                if (error || !data) {
                    return NextResponse.json(
                        { error: error?.message || 'Failed to seed counterparties' },
                        { status: 500 }
                    )
                }
                createdBusinesses.push(data)
            }
        }
    }

    const store = await getCommitmentStore()
    const existing = await store.list()
    const seededCommitments = []

    for (let i = 0; i < Math.min(3, createdBusinesses.length); i++) {
        const already = existing.find((c) => c.business_id === createdBusinesses[i].id)
        if (already) {
            seededCommitments.push(already)
            continue
        }
        const commitment = await createCommitment(
            store,
            draftCommitmentFor(createdBusinesses[i].id, i),
            actor
        )
        seededCommitments.push(commitment)
    }

    // Walk one draft through HITL to send_hold so the hub shows the intentional block.
    const walkable = seededCommitments.find((c) => c.status === 'draft')
    if (walkable) {
        await transitionCommitment(store, walkable.id, 'internal_ok', {
            actor,
            human_ok: true,
        })
        const held = await transitionCommitment(store, walkable.id, 'send_hold', { actor })
        Object.assign(walkable, held.commitment)
    }

    return NextResponse.json({
        counterparties: createdBusinesses,
        commitments: seededCommitments,
        note: 'Synthetic counterparties only. send_hold is ready to send and blocked on purpose.',
    })
}
