'use client'

import { useMemo, useState } from 'react'
import { X, Zap, Loader2 } from 'lucide-react'
import { PROVINCE_NAMES } from '@/lib/utils/phone'
import { Business } from '@/lib/types'

interface QuickAddPayload {
    name: string
    province: string
    city?: string | null
    phone_raw?: string | null
    category?: string | null
}

interface QuickAddModalProps {
    onClose: () => void
    onCreated: (business: Business | null) => void
    onCreate?: (payload: QuickAddPayload) => Promise<Business>
    isSubmitting?: boolean
}

export function QuickAddModal({ onClose, onCreated, onCreate, isSubmitting }: QuickAddModalProps) {
    const [name, setName] = useState('')
    const [province, setProvince] = useState('NS')
    const [city, setCity] = useState('')
    const [phone, setPhone] = useState('')
    const [category, setCategory] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const pending = useMemo(() => saving || isSubmitting, [isSubmitting, saving])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            setError('Business name is required')
            return
        }

        setSaving(true)
        setError('')

        try {
            const payload: QuickAddPayload = {
                name: name.trim(),
                province,
                city: city.trim() || null,
                phone_raw: phone.trim() || null,
                category: category.trim() || null,
            }

            if (onCreate) {
                const created = await onCreate(payload)
                onCreated(created)
            } else {
                const res = await fetch('/api/businesses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })

                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || 'Failed to create business')
                }

                const business = await res.json()
                onCreated(business)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 max-w-md w-full animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[hsl(var(--color-primary))]" />
                        <h2 className="text-xl font-bold">Quick Add Business</h2>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost p-2">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Business Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter business name"
                            className="input"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Province</label>
                            <select
                                value={province}
                                onChange={(e) => setProvince(e.target.value)}
                                className="input"
                            >
                                {Object.entries(PROVINCE_NAMES).map(([code, name]) => (
                                    <option key={code} value={code}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">City</label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g., Halifax"
                                className="input"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="(902) 555-0123"
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g., Restaurant"
                                className="input"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
                            Cancel
                        </button>
                        <button type="submit" disabled={pending} className="btn btn-primary flex-1">
                            {pending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    Create
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <p className="text-center text-xs text-[hsl(var(--muted))] mt-4">
                    Need more fields? Use the full <a href="/businesses/new" className="text-[hsl(var(--color-primary))] hover:underline">Add Business</a> form.
                </p>
            </div>
        </div>
    )
}
