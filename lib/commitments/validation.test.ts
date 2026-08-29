import { test } from 'node:test'
import assert from 'node:assert/strict'

import { validateCommitmentInput } from './validation.ts'

function validInput(overrides: Record<string, unknown> = {}) {
    return {
        business_id: 'b-123',
        commodity_class: 'fresh_finfish',
        volume: 100,
        unit: 'kg',
        incoterm: 'FOB',
        ship_window_from: '2030-01-01',
        ship_window_to: '2030-01-10',
        currency: 'CAD',
        ...overrides,
    }
}

test('accepts a well-formed commitment input', () => {
    const res = validateCommitmentInput(validInput())
    assert.equal(res.ok, true)
})

test('fails closed when business_id is missing', () => {
    const res = validateCommitmentInput(validInput({ business_id: undefined }))
    assert.equal(res.ok, false)
    if (!res.ok) assert.ok(res.errors.business_id)
})

test('fails closed when business_id is empty', () => {
    const res = validateCommitmentInput(validInput({ business_id: '' }))
    assert.equal(res.ok, false)
    if (!res.ok) assert.ok(res.errors.business_id)
})

test('fails closed when ship window start is missing', () => {
    const res = validateCommitmentInput(validInput({ ship_window_from: undefined }))
    assert.equal(res.ok, false)
    if (!res.ok) assert.ok(res.errors.ship_window_from)
})

test('fails closed when ship window end is missing', () => {
    const res = validateCommitmentInput(validInput({ ship_window_to: undefined }))
    assert.equal(res.ok, false)
    if (!res.ok) assert.ok(res.errors.ship_window_to)
})

test('rejects a ship window where start is after end', () => {
    const res = validateCommitmentInput(
        validInput({ ship_window_from: '2030-02-01', ship_window_to: '2030-01-01' }),
    )
    assert.equal(res.ok, false)
    if (!res.ok) assert.ok(res.errors.ship_window_to)
})

test('rejects non-positive volume', () => {
    const res = validateCommitmentInput(validInput({ volume: 0 }))
    assert.equal(res.ok, false)
    if (!res.ok) assert.ok(res.errors.volume)
})

test('rejects an unknown commodity class', () => {
    const res = validateCommitmentInput(validInput({ commodity_class: 'gold_bars' }))
    assert.equal(res.ok, false)
})

test('rejects an unknown incoterm', () => {
    const res = validateCommitmentInput(validInput({ incoterm: 'ZZZ' }))
    assert.equal(res.ok, false)
})

test('rejects an invalid ship window date format', () => {
    const res = validateCommitmentInput(validInput({ ship_window_from: '01/01/2030' }))
    assert.equal(res.ok, false)
})
