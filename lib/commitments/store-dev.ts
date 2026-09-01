import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import * as devStore from '@/lib/dev-store'
import type { Commitment, CommitmentAuditEntry, CommitmentStore } from './types'

const DEV_DATA_DIR = path.join(process.cwd(), '.dev-data')

function ensureDir() {
    if (!existsSync(DEV_DATA_DIR)) {
        mkdirSync(DEV_DATA_DIR, { recursive: true })
    }
}

function readJson<T>(name: string): T[] {
    ensureDir()
    const filePath = path.join(DEV_DATA_DIR, `${name}.json`)
    if (!existsSync(filePath)) return []
    return JSON.parse(readFileSync(filePath, 'utf-8'))
}

function writeJson<T>(name: string, data: T[]) {
    ensureDir()
    writeFileSync(path.join(DEV_DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2))
}

export function createDevStore(): CommitmentStore {
    return {
        async insert(commitment) {
            const rows = readJson<Commitment>('commitments')
            rows.push(commitment)
            writeJson('commitments', rows)
        },
        async get(id) {
            return readJson<Commitment>('commitments').find((row) => row.id === id) ?? null
        },
        async update(commitment) {
            const rows = readJson<Commitment>('commitments')
            const index = rows.findIndex((row) => row.id === commitment.id)
            if (index === -1) return
            rows[index] = commitment
            writeJson('commitments', rows)
        },
        async list() {
            return readJson<Commitment>('commitments')
        },
        async appendAudit(entry: CommitmentAuditEntry) {
            const rows = readJson<CommitmentAuditEntry>('commitment_audit')
            rows.push(entry)
            writeJson('commitment_audit', rows)
        },
        async listAudit(commitmentId) {
            return readJson<CommitmentAuditEntry>('commitment_audit').filter(
                (row) => row.commitment_id === commitmentId
            )
        },
        async businessExists(id) {
            return devStore.getBusinessById(id) !== null
        },
    }
}
