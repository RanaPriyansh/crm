'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
    COMMODITY_CLASSES,
    CURRENCIES,
    INCOTERMS,
    VOLUME_UNITS,
} from '@/lib/commitments/types'
import { COMMODITY_LABEL } from '@/lib/commitments/labels'

interface BusinessOption {
    id: string
    name: string
    city: string | null
    source_ref: string | null
}

export default function NewCommitmentPage() {
    const router = useRouter()
    const [businesses, setBusinesses] = useState<BusinessOption[]>([])
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        business_id: '',
        commodity_class: 'chilled_bivalves',
        volume: '10',
        unit: 'mt',
        incoterm: 'FOB',
        ship_window_from: '',
        ship_window_to: '',
        currency: 'CAD',
    })

    useEffect(() => {
        fetch('/api/businesses?pageSize=100', { cache: 'no-store' })
            .then((res) => res.json())
            .then((json) => setBusinesses(json.data || []))
            .catch(() => setBusinesses([]))
    }, [])

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)
        setError(null)
        const res = await fetch('/api/commitments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form,
                volume: Number(form.volume),
            }),
        })
        const json = await res.json()
        if (!res.ok) {
            setError(json.error || 'Rejected')
            setLoading(false)
            return
        }
        router.push(`/commitments/${json.id}`)
    }

    const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <Link
                href="/commitments"
                className="inline-flex items-center gap-2 text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to commitment hub
            </Link>

            <div className="glass-card p-8">
                <h1 className="text-2xl font-bold mb-2">New commitment</h1>
                <p className="text-sm text-[hsl(var(--muted))] mb-6">
                    Always created as <code>draft</code>. Counterparty must be an existing business.
                    Ship window is required. Commodity class is generic perishable, not a brand SKU.
                </p>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Counterparty (business) <span className="text-red-400">*</span>
                        </label>
                        <select
                            className="input"
                            value={form.business_id}
                            onChange={(e) => set('business_id', e.target.value)}
                            required
                        >
                            <option value="">Select a business</option>
                            {businesses.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                    {b.city ? ` · ${b.city}` : ''}
                                    {b.source_ref === 'synthetic-counterparty' ? ' · synthetic' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Commodity class</label>
                            <select
                                className="input"
                                value={form.commodity_class}
                                onChange={(e) => set('commodity_class', e.target.value)}
                            >
                                {COMMODITY_CLASSES.map((c) => (
                                    <option key={c} value={c}>{COMMODITY_LABEL[c]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Incoterm</label>
                            <select
                                className="input"
                                value={form.incoterm}
                                onChange={(e) => set('incoterm', e.target.value)}
                            >
                                {INCOTERMS.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Volume</label>
                            <input
                                className="input"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.volume}
                                onChange={(e) => set('volume', e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Unit</label>
                            <select
                                className="input"
                                value={form.unit}
                                onChange={(e) => set('unit', e.target.value)}
                            >
                                {VOLUME_UNITS.map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Ship window from <span className="text-red-400">*</span>
                            </label>
                            <input
                                className="input"
                                type="date"
                                value={form.ship_window_from}
                                onChange={(e) => set('ship_window_from', e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Ship window to <span className="text-red-400">*</span>
                            </label>
                            <input
                                className="input"
                                type="date"
                                value={form.ship_window_to}
                                onChange={(e) => set('ship_window_to', e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Currency</label>
                            <select
                                className="input"
                                value={form.currency}
                                onChange={(e) => set('currency', e.target.value)}
                            >
                                {CURRENCIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving…' : 'Create draft'}
                    </button>
                </form>
            </div>
        </div>
    )
}
