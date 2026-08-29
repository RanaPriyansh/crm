import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
    ALLOWED_TRANSITIONS,
    applyTransition,
    canTransition,
    HitlRequiredError,
    IllegalTransitionError,
    isTerminal,
    requiresHumanOk,
} from './state-machine.ts'
import type { Commitment, CommitmentStatus } from './types.ts'

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

test('legal transitions follow draft -> internal_ok -> send_hold -> confirmed|killed', () => {
    assert.ok(canTransition('draft', 'internal_ok'))
    assert.ok(canTransition('internal_ok', 'send_hold'))
    assert.ok(canTransition('send_hold', 'confirmed'))
    assert.ok(canTransition('send_hold', 'killed'))
})

test('illegal transitions are rejected (fail closed)', () => {
    // Skipping a step.
    assert.equal(canTransition('draft', 'send_hold'), false)
    assert.equal(canTransition('draft', 'confirmed'), false)
    assert.equal(canTransition('internal_ok', 'confirmed'), false)
    // Killing before send_hold is not allowed by the machine.
    assert.equal(canTransition('draft', 'killed'), false)
    assert.equal(canTransition('internal_ok', 'killed'), false)
    // Going backwards.
    assert.equal(canTransition('internal_ok', 'draft'), false)
    assert.equal(canTransition('send_hold', 'internal_ok'), false)
})

test('terminal states allow no transitions', () => {
    assert.ok(isTerminal('confirmed'))
    assert.ok(isTerminal('killed'))
    assert.equal(ALLOWED_TRANSITIONS.confirmed.length, 0)
    assert.equal(ALLOWED_TRANSITIONS.killed.length, 0)
    for (const to of ['draft', 'internal_ok', 'send_hold', 'confirmed', 'killed'] as CommitmentStatus[]) {
        assert.equal(canTransition('confirmed', to), false)
        assert.equal(canTransition('killed', to), false)
    }
})

test('applyTransition throws IllegalTransitionError on an illegal move', () => {
    const c = baseCommitment({ status: 'draft' })
    assert.throws(
        () => applyTransition(c, { to: 'confirmed', actor: 'tester', humanOk: true }),
        IllegalTransitionError,
    )
})

test('applyTransition does not mutate its input', () => {
    const c = baseCommitment({ status: 'send_hold' })
    const snapshot = JSON.parse(JSON.stringify(c))
    applyTransition(c, { to: 'confirmed', actor: 'tester', humanOk: true, at: '2030-02-02T00:00:00.000Z' })
    assert.deepEqual(c, snapshot)
})

test('advancing a valid step updates status and timestamp', () => {
    const c = baseCommitment({ status: 'internal_ok' })
    const { commitment } = applyTransition(c, {
        to: 'send_hold',
        actor: 'tester',
        humanOk: false,
        at: '2030-03-03T00:00:00.000Z',
    })
    assert.equal(commitment.status, 'send_hold')
    assert.equal(commitment.updated_at, '2030-03-03T00:00:00.000Z')
})

// --- HITL gate ---

test('requiresHumanOk is true only when leaving draft', () => {
    assert.equal(requiresHumanOk('draft'), true)
    assert.equal(requiresHumanOk('internal_ok'), false)
    assert.equal(requiresHumanOk('send_hold'), false)
})

test('leaving draft without human_ok is blocked (HitlRequiredError)', () => {
    const c = baseCommitment({ status: 'draft' })
    assert.throws(
        () => applyTransition(c, { to: 'internal_ok', actor: 'tester', humanOk: false }),
        HitlRequiredError,
    )
})

test('leaving draft with human_ok=true succeeds and records the attestation', () => {
    const c = baseCommitment({ status: 'draft', human_ok: false })
    const { commitment, audit } = applyTransition(c, {
        to: 'internal_ok',
        actor: 'tester',
        humanOk: true,
    })
    assert.equal(commitment.status, 'internal_ok')
    assert.equal(commitment.human_ok, true)
    assert.equal(audit.human_ok, true)
})

test('later transitions do not require human_ok', () => {
    const c = baseCommitment({ status: 'internal_ok', human_ok: true })
    assert.doesNotThrow(() =>
        applyTransition(c, { to: 'send_hold', actor: 'tester', humanOk: false }),
    )
})
