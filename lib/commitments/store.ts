// Dev-mode persistence for commitments (local JSON, mirrors lib/dev-store.ts).
// Production persistence lives inline in the API routes via Supabase.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import type { Commitment, CommitmentAuditEntry, CommitmentInput } from './types'
import { applyTransition, type TransitionResult } from './state-machine'

const DEV_DATA_DIR = path.join(process.cwd(), '.dev-data')

function ensureDir() {
    if (!existsSync(DEV_DATA_DIR)) {
        mkdirSync(DEV_DATA_DIR, { recursive: true })
    }
}

function readStore<T>(name: string): T[] {
    ensureDir()
    const filePath = path.join(DEV_DATA_DIR, `${name}.json`)
    if (!existsSync(filePath)) return []
    return JSON.parse(readFileSync(filePath, 'utf-8'))
}

function writeStore<T>(name: string, data: T[]) {
    ensureDir()
    const filePath = path.join(DEV_DATA_DIR, `${name}.json`)
    writeFileSync(filePath, JSON.stringify(data, null, 2))
}

const COMMITMENTS = 'commitments'
const AUDIT = 'commitment_audit'

export function getCommitments(): Commitment[] {
    return readStore<Commitment>(COMMITMENTS).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
}

export function getCommitmentAudit(commitmentId: string): CommitmentAuditEntry[] {
    return readStore<CommitmentAuditEntry>(AUDIT)
        .filter((e) => e.commitment_id === commitmentId)
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
}

export function getCommitmentById(
    id: string,
): (Commitment & { audit: CommitmentAuditEntry[] }) | null {
    const commitment = readStore<Commitment>(COMMITMENTS).find((c) => c.id === id)
    if (!commitment) return null
    return { ...commitment, audit: getCommitmentAudit(id) }
}

export function createCommitment(
    input: CommitmentInput,
    actor: string,
    counterpartyName: string | null,
): Commitment {
    const commitments = readStore<Commitment>(COMMITMENTS)
    const now = new Date().toISOString()

    const commitment: Commitment = {
        id: crypto.randomUUID(),
        business_id: input.business_id,
        counterparty_name: counterpartyName,
        commodity_class: input.commodity_class,
        volume: input.volume,
        unit: input.unit,
        incoterm: input.incoterm,
        ship_window_from: input.ship_window_from,
        ship_window_to: input.ship_window_to,
        currency: input.currency,
        status: 'draft',
        human_ok: false,
        notes: input.notes ?? null,
        created_by: actor,
        created_at: now,
        updated_at: now,
    }

    commitments.push(commitment)
    writeStore(COMMITMENTS, commitments)

    // Append-only: record creation as the first audit row.
    appendAuditRow({
        id: crypto.randomUUID(),
        commitment_id: commitment.id,
        actor,
        from_status: null,
        to_status: 'draft',
        human_ok: false,
        note: 'created',
        at: now,
    })

    return commitment
}

function appendAuditRow(entry: CommitmentAuditEntry) {
    const log = readStore<CommitmentAuditEntry>(AUDIT)
    log.push(entry)
    writeStore(AUDIT, log)
}

export type TransitionOutcome =
    | { ok: true; result: TransitionResult }
    | { ok: false; reason: 'not_found' }

// Applies a status transition using the pure state machine, then persists the
// updated commitment and appends the audit row. Throws IllegalTransitionError /
// HitlRequiredError on invalid transitions (callers map these to HTTP codes).
export function transitionCommitment(
    id: string,
    opts: { to: Commitment['status']; actor: string; humanOk: boolean; note?: string | null },
): TransitionOutcome {
    const commitments = readStore<Commitment>(COMMITMENTS)
    const index = commitments.findIndex((c) => c.id === id)
    if (index === -1) return { ok: false, reason: 'not_found' }

    const result = applyTransition(commitments[index], {
        to: opts.to,
        actor: opts.actor,
        humanOk: opts.humanOk,
        note: opts.note ?? null,
    })

    commitments[index] = result.commitment
    writeStore(COMMITMENTS, commitments)
    appendAuditRow(result.audit)

    return { ok: true, result }
}
