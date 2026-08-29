import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isDevMode } from '@/lib/config'
import * as commitmentStore from '@/lib/commitments/store'

export const dynamic = 'force-dynamic'

// GET /api/commitments/[id] - commitment detail with append-only audit log
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params

    if (isDevMode) {
        const commitment = commitmentStore.getCommitmentById(id)
        if (!commitment) {
            return NextResponse.json({ error: 'Commitment not found' }, { status: 404 })
        }
        return NextResponse.json(commitment)
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: commitment, error } = await supabase
        .from('commitments')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !commitment) {
        return NextResponse.json({ error: 'Commitment not found' }, { status: 404 })
    }

    const { data: audit } = await supabase
        .from('commitment_audit')
        .select('*')
        .eq('commitment_id', id)
        .order('at', { ascending: true })

    return NextResponse.json({ ...commitment, audit: audit ?? [] })
}
