import { NextResponse } from 'next/server'
import { isDevMode } from '@/lib/config'
import {
    CommitmentError,
    createCommitment,
    listCommitments,
} from '@/lib/commitments'
import { currentActor, getCommitmentStore } from '@/lib/commitments/get-store'
import { httpStatusFor } from '@/lib/commitments/service'
import * as devStore from '@/lib/dev-store'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function businessName(id: string): Promise<string | null> {
    if (isDevMode) {
        return devStore.getBusinessById(id)?.name ?? null
    }
    const supabase = await createClient()
    const { data } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', id)
        .maybeSingle()
    return data?.name ?? null
}

export async function GET() {
    try {
        const store = await getCommitmentStore()
        const rows = await listCommitments(store)
        const data = await Promise.all(
            rows.map(async (row) => ({
                ...row,
                counterparty_name: await businessName(row.business_id),
            }))
        )
        return NextResponse.json({ data })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to list commitments' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const store = await getCommitmentStore()
        const actor = await currentActor()
        const commitment = await createCommitment(store, body, actor)
        return NextResponse.json(commitment, { status: 201 })
    } catch (error) {
        if (error instanceof CommitmentError) {
            return NextResponse.json(
                { error: error.message, code: error.code },
                { status: httpStatusFor(error) }
            )
        }
        console.error(error)
        return NextResponse.json({ error: 'Failed to create commitment' }, { status: 500 })
    }
}
