'use client'

import { useState, useEffect } from 'react'
import {
    Handshake,
    Plus,
    ShieldCheck,
    Ban,
    ChevronRight,
    History,
    AlertTriangle,
    PauseCircle,
    CheckCircle2,
} from 'lucide-react'

type CommitmentStatus = 'draft' | 'internal_ok' | 'send_hold' | 'confirmed' | 'killed'

interface AuditEntry {
    id: string
    actor: string
    from_status: CommitmentStatus | null
    to_status: CommitmentStatus
    human_ok: boolean
    note: string | null
    at: string
}

interface Commitment {
    id: string
    business_id: string
    counterparty_name: string | null
    commodity_class: string
    volume: number
    unit: string
    incoterm: string
    ship_window_from: string
    ship_window_to: string
    currency: string
    status: CommitmentStatus
    human_ok: boolean
    notes: string | null
    created_at: string
    audit?: AuditEntry[]
}

interface BusinessOption {
    id: string
    name: string
}

const COMMODITY_CLASSES = [
    'fresh_finfish',
    'frozen_finfish',
    'live_shellfish',
    'frozen_shellfish',
    'fresh_produce',
    'dairy',
    'poultry',
    'red_meat',
]
const UNITS = ['kg', 'lb', 'tonne', 'case', 'pallet']
const INCOTERMS = ['EXW', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP']
const CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP', 'JPY']

const STATUS_STYLES: Record<CommitmentStatus, string> = {
    draft: 'bg-gray-500/15 text-gray-300 border border-gray-500/30',
    internal_ok: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    send_hold: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    confirmed: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    killed: 'bg-red-500/15 text-red-300 border border-red-500/30',
}

const STATUS_LABEL: Record<CommitmentStatus, string> = {
    draft: 'Draft',
    internal_ok: 'Internal OK',
    send_hold: 'Send hold',
    confirmed: 'Confirmed',
    killed: 'Killed',
}

function todayPlus(days: number): string {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
}

const EMPTY_FORM = {
    business_id: '',
    commodity_class: 'fresh_finfish',
    volume: '',
    unit: 'kg',
    incoterm: 'FOB',
    ship_window_from: todayPlus(7),
    ship_window_to: todayPlus(21),
    currency: 'CAD',
    notes: '',
}

export default function CommitmentsPage() {
    const [commitments, setCommitments] = useState<Commitment[]>([])
    const [businesses, setBusinesses] = useState<BusinessOption[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ ...EMPTY_FORM })
    const [formError, setFormError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [banner, setBanner] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null)
    const [expanded, setExpanded] = useState<Record<string, AuditEntry[] | null>>({})
    const [humanOk, setHumanOk] = useState<Record<string, boolean>>({})

    const fetchAll = async () => {
        try {
            const [cRes, bRes] = await Promise.all([
                fetch('/api/commitments', { cache: 'no-store' }),
                fetch('/api/businesses?pageSize=100', { cache: 'no-store' }),
            ])
            const cData = await cRes.json()
            const bData = await bRes.json()
            setCommitments(Array.isArray(cData.data) ? cData.data : [])
            setBusinesses(
                Array.isArray(bData.data)
                    ? bData.data.map((b: BusinessOption) => ({ id: b.id, name: b.name }))
                    : [],
            )
        } catch {
            setBanner({ kind: 'error', text: 'Failed to load commitments.' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAll()
    }, [])

    const handleSeed = async () => {
        setBanner(null)
        const res = await fetch('/api/commitments/seed', { method: 'POST' })
        if (res.ok) {
            const data = await res.json()
            setBanner({
                kind: 'ok',
                text: `Seeded ${data.counterparties} synthetic counterparties and ${data.commitmentsCreated} commitments.`,
            })
            fetchAll()
        } else {
            setBanner({ kind: 'error', text: 'Seeding failed.' })
        }
    }

    const handleCreate = async () => {
        setFormError(null)
        if (!form.business_id) {
            setFormError('Select a counterparty business (required — fail closed).')
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch('/api/commitments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_id: form.business_id,
                    commodity_class: form.commodity_class,
                    volume: Number(form.volume),
                    unit: form.unit,
                    incoterm: form.incoterm,
                    ship_window_from: form.ship_window_from,
                    ship_window_to: form.ship_window_to,
                    currency: form.currency,
                    notes: form.notes || null,
                }),
            })
            if (res.ok) {
                setShowForm(false)
                setForm({ ...EMPTY_FORM })
                fetchAll()
            } else {
                const err = await res.json()
                setFormError(err.error || 'Validation failed.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleTransition = async (c: Commitment, to: CommitmentStatus) => {
        setBanner(null)
        const res = await fetch(`/api/commitments/${c.id}/transition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, human_ok: humanOk[c.id] === true }),
        })
        if (res.ok) {
            setExpanded((e) => ({ ...e, [c.id]: null }))
            fetchAll()
        } else {
            const err = await res.json()
            setBanner({ kind: 'error', text: err.error || 'Transition rejected.' })
        }
    }

    const toggleAudit = async (c: Commitment) => {
        if (expanded[c.id]) {
            setExpanded((e) => ({ ...e, [c.id]: undefined as unknown as AuditEntry[] }))
            return
        }
        const res = await fetch(`/api/commitments/${c.id}`, { cache: 'no-store' })
        const data = await res.json()
        setExpanded((e) => ({ ...e, [c.id]: data.audit ?? [] }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--color-primary))] border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Handshake className="w-8 h-8 text-[hsl(var(--color-primary))]" />
                        Commitment Hub
                    </h1>
                    <p className="text-[hsl(var(--muted))] mt-1 max-w-2xl">
                        Human-gated perishable-trade commitments. Leaving draft requires an explicit
                        human sign-off. <strong>Send hold</strong> means ready to send, blocked on
                        purpose — there is no live send.
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button onClick={handleSeed} className="btn btn-secondary">
                        Seed synthetic data
                    </button>
                    <button onClick={() => setShowForm((s) => !s)} className="btn btn-primary">
                        <Plus className="w-4 h-4" />
                        New Commitment
                    </button>
                </div>
            </div>

            {banner && (
                <div
                    className={`glass-card p-3 text-sm flex items-center gap-2 ${
                        banner.kind === 'error' ? 'text-red-300' : 'text-emerald-300'
                    }`}
                >
                    {banner.kind === 'error' ? (
                        <AlertTriangle className="w-4 h-4" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4" />
                    )}
                    {banner.text}
                </div>
            )}

            {showForm && (
                <div className="glass-card p-5 space-y-4">
                    <h2 className="font-semibold text-lg">New commitment</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="space-y-1">
                            <span className="text-sm text-[hsl(var(--muted))]">Counterparty (existing business)</span>
                            <select
                                className="input w-full"
                                value={form.business_id}
                                onChange={(e) => setForm({ ...form, business_id: e.target.value })}
                            >
                                <option value="">Select a counterparty…</option>
                                {businesses.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="space-y-1">
                            <span className="text-sm text-[hsl(var(--muted))]">Commodity class</span>
                            <select
                                className="input w-full"
                                value={form.commodity_class}
                                onChange={(e) => setForm({ ...form, commodity_class: e.target.value })}
                            >
                                {COMMODITY_CLASSES.map((c) => (
                                    <option key={c} value={c}>
                                        {c.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="space-y-1">
                                <span className="text-sm text-[hsl(var(--muted))]">Volume</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    className="input w-full"
                                    value={form.volume}
                                    onChange={(e) => setForm({ ...form, volume: e.target.value })}
                                />
                            </label>
                            <label className="space-y-1">
                                <span className="text-sm text-[hsl(var(--muted))]">Unit</span>
                                <select
                                    className="input w-full"
                                    value={form.unit}
                                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                >
                                    {UNITS.map((u) => (
                                        <option key={u} value={u}>
                                            {u}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="space-y-1">
                                <span className="text-sm text-[hsl(var(--muted))]">Incoterm</span>
                                <select
                                    className="input w-full"
                                    value={form.incoterm}
                                    onChange={(e) => setForm({ ...form, incoterm: e.target.value })}
                                >
                                    {INCOTERMS.map((i) => (
                                        <option key={i} value={i}>
                                            {i}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="space-y-1">
                                <span className="text-sm text-[hsl(var(--muted))]">Currency</span>
                                <select
                                    className="input w-full"
                                    value={form.currency}
                                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                >
                                    {CURRENCIES.map((cur) => (
                                        <option key={cur} value={cur}>
                                            {cur}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <label className="space-y-1">
                            <span className="text-sm text-[hsl(var(--muted))]">Ship window from</span>
                            <input
                                type="date"
                                className="input w-full"
                                value={form.ship_window_from}
                                onChange={(e) => setForm({ ...form, ship_window_from: e.target.value })}
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-sm text-[hsl(var(--muted))]">Ship window to</span>
                            <input
                                type="date"
                                className="input w-full"
                                value={form.ship_window_to}
                                onChange={(e) => setForm({ ...form, ship_window_to: e.target.value })}
                            />
                        </label>
                    </div>
                    <label className="space-y-1 block">
                        <span className="text-sm text-[hsl(var(--muted))]">Notes (optional)</span>
                        <input
                            type="text"
                            className="input w-full"
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                    </label>
                    {formError && (
                        <p className="text-sm text-red-300 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {formError}
                        </p>
                    )}
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={submitting}
                            className="btn btn-primary"
                        >
                            {submitting ? 'Creating…' : 'Create draft'}
                        </button>
                    </div>
                </div>
            )}

            {commitments.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Handshake className="w-16 h-16 mx-auto mb-4 text-[hsl(var(--muted))] opacity-50" />
                    <h2 className="text-xl font-semibold mb-2">No commitments yet</h2>
                    <p className="text-[hsl(var(--muted))] mb-4">
                        Seed synthetic data or create your first commitment.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {commitments.map((c) => (
                        <div key={c.id} className="glass-card p-4">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[c.status]}`}>
                                            {STATUS_LABEL[c.status]}
                                        </span>
                                        <span className="font-semibold">
                                            {c.counterparty_name || 'Unknown counterparty'}
                                        </span>
                                        {c.human_ok && (
                                            <span className="text-xs text-emerald-300 flex items-center gap-1">
                                                <ShieldCheck className="w-3 h-3" /> human_ok
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[hsl(var(--muted))]">
                                        {c.commodity_class.replace(/_/g, ' ')} · {c.volume} {c.unit} ·{' '}
                                        {c.incoterm} · {c.currency} · ship {c.ship_window_from} →{' '}
                                        {c.ship_window_to}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                    {c.status === 'draft' && (
                                        <>
                                            <label className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted))] mr-1">
                                                <input
                                                    type="checkbox"
                                                    checked={humanOk[c.id] === true}
                                                    onChange={(e) =>
                                                        setHumanOk((h) => ({ ...h, [c.id]: e.target.checked }))
                                                    }
                                                />
                                                human_ok
                                            </label>
                                            <button
                                                className="btn btn-primary text-sm py-1"
                                                disabled={humanOk[c.id] !== true}
                                                onClick={() => handleTransition(c, 'internal_ok')}
                                            >
                                                <ShieldCheck className="w-4 h-4" />
                                                Mark internal OK
                                            </button>
                                        </>
                                    )}
                                    {c.status === 'internal_ok' && (
                                        <button
                                            className="btn btn-secondary text-sm py-1"
                                            onClick={() => handleTransition(c, 'send_hold')}
                                        >
                                            <PauseCircle className="w-4 h-4" />
                                            Move to send hold
                                        </button>
                                    )}
                                    {c.status === 'send_hold' && (
                                        <>
                                            <button
                                                className="btn btn-primary text-sm py-1"
                                                onClick={() => handleTransition(c, 'confirmed')}
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Confirm
                                            </button>
                                            <button
                                                className="btn btn-ghost text-red-400 text-sm py-1"
                                                onClick={() => handleTransition(c, 'killed')}
                                            >
                                                <Ban className="w-4 h-4" />
                                                Kill
                                            </button>
                                        </>
                                    )}
                                    <button
                                        className="btn btn-ghost text-sm py-1"
                                        onClick={() => toggleAudit(c)}
                                    >
                                        <History className="w-4 h-4" />
                                        Audit
                                        <ChevronRight
                                            className={`w-3 h-3 transition-transform ${expanded[c.id] ? 'rotate-90' : ''}`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {expanded[c.id] && (
                                <div className="mt-3 border-t border-[hsl(var(--border))] pt-3">
                                    <p className="text-xs uppercase tracking-wide text-[hsl(var(--muted))] mb-2">
                                        Append-only audit log
                                    </p>
                                    <ul className="space-y-1 text-sm">
                                        {expanded[c.id]!.map((a) => (
                                            <li key={a.id} className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[hsl(var(--muted))]">
                                                    {new Date(a.at).toLocaleString()}
                                                </span>
                                                <span className="font-mono text-xs">
                                                    {a.from_status ?? '—'} → {a.to_status}
                                                </span>
                                                <span className="text-[hsl(var(--muted))]">by {a.actor}</span>
                                                {a.human_ok && (
                                                    <span className="text-emerald-300 text-xs">human_ok</span>
                                                )}
                                                {a.note && (
                                                    <span className="text-[hsl(var(--muted))]">“{a.note}”</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
