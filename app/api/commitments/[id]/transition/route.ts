import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isDevMode } from '@/lib/config'
import * as commitmentStore from '@/lib/commitments/store'
import { transitionInputSchema } from '@/lib/commitments/validation'
import {
    applyTransition,
    HitlRequiredError,
    IllegalTransitionError,
} from '@/lib/commitments/state-machine'
import type { Commitment } from '@/lib/commitments/types'

export const dynamic = 'force-dynamic'

function errorResponse(err: unknown) {
    if (err instanceof HitlRequiredError) {
        return NextResponse.json(
            { error: err.message, code: err.code, from: err.from, to: err.to },
            { status: 403 },
        )
    }
    if (err instanceof IllegalTransitionError) {
        return NextResponse.json(
            { error: err.message, code: err.code, from: err.from, to: err.to },
            { status: 409 },
        )
    }
    throw err
}

// POST /api/commitments/[id]/transition - advance/kill a commitment
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params
    const body = await request.json().catch(() => null)

    const parsed = transitionInputSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Validation failed', code: 'validation_failed', details: parsed.error.flatten().fieldErrors },
            { status: 400 },
        )
    }
    const { to, human_ok, note } = parsed.data

    if (isDevMode) {
        try {
            const outcome = commitmentStore.transitionCommitment(id, {
                to,
                actor: parsed.data.actor ?? 'dev-user',
                humanOk: human_ok,
                note,
            })
            if (!outcome.ok) {
                return NextResponse.json({ error: 'Commitment not found' }, { status: 404 })
            }
            return NextResponse.json(outcome.result.commitment)
        } catch (err) {
            return errorResponse(err)
        }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: current, error } = await supabase
        .from('commitments')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !current) {
        return NextResponse.json({ error: 'Commitment not found' }, { status: 404 })
    }

    try {
        const result = applyTransition(current as Commitment, {
            to,
            actor: parsed.data.actor ?? user.email ?? user.id,
            humanOk: human_ok,
            note,
        })

        const { error: updateError } = await supabase
            .from('commitments')
            .update({
                status: result.commitment.status,
                human_ok: result.commitment.human_ok,
                updated_at: result.commitment.updated_at,
            })
            .eq('id', id)

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update commitment' }, { status: 500 })
        }

        await supabase.from('commitment_audit').insert({
            commitment_id: result.audit.commitment_id,
            actor: result.audit.actor,
            from_status: result.audit.from_status,
            to_status: result.audit.to_status,
            human_ok: result.audit.human_ok,
            note: result.audit.note,
            at: result.audit.at,
        })

        return NextResponse.json(result.commitment)
    } catch (err) {
        return errorResponse(err)
    }
}
