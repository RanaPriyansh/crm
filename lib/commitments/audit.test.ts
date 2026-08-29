import { test } from 'node:test'
import assert from 'node:assert/strict'

import { appendAudit, applyTransition } from './state-machine.ts'
import type { Commitment, CommitmentAuditEntry } from './types.ts'

function baseCommitment(overrides: Partial<Commitment> = {}): Commitment {
    return {
        id: 'c1',
        business_id: 'b1',
        counterparty_name: 'Synthetic Co',
        commodity_class: 'fresh_finfish',
        volume: 100,
        unit: 'kg',
        incoterm: 'FOB',
        ship_window_from: '2030-01-01',
        ship_window_to: '2030-01-10',
        currency: 'CAD',
        status: 'draft',
        human_ok: false,
        notes: null,
        created_by: 'tester',
        created_at: '2030-01-01T00:00:00.000Z',
        updated_at: '2030-01-01T00:00:00.000Z',
        ...overrides,
    }
}

test('each transition emits an audit entry with who/when/from/to', () => {
    const c = baseCommitment({ status: 'draft' })
    const { audit } = applyTransition(c, {
        to: 'internal_ok',
        actor: 'alice',
        humanOk: true,
        note: 'looks good',
        at: '2030-01-02T09:00:00.000Z',
    })
    assert.equal(audit.commitment_id, 'c1')
    assert.equal(audit.actor, 'alice')
    assert.equal(audit.from_status, 'draft')
    assert.equal(audit.to_status, 'internal_ok')
    assert.equal(audit.human_ok, true)
    assert.equal(audit.note, 'looks good')
    assert.equal(audit.at, '2030-01-02T09:00:00.000Z')
    assert.ok(audit.id)
})

test('appendAudit is append-only: it never mutates the existing log', () => {
    const first: CommitmentAuditEntry = {
        id: 'a1',
        commitment_id: 'c1',
        actor: 'alice',
        from_status: null,
        to_status: 'draft',
        human_ok: false,
        note: 'created',
        at: '2030-01-01T00:00:00.000Z',
    }
    const log = [first]
    const snapshot = JSON.parse(JSON.stringify(log))

    const next: CommitmentAuditEntry = {
        id: 'a2',
        commitment_id: 'c1',
        actor: 'alice',
        from_status: 'draft',
        to_status: 'internal_ok',
        human_ok: true,
        note: null,
        at: '2030-01-02T00:00:00.000Z',
    }
    const updated = appendAudit(log, next)

    assert.equal(updated.length, 2)
    assert.deepEqual(log, snapshot) // original untouched
    assert.notEqual(updated, log) // new array
    assert.deepEqual(updated[0], first) // prior entry preserved verbatim
})

test('a full lifecycle produces an ordered from/to chain', () => {
    let commitment = baseCommitment({ status: 'draft' })
    let log: CommitmentAuditEntry[] = []

    const steps: { to: Commitment['status']; humanOk: boolean; at: string }[] = [
        { to: 'internal_ok', humanOk: true, at: '2030-01-02T00:00:00.000Z' },
        { to: 'send_hold', humanOk: false, at: '2030-01-03T00:00:00.000Z' },
        { to: 'confirmed', humanOk: false, at: '2030-01-04T00:00:00.000Z' },
    ]

    for (const step of steps) {
        const res = applyTransition(commitment, {
            to: step.to,
            actor: 'alice',
            humanOk: step.humanOk,
            at: step.at,
        })
        commitment = res.commitment
        log = appendAudit(log, res.audit)
    }

    assert.equal(commitment.status, 'confirmed')
    assert.deepEqual(
        log.map((e) => `${e.from_status}->${e.to_status}`),
        ['draft->internal_ok', 'internal_ok->send_hold', 'send_hold->confirmed'],
    )
})
