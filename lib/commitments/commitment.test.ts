import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { LEGAL_TRANSITIONS, assertTransition, recordAudit } from './machine'
import {
    createCommitment,
    getCommitmentAudit,
    transitionCommitment,
} from './service'
import { createMemoryStore } from './store-memory'
import { CommitmentError } from './types'
import { SYNTHETIC_COUNTERPARTIES } from './seed'

const BUSINESS_ID = '11111111-1111-4111-8111-111111111111'
const ACTOR = 'tester@example.com'

const validDraft = {
    business_id: BUSINESS_ID,
    commodity_class: 'chilled_bivalves' as const,
    volume: 10,
    unit: 'mt' as const,
    incoterm: 'FOB' as const,
    ship_window_from: '2026-09-10',
    ship_window_to: '2026-09-14',
    currency: 'CAD' as const,
}

async function seededService() {
    const store = createMemoryStore([BUSINESS_ID])
    const commitment = await createCommitment(store, validDraft, ACTOR)
    return { store, commitment }
}

describe('commitment state machine', () => {
    it('allows the closed path draft → internal_ok → send_hold → confirmed', async () => {
        const { store, commitment } = await seededService()
        const ok = await transitionCommitment(store, commitment.id, 'internal_ok', {
            actor: ACTOR,
            human_ok: true,
        })
        assert.equal(ok.commitment.status, 'internal_ok')

        const held = await transitionCommitment(store, commitment.id, 'send_hold', {
            actor: ACTOR,
        })
        assert.equal(held.commitment.status, 'send_hold')

        const confirmed = await transitionCommitment(store, commitment.id, 'confirmed', {
            actor: ACTOR,
        })
        assert.equal(confirmed.commitment.status, 'confirmed')
    })

    it('allows send_hold → killed', async () => {
        const { store, commitment } = await seededService()
        await transitionCommitment(store, commitment.id, 'internal_ok', {
            actor: ACTOR,
            human_ok: true,
        })
        await transitionCommitment(store, commitment.id, 'send_hold', { actor: ACTOR })
        const killed = await transitionCommitment(store, commitment.id, 'killed', {
            actor: ACTOR,
        })
        assert.equal(killed.commitment.status, 'killed')
    })

    it('rejects illegal transitions', () => {
        assert.throws(
            () => assertTransition('draft', 'send_hold', { human_ok: true }),
            (err: unknown) =>
                err instanceof CommitmentError && err.code === 'illegal_transition'
        )
        assert.throws(
            () => assertTransition('draft', 'confirmed', { human_ok: true }),
            (err: unknown) =>
                err instanceof CommitmentError && err.code === 'illegal_transition'
        )
        assert.throws(
            () => assertTransition('internal_ok', 'confirmed', {}),
            (err: unknown) =>
                err instanceof CommitmentError && err.code === 'illegal_transition'
        )
        assert.throws(
            () => assertTransition('confirmed', 'killed', {}),
            (err: unknown) =>
                err instanceof CommitmentError && err.code === 'illegal_transition'
        )
        assert.throws(
            () => assertTransition('killed', 'draft', {}),
            (err: unknown) =>
                err instanceof CommitmentError && err.code === 'illegal_transition'
        )
    })

    it('creates as draft even if the client asks for another status', async () => {
        const store = createMemoryStore([BUSINESS_ID])
        const commitment = await createCommitment(
            store,
            { ...validDraft, status: 'confirmed' },
            ACTOR
        )
        assert.equal(commitment.status, 'draft')
    })

    it('has no reverse edges or CRM pipeline stages', () => {
        assert.deepEqual(Object.keys(LEGAL_TRANSITIONS), [
            'draft',
            'internal_ok',
            'send_hold',
            'confirmed',
            'killed',
        ])
        assert.equal(LEGAL_TRANSITIONS.confirmed.length, 0)
        assert.equal(LEGAL_TRANSITIONS.killed.length, 0)
    })
})

describe('HITL gate', () => {
    it('blocks leaving draft without human_ok', async () => {
        const { store, commitment } = await seededService()
        await assert.rejects(
            () =>
                transitionCommitment(store, commitment.id, 'internal_ok', {
                    actor: ACTOR,
                }),
            (err: unknown) =>
                err instanceof CommitmentError && err.code === 'hitl_required'
        )
        const still = await store.get(commitment.id)
        assert.equal(still?.status, 'draft')
        assert.equal((await getCommitmentAudit(store, commitment.id)).length, 0)
    })

    it('blocks leaving draft when human_ok is false', async () => {
        const { store, commitment } = await seededService()
        await assert.rejects(
            () =>
                transitionCommitment(store, commitment.id, 'internal_ok', {
                    actor: ACTOR,
                    human_ok: false,
                }),
            (err: unknown) =>
                err instanceof CommitmentError && err.code === 'hitl_required'
        )
    })

    it('advances draft → internal_ok only when human_ok is true', async () => {
        const { store, commitment } = await seededService()
        const next = await transitionCommitment(store, commitment.id, 'internal_ok', {
            actor: ACTOR,
            human_ok: true,
        })
        assert.equal(next.commitment.status, 'internal_ok')
        assert.ok(next.commitment.human_ok_at)
        assert.equal(next.commitment.human_ok_by, ACTOR)
    })

    it('does not require human_ok after draft', async () => {
        const { store, commitment } = await seededService()
        await transitionCommitment(store, commitment.id, 'internal_ok', {
            actor: ACTOR,
            human_ok: true,
        })
        const held = await transitionCommitment(store, commitment.id, 'send_hold', {
            actor: ACTOR,
        })
        assert.equal(held.commitment.status, 'send_hold')
    })
})

describe('fail closed create', () => {
    it('rejects a commitment without business_id', async () => {
        const store = createMemoryStore([BUSINESS_ID])
        await assert.rejects(
            () =>
                createCommitment(
                    store,
                    { ...validDraft, business_id: undefined },
                    ACTOR
                ),
            (err: unknown) =>
                err instanceof CommitmentError && err.code === 'missing_business'
        )
    })

    it('rejects a business_id that does not exist', async () => {
        const store = createMemoryStore([])
        await assert.rejects(
            () => createCommitment(store, validDraft, ACTOR),
            (err: unknown) =>
                err instanceof CommitmentError && err.code === 'missing_business'
        )
    })

    it('rejects a missing ship window', async () => {
        const store = createMemoryStore([BUSINESS_ID])
        await assert.rejects(
            () =>
                createCommitment(
                    store,
                    { ...validDraft, ship_window_from: '', ship_window_to: '' },
                    ACTOR
                ),
            (err: unknown) =>
                err instanceof CommitmentError && err.code === 'missing_ship_window'
        )
        await assert.rejects(
            () =>
                createCommitment(
                    store,
                    { ...validDraft, ship_window_to: undefined },
                    ACTOR
                ),
            (err: unknown) =>
                err instanceof CommitmentError && err.code === 'missing_ship_window'
        )
    })

    it('rejects an inverted ship window', async () => {
        const store = createMemoryStore([BUSINESS_ID])
        await assert.rejects(
            () =>
                createCommitment(
                    store,
                    {
                        ...validDraft,
                        ship_window_from: '2026-09-20',
                        ship_window_to: '2026-09-10',
                    },
                    ACTOR
                ),
            (err: unknown) =>
                err instanceof CommitmentError && err.code === 'invalid_ship_window'
        )
    })
})

describe('append-only audit', () => {
    it('writes who/when/from/to on every status change', async () => {
        const { store, commitment } = await seededService()
        await transitionCommitment(store, commitment.id, 'internal_ok', {
            actor: ACTOR,
            human_ok: true,
        })
        await transitionCommitment(store, commitment.id, 'send_hold', {
            actor: 'second@example.com',
        })

        const log = await getCommitmentAudit(store, commitment.id)
        assert.equal(log.length, 2)
        assert.equal(log[0].from_status, 'draft')
        assert.equal(log[0].to_status, 'internal_ok')
        assert.equal(log[0].actor, ACTOR)
        assert.ok(log[0].at)
        assert.equal(log[1].from_status, 'internal_ok')
        assert.equal(log[1].to_status, 'send_hold')
        assert.equal(log[1].actor, 'second@example.com')
    })

    it('does not append audit when a transition is rejected', async () => {
        const { store, commitment } = await seededService()
        await assert.rejects(() =>
            transitionCommitment(store, commitment.id, 'confirmed', {
                actor: ACTOR,
                human_ok: true,
            })
        )
        assert.equal((await getCommitmentAudit(store, commitment.id)).length, 0)
    })

    it('leaves prior audit rows unchanged after a later transition', async () => {
        const { store, commitment } = await seededService()
        await transitionCommitment(store, commitment.id, 'internal_ok', {
            actor: ACTOR,
            human_ok: true,
        })
        const first = await getCommitmentAudit(store, commitment.id)
        const snapshot = structuredClone(first[0])

        await transitionCommitment(store, commitment.id, 'send_hold', { actor: ACTOR })
        const log = await getCommitmentAudit(store, commitment.id)
        assert.equal(log.length, 2)
        assert.deepEqual(log[0], snapshot)
    })

    it('requires an actor on the audit record', () => {
        assert.throws(
            () =>
                recordAudit({
                    commitmentId: BUSINESS_ID,
                    actor: '  ',
                    from: 'draft',
                    to: 'internal_ok',
                }),
            (err: unknown) =>
                err instanceof CommitmentError && err.code === 'invalid_input'
        )
    })

    it('memory store has no audit mutate API', () => {
        const store = createMemoryStore()
        assert.equal(
            'updateAudit' in store || 'deleteAudit' in store || 'replaceAudit' in store,
            false
        )
    })
})

describe('synthetic seed + forbidden strings', () => {
    it('seeds only named synthetic counterparties', () => {
        assert.ok(SYNTHETIC_COUNTERPARTIES.length >= 3)
        for (const row of SYNTHETIC_COUNTERPARTIES) {
            assert.equal(row.source_ref, 'synthetic-counterparty')
        }
    })

    it('keeps forbidden strings out of this hub', () => {
        const forbidden = ['cone' + 'xus', 'gid' + 'ney', 'lob' + 'ster', 'tara' + '@']
        const root = join(process.cwd())
        const skip = new Set(['node_modules', '.git', '.next', '.dev-data'])

        function walk(dir: string, acc: string[] = []): string[] {
            for (const name of readdirSync(dir)) {
                if (skip.has(name)) continue
                const full = join(dir, name)
                const st = statSync(full)
                if (st.isDirectory()) walk(full, acc)
                else acc.push(full)
            }
            return acc
        }

        const hits: string[] = []
        for (const file of walk(root)) {
            if (!/\.(ts|tsx|js|mjs|sql|md|json|sh)$/.test(file)) continue
            const text = readFileSync(file, 'utf8').toLowerCase()
            for (const word of forbidden) {
                if (text.includes(word)) {
                    hits.push(`${relative(root, file)}:${word}`)
                }
            }
        }
        assert.deepEqual(hits, [])
    })
})
