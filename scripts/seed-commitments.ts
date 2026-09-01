import { createBusiness, getBusinesses } from '../lib/dev-store'
import { createDevStore } from '../lib/commitments/store-dev'
import {
    SYNTHETIC_COUNTERPARTIES,
    SYNTHETIC_SOURCE_REF,
    draftCommitmentFor,
} from '../lib/commitments/seed'
import { createCommitment, transitionCommitment } from '../lib/commitments/service'

async function main() {
    const actor = 'seed-script'
    const businesses = []

    for (const counterparty of SYNTHETIC_COUNTERPARTIES) {
        const existing = getBusinesses().find(
            (b) => b.name === counterparty.name && b.source_ref === SYNTHETIC_SOURCE_REF
        )
        businesses.push(existing ?? createBusiness(counterparty))
    }

    const store = createDevStore()
    const existingCommitments = await store.list()
    const created = []

    for (let i = 0; i < Math.min(3, businesses.length); i++) {
        const already = existingCommitments.find((c) => c.business_id === businesses[i].id)
        if (already) {
            created.push(already)
            continue
        }
        created.push(await createCommitment(store, draftCommitmentFor(businesses[i].id, i), actor))
    }

    const walkable = created.find((c) => c.status === 'draft')
    if (walkable) {
        await transitionCommitment(store, walkable.id, 'internal_ok', {
            actor,
            human_ok: true,
        })
        await transitionCommitment(store, walkable.id, 'send_hold', { actor })
    }

    console.log(`Seeded ${businesses.length} synthetic counterparties and ${created.length} commitments.`)
    console.log('send_hold is ready-to-send and blocked on purpose. No outbound send.')
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
