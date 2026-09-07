'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ShieldAlert, Ship } from 'lucide-react'
import type { Commitment, CommitmentStatus } from '@/lib/commitments/types'
import { COMMODITY_LABEL, STATUS_LABEL } from '@/lib/commitments/labels'

interface Row extends Commitment {
    counterparty_name: string | null
}

export default function CommitmentsPage() {
    const [rows, setRows] = useState<Row[]>([])
    const [loading, setLoading] = useState(true)
    const [seeding, setSeeding] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<CommitmentStatus | 'all'>('all')

    useEffect(() => {
        let cancelled = false
        fetch('/api/commitments', { cache: 'no-store' })
            .then(async (res) => {
                if (!res.ok) throw new Error('Could not load commitments')
                return res.json()
            })
            .then((json) => {
                if (!cancelled) setRows(json.data || [])
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load commitments')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])

    const refresh = async () => {
        const res = await fetch('/api/commitments', { cache: 'no-store' })
        if (!res.ok) {
            setError('Could not load commitments')
            return
        }
        const json = await res.json()
        setRows(json.data || [])
    }

    const seed = async () => {
        setSeeding(true)
        setError(null)
        const res = await fetch('/api/commitments/seed', { method: 'POST' })
        if (!res.ok) {
            setError('Seed failed')
            setSeeding(false)
            return
        }
        await refresh()
        setSeeding(false)
    }

    const visible = statusFilter === 'all'
        ? rows
        : rows.filter((row) => row.status === statusFilter)

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted))]">
                        Perishable-trade
                    </p>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Ship className="w-8 h-8" />
                        Commitment hub
                    </h1>
                    <p className="mt-2 max-w-2xl text-[hsl(var(--muted))]">
                        Volume, Incoterm, and ship window against a synthetic counterparty.
                        Status is a closed machine. There is no live send to email, X, or LinkedIn.
                        <code className="mx-1">send_hold</code> means ready to send and blocked on purpose.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary" onClick={seed} disabled={seeding}>
                        {seeding ? 'Seeding…' : 'Seed synthetic counterparties'}
                    </button>
                    <Link href="/commitments/new" className="btn btn-primary">
                        <Plus className="w-4 h-4" />
                        New commitment
                    </Link>
                </div>
            </div>

            <div className="glass-card p-4 flex items-start gap-3 text-sm">
                <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0 text-amber-400" />
                <p>
                    HITL: leaving <code>draft</code> requires an explicit <code>human_ok</code> flag.
                    Illegal transitions are rejected. A commitment without a business or ship window
                    is rejected.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {(['all', 'draft', 'internal_ok', 'send_hold', 'confirmed', 'killed'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`badge ${statusFilter === status ? 'bg-[hsl(var(--color-primary))] text-white' : 'bg-[hsl(var(--background-tertiary))]'}`}
                    >
                        {status === 'all' ? 'all' : STATUS_LABEL[status]}
                    </button>
                ))}
            </div>

            {error && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300">
                    {error}
                </div>
            )}

            {loading ? (
                <p className="text-[hsl(var(--muted))]">Loading…</p>
            ) : visible.length === 0 ? (
                <div className="glass-card p-8 text-center text-[hsl(var(--muted))]">
                    No commitments. Seed synthetic counterparties or create one.
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Ship window</th>
                                <th>Counterparty</th>
                                <th>Commodity</th>
                                <th>Volume</th>
                                <th>Incoterm</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <Link href={`/commitments/${row.id}`} className="font-medium hover:underline">
                                            {row.ship_window_from} → {row.ship_window_to}
                                        </Link>
                                    </td>
                                    <td>{row.counterparty_name || row.business_id.slice(0, 8)}</td>
                                    <td>{COMMODITY_LABEL[row.commodity_class]}</td>
                                    <td>
                                        {row.volume} {row.unit} ({row.currency})
                                    </td>
                                    <td>{row.incoterm}</td>
                                    <td>
                                        <span className="badge bg-[hsl(var(--background-tertiary))]">
                                            {STATUS_LABEL[row.status]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
