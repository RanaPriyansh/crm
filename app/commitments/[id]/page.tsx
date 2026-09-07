'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import type { Commitment, CommitmentAuditEntry, CommitmentStatus } from '@/lib/commitments/types'
import { COMMODITY_LABEL, MACHINE_ORDER, STATUS_LABEL } from '@/lib/commitments/labels'
import { LEGAL_TRANSITIONS } from '@/lib/commitments/machine'

interface Detail extends Commitment {
    counterparty_name: string | null
    audit: CommitmentAuditEntry[]
}

export default function CommitmentDetailPage() {
    const params = useParams<{ id: string }>()
    const id = params.id
    const [row, setRow] = useState<Detail | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [humanOk, setHumanOk] = useState(false)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        let cancelled = false
        fetch(`/api/commitments/${id}`, { cache: 'no-store' })
            .then(async (res) => {
                if (!res.ok) throw new Error('Commitment not found')
                return res.json()
            })
            .then((json) => {
                if (!cancelled) setRow(json)
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Commitment not found')
            })
        return () => {
            cancelled = true
        }
    }, [id])

    const refresh = async () => {
        const res = await fetch(`/api/commitments/${id}`, { cache: 'no-store' })
        if (!res.ok) {
            setError('Commitment not found')
            return
        }
        setRow(await res.json())
        setHumanOk(false)
    }

    const advance = async (to: CommitmentStatus) => {
        setBusy(true)
        setError(null)
        const res = await fetch(`/api/commitments/${id}/transition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to,
                human_ok: row?.status === 'draft' ? humanOk : undefined,
            }),
        })
        const json = await res.json()
        if (!res.ok) {
            setError(json.error || 'Transition rejected')
            setBusy(false)
            return
        }
        await refresh()
        setBusy(false)
    }

    if (!row && !error) {
        return <p className="text-[hsl(var(--muted))]">Loading…</p>
    }

    if (!row) {
        return <p className="text-red-300">{error}</p>
    }

    const next = LEGAL_TRANSITIONS[row.status]

    return (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
            <Link
                href="/commitments"
                className="inline-flex items-center gap-2 text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to commitment hub
            </Link>

            <div>
                <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted))]">
                    Commitment
                </p>
                <h1 className="text-3xl font-bold">
                    {row.counterparty_name || 'Counterparty'} · {COMMODITY_LABEL[row.commodity_class]}
                </h1>
                <p className="text-[hsl(var(--muted))] mt-1">
                    {row.volume} {row.unit} · {row.incoterm} · {row.currency} · ship {row.ship_window_from} → {row.ship_window_to}
                </p>
            </div>

            <div className="glass-card p-6">
                <h2 className="font-semibold mb-4">Status machine</h2>
                <ol className="flex flex-wrap items-center gap-2 text-sm">
                    {MACHINE_ORDER.map((status, index) => (
                        <li key={status} className="flex items-center gap-2">
                            <span
                                className={`badge ${row.status === status ? 'bg-[hsl(var(--color-primary))] text-white' : 'bg-[hsl(var(--background-tertiary))]'}`}
                            >
                                {STATUS_LABEL[status]}
                            </span>
                            {index < MACHINE_ORDER.length - 1 && (
                                <span className="text-[hsl(var(--muted))]">→</span>
                            )}
                        </li>
                    ))}
                    <li className="flex items-center gap-2">
                        <span className="text-[hsl(var(--muted))]">|</span>
                        <span
                            className={`badge ${row.status === 'killed' ? 'bg-red-500/80 text-white' : 'bg-[hsl(var(--background-tertiary))]'}`}
                        >
                            killed
                        </span>
                    </li>
                </ol>
                <p className="text-xs text-[hsl(var(--muted))] mt-3">
                    Linear machine, not a pipeline board. <code>killed</code> is only legal from <code>send_hold</code>.
                </p>
            </div>

            {row.status === 'send_hold' && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-sm">
                        Ready to send. No outbound channel is connected. Hold is intentional — this is not an email, X, or LinkedIn send.
                    </p>
                </div>
            )}

            {error && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300">
                    {error}
                </div>
            )}

            {next.length > 0 && (
                <div className="glass-card p-6 space-y-4">
                    <h2 className="font-semibold">Advance</h2>
                    {row.status === 'draft' && (
                        <label className="flex items-start gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={humanOk}
                                onChange={(e) => setHumanOk(e.target.checked)}
                                className="mt-1"
                            />
                            <span>
                                <code>human_ok</code> — I am a person advancing this out of draft.
                                The API rejects the transition unless this flag is true.
                            </span>
                        </label>
                    )}
                    <div className="flex flex-wrap gap-2">
                        {next.map((to) => (
                            <button
                                key={to}
                                className={to === 'killed' ? 'btn btn-secondary' : 'btn btn-primary'}
                                disabled={busy || (row.status === 'draft' && !humanOk)}
                                onClick={() => advance(to)}
                            >
                                {to === 'killed' ? 'Kill' : `Advance to ${to}`}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="glass-card p-6">
                <h2 className="font-semibold mb-4">Audit log</h2>
                {row.audit.length === 0 ? (
                    <p className="text-sm text-[hsl(var(--muted))]">No status changes yet.</p>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>When</th>
                                    <th>Who</th>
                                    <th>From</th>
                                    <th>To</th>
                                </tr>
                            </thead>
                            <tbody>
                                {row.audit.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>{entry.at}</td>
                                        <td>{entry.actor}</td>
                                        <td>{entry.from_status}</td>
                                        <td>{entry.to_status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
