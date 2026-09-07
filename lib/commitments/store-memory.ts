import type { Commitment, CommitmentAuditEntry, CommitmentStore } from './types'

export function createMemoryStore(existingBusinessIds: Iterable<string> = []): CommitmentStore {
    const commitments = new Map<string, Commitment>()
    const audit: CommitmentAuditEntry[] = []
    const businesses = new Set(existingBusinessIds)

    return {
        async insert(commitment) {
            commitments.set(commitment.id, { ...commitment })
        },
        async get(id) {
            const row = commitments.get(id)
            return row ? { ...row } : null
        },
        async update(commitment) {
            if (!commitments.has(commitment.id)) return
            commitments.set(commitment.id, { ...commitment })
        },
        async list() {
            return [...commitments.values()].map((row) => ({ ...row }))
        },
        async appendAudit(entry) {
            audit.push(Object.freeze({ ...entry }))
        },
        async listAudit(commitmentId) {
            return audit
                .filter((row) => row.commitment_id === commitmentId)
                .map((row) => ({ ...row }))
        },
        async businessExists(id) {
            return businesses.has(id)
        },
    }
}
