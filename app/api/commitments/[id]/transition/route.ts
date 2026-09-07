import { NextResponse } from 'next/server'
import {
    CommitmentError,
    transitionCommitment,
    validateTransitionTarget,
} from '@/lib/commitments'
import { currentActor, getCommitmentStore } from '@/lib/commitments/get-store'
import { httpStatusFor } from '@/lib/commitments/service'
import { transitionSchema } from '@/lib/commitments/validate'

export const dynamic = 'force-dynamic'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const body = await request.json()
        const parsed = transitionSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid transition', code: 'invalid_input' },
                { status: 400 }
            )
        }

        const to = validateTransitionTarget(parsed.data.to)
        const store = await getCommitmentStore()
        const actor = await currentActor()
        const { commitment } = await transitionCommitment(store, id, to, {
            actor,
            human_ok: parsed.data.human_ok,
        })
        return NextResponse.json(commitment)
    } catch (error) {
        if (error instanceof CommitmentError) {
            return NextResponse.json(
                { error: error.message, code: error.code },
                { status: httpStatusFor(error) }
            )
        }
        console.error(error)
        return NextResponse.json({ error: 'Failed to transition commitment' }, { status: 500 })
    }
}
