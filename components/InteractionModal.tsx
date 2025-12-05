'use client'

import { useState } from 'react'
import { X, Phone, Mail, Calendar, FileText, MessageSquare } from 'lucide-react'

interface InteractionModalProps {
    businessId: string
    businessName: string
    onClose: () => void
    onSaved: () => void
}

const INTERACTION_TYPES = [
    { value: 'call', label: 'Phone Call', icon: Phone, color: 'text-blue-500' },
    { value: 'email', label: 'Email', icon: Mail, color: 'text-green-500' },
    { value: 'meeting', label: 'Meeting', icon: Calendar, color: 'text-purple-500' },
    { value: 'note', label: 'Note', icon: FileText, color: 'text-yellow-500' },
    { value: 'other', label: 'Other', icon: MessageSquare, color: 'text-gray-500' },
]

const DIRECTIONS = [
    { value: 'outbound', label: 'Outbound (We initiated)' },
    { value: 'inbound', label: 'Inbound (They initiated)' },
    { value: 'internal', label: 'Internal note' },
]

export function InteractionModal({ businessId, businessName, onClose, onSaved }: InteractionModalProps) {
    const [type, setType] = useState('note')
    const [direction, setDirection] = useState('internal')
    const [subject, setSubject] = useState('')
    const [notes, setNotes] = useState('')
    const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16))
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        try {
            const res = await fetch('/api/interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_id: businessId,
                    type,
                    direction,
                    subject: subject || null,
                    notes: notes || null,
                    occurred_at: new Date(occurredAt).toISOString(),
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to save interaction')
            }

            onSaved()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold">Log Interaction</h2>
                        <p className="text-sm text-[hsl(var(--muted))]">{businessName}</p>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost p-2">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Type selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Type</label>
                        <div className="grid grid-cols-5 gap-2">
                            {INTERACTION_TYPES.map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setType(t.value)}
                                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${type === t.value
                                            ? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary))]/10'
                                            : 'border-[hsl(var(--border))] hover:border-[hsl(var(--muted))]'
                                        }`}
                                >
                                    <t.icon className={`w-5 h-5 ${t.color}`} />
                                    <span className="text-xs">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Direction */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Direction</label>
                        <select
                            value={direction}
                            onChange={(e) => setDirection(e.target.value)}
                            className="input w-full"
                        >
                            {DIRECTIONS.map((d) => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date/Time */}
                    <div>
                        <label className="block text-sm font-medium mb-2">When</label>
                        <input
                            type="datetime-local"
                            value={occurredAt}
                            onChange={(e) => setOccurredAt(e.target.value)}
                            className="input w-full"
                        />
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Subject (optional)</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Brief summary..."
                            className="input w-full"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Details about the interaction..."
                            rows={4}
                            className="input w-full resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                            {saving ? 'Saving...' : 'Save Interaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
