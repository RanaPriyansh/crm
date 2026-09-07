import { assertTransition, recordAudit } from './machine'
import {
    CommitmentError,
    type Commitment,
    type CommitmentCreateInput,
    type CommitmentStatus,
    type CommitmentStore,
} from './types'
import { validateCreateInput } from './validate'

function nowIso(): string {
    return new Date().toISOString()
}

export async function createCommitment(
    store: CommitmentStore,
    input: unknown,
    actor: string
): Promise<Commitment> {
    const data: CommitmentCreateInput = validateCreateInput(input)

    if (!(await store.businessExists(data.business_id))) {
        throw new CommitmentError('missing_business', 'No commitment without a business_id')
    }

    const timestamp = nowIso()
    const commitment: Commitment = {
        id: crypto.randomUUID(),
        business_id: data.business_id,
        commodity_class: data.commodity_class,
        volume: data.volume,
        unit: data.unit,
        incoterm: data.incoterm,
        ship_window_from: data.ship_window_from,
        ship_window_to: data.ship_window_to,
        currency: data.currency,
        status: 'draft',
        human_ok_at: null,
        human_ok_by: null,
        created_by: actor,
        created_at: timestamp,
        updated_at: timestamp,
    }

    await store.insert(commitment)
    return commitment
}

export async function transitionCommitment(
    store: CommitmentStore,
    id: string,
    to: CommitmentStatus,
    opts: { human_ok?: boolean; actor: string }
): Promise<{ commitment: Commitment }> {
    const current = await store.get(id)
    if (!current) {
        throw new CommitmentError('not_found', 'Commitment not found')
    }

    assertTransition(current.status, to, { human_ok: opts.human_ok })

    const timestamp = nowIso()
    const next: Commitment = {
        ...current,
        status: to,
        updated_at: timestamp,
        human_ok_at:
            current.status === 'draft' ? timestamp : current.human_ok_at,
        human_ok_by:
            current.status === 'draft' ? opts.actor : current.human_ok_by,
    }

    const audit = recordAudit({
        commitmentId: current.id,
        actor: opts.actor,
        from: current.status,
        to,
        at: timestamp,
    })

    await store.update(next)
    await store.appendAudit(audit)
    return { commitment: next }
}

export async function listCommitments(store: CommitmentStore): Promise<Commitment[]> {
    const rows = await store.list()
    return [...rows].sort((a, b) =>
        a.ship_window_from.localeCompare(b.ship_window_from)
    )
}

export async function getCommitment(
    store: CommitmentStore,
    id: string
): Promise<Commitment> {
    const row = await store.get(id)
    if (!row) {
        throw new CommitmentError('not_found', 'Commitment not found')
    }
    return row
}

export async function getCommitmentAudit(store: CommitmentStore, id: string) {
    return store.listAudit(id)
}

export function httpStatusFor(error: CommitmentError): number {
    switch (error.code) {
        case 'not_found':
            return 404
        case 'hitl_required':
            return 403
        case 'illegal_transition':
        case 'not_draft':
            return 409
        default:
            return 400
    }
}
