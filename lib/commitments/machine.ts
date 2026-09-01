import {
    CommitmentError,
    type CommitmentAuditEntry,
    type CommitmentStatus,
} from './types'

/** Closed set. Anything else is illegal. */
export const LEGAL_TRANSITIONS: Record<CommitmentStatus, readonly CommitmentStatus[]> = {
    draft: ['internal_ok'],
    internal_ok: ['send_hold'],
    send_hold: ['confirmed', 'killed'],
    confirmed: [],
    killed: [],
}

/**
 * Fail closed: unknown edges rejected. Leaving draft requires human_ok === true.
 * send_hold is terminal-ready; this function never sends mail or posts to a network.
 */
export function assertTransition(
    from: CommitmentStatus,
    to: CommitmentStatus,
    opts: { human_ok?: boolean }
): void {
    const allowed = LEGAL_TRANSITIONS[from]
    if (!allowed.includes(to)) {
        throw new CommitmentError(
            'illegal_transition',
            `Illegal transition ${from} → ${to}`
        )
    }
    if (from === 'draft' && opts.human_ok !== true) {
        throw new CommitmentError(
            'hitl_required',
            'Leaving draft requires explicit human_ok'
        )
    }
}

export function recordAudit(args: {
    commitmentId: string
    actor: string
    from: CommitmentStatus
    to: CommitmentStatus
    at?: string
}): CommitmentAuditEntry {
    if (!args.actor || !args.actor.trim()) {
        throw new CommitmentError('invalid_input', 'Audit requires an actor')
    }
    return {
        id: crypto.randomUUID(),
        commitment_id: args.commitmentId,
        actor: args.actor,
        at: args.at ?? new Date().toISOString(),
        from_status: args.from,
        to_status: args.to,
    }
}
