// Commitment status machine + human-in-the-loop gate.
//
// Legal path:  draft -> internal_ok -> send_hold -> confirmed | killed
//
// Everything not explicitly allowed is rejected (fail closed). `send_hold`
// means "ready to send, deliberately blocked" — there is no live send here.

import type {
    Commitment,
    CommitmentAuditEntry,
    CommitmentStatus,
} from './types'

export const COMMITMENT_STATUSES: readonly CommitmentStatus[] = [
    'draft',
    'internal_ok',
    'send_hold',
    'confirmed',
    'killed',
]

export const ALLOWED_TRANSITIONS: Record<CommitmentStatus, readonly CommitmentStatus[]> = {
    draft: ['internal_ok'],
    internal_ok: ['send_hold'],
    send_hold: ['confirmed', 'killed'],
    confirmed: [],
    killed: [],
}

export function isTerminal(status: CommitmentStatus): boolean {
    return ALLOWED_TRANSITIONS[status].length === 0
}

export function canTransition(from: CommitmentStatus, to: CommitmentStatus): boolean {
    const targets = ALLOWED_TRANSITIONS[from]
    return targets ? targets.includes(to) : false
}

// Leaving draft always requires an explicit human attestation.
export function requiresHumanOk(from: CommitmentStatus): boolean {
    return from === 'draft'
}

export class IllegalTransitionError extends Error {
    code = 'illegal_transition' as const
    from: CommitmentStatus
    to: CommitmentStatus
    constructor(from: CommitmentStatus, to: CommitmentStatus) {
        super(`Illegal transition: ${from} -> ${to}`)
        this.name = 'IllegalTransitionError'
        this.from = from
        this.to = to
    }
}

export class HitlRequiredError extends Error {
    code = 'hitl_required' as const
    from: CommitmentStatus
    to: CommitmentStatus
    constructor(from: CommitmentStatus, to: CommitmentStatus) {
        super(`Human sign-off (human_ok) is required to leave ${from}`)
        this.name = 'HitlRequiredError'
        this.from = from
        this.to = to
    }
}

export function assertTransition(from: CommitmentStatus, to: CommitmentStatus): void {
    if (!canTransition(from, to)) {
        throw new IllegalTransitionError(from, to)
    }
}

interface TransitionOptions {
    to: CommitmentStatus
    actor: string
    humanOk: boolean
    note?: string | null
    at?: string
    id?: string
}

export interface TransitionResult {
    commitment: Commitment
    audit: CommitmentAuditEntry
}

// Pure: validates the transition + HITL gate, then returns an updated commitment
// (new object) and the audit entry to append. Never mutates its inputs.
export function applyTransition(commitment: Commitment, opts: TransitionOptions): TransitionResult {
    const from = commitment.status
    const { to, actor, humanOk } = opts

    assertTransition(from, to)

    if (requiresHumanOk(from) && humanOk !== true) {
        throw new HitlRequiredError(from, to)
    }

    const at = opts.at ?? new Date().toISOString()

    const updated: Commitment = {
        ...commitment,
        status: to,
        human_ok: commitment.human_ok || humanOk === true,
        updated_at: at,
    }

    const audit: CommitmentAuditEntry = {
        id: opts.id ?? crypto.randomUUID(),
        commitment_id: commitment.id,
        actor,
        from_status: from,
        to_status: to,
        human_ok: humanOk === true,
        note: opts.note ?? null,
        at,
    }

    return { commitment: updated, audit }
}

// Append-only helper: returns a new log with the entry appended; never edits
// or removes existing entries.
export function appendAudit(
    log: readonly CommitmentAuditEntry[],
    entry: CommitmentAuditEntry,
): CommitmentAuditEntry[] {
    return [...log, entry]
}
