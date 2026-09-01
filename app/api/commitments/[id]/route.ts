import { NextResponse } from 'next/server'
import { CommitmentError, getCommitment, getCommitmentAudit } from '@/lib/commitments'
import { getCommitmentStore } from '@/lib/commitments/get-store'
import { httpStatusFor } from '@/lib/commitments/service'
import { isDevMode } from '@/lib/config'
import * as devStore from '@/lib/dev-store'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const store = await getCommitmentStore()
        const commitment = await getCommitment(store, id)
        const audit = await getCommitmentAudit(store, id)

        let counterparty_name: string | null = null
        if (isDevMode) {
            counterparty_name = devStore.getBusinessById(commitment.business_id)?.name ?? null
        } else {
            const supabase = await createClient()
            const { data } = await supabase
                .from('businesses')
                .select('name')
                .eq('id', commitment.business_id)
                .maybeSingle()
            counterparty_name = data?.name ?? null
        }

        return NextResponse.json({ ...commitment, counterparty_name, audit })
    } catch (error) {
        if (error instanceof CommitmentError) {
            return NextResponse.json(
                { error: error.message, code: error.code },
                { status: httpStatusFor(error) }
            )
        }
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch commitment' }, { status: 500 })
    }
}
