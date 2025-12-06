'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    ListChecks,
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    Building2,
    Users,
    X,
    Loader2
} from 'lucide-react'
import { List } from '@/lib/types'

export default function ListsPage() {
    const [lists, setLists] = useState<List[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [editingList, setEditingList] = useState<List | null>(null)
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)

    const fetchLists = async () => {
        try {
            const res = await fetch('/api/lists')
            if (res.ok) {
                const data = await res.json()
                setLists(data)
            }
        } catch (err) {
            console.error('Failed to fetch lists:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLists()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this list?')) return

        try {
            const res = await fetch(`/api/lists/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setLists(lists.filter(l => l.id !== id))
            }
        } catch (err) {
            console.error('Failed to delete list:', err)
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Lists</h1>
                    <p className="text-[hsl(var(--muted))] mt-1">
                        Organize businesses and contacts into custom collections
                    </p>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn btn-primary">
                    <Plus className="w-4 h-4" />
                    Create List
                </button>
            </div>

            {/* Lists Grid */}
            {loading ? (
                <div className="glass-card p-12 text-center text-[hsl(var(--muted))]">
                    <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--color-primary))] border-t-transparent rounded-full mx-auto mb-4" />
                    Loading lists...
                </div>
            ) : lists.length === 0 ? (
                <div className="glass-card p-12 text-center text-[hsl(var(--muted))]">
                    <ListChecks className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No lists yet</p>
                    <p className="text-sm mb-4">Create your first list to organize businesses and contacts</p>
                    <button onClick={() => setShowCreate(true)} className="btn btn-primary">
                        <Plus className="w-4 h-4" />
                        Create List
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lists.map((list) => (
                        <div key={list.id} className="glass-card p-5 hover:border-[hsl(var(--color-primary))] transition-colors relative">
                            <div className="flex items-start justify-between mb-3">
                                <Link href={`/lists/${list.id}`} className="flex items-center gap-3 flex-1">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: `${list.color}20` }}
                                    >
                                        <ListChecks className="w-5 h-5" style={{ color: list.color }} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold hover:text-[hsl(var(--color-primary))]">
                                            {list.name}
                                        </h3>
                                        {list.description && (
                                            <p className="text-sm text-[hsl(var(--muted))] line-clamp-1">
                                                {list.description}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                                <div className="relative">
                                    <button
                                        onClick={() => setOpenDropdown(openDropdown === list.id ? null : list.id)}
                                        className="p-2 rounded-lg hover:bg-[hsl(var(--background-tertiary))]"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                    {openDropdown === list.id && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                                            <div className="absolute right-0 top-full mt-1 z-20 bg-[hsl(var(--background-secondary))] border border-[hsl(var(--border))] rounded-lg shadow-lg py-1 min-w-32">
                                                <button
                                                    onClick={() => { setEditingList(list); setOpenDropdown(null) }}
                                                    className="flex items-center gap-2 px-3 py-2 hover:bg-[hsl(var(--background-tertiary))] text-sm w-full"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => { handleDelete(list.id); setOpenDropdown(null) }}
                                                    className="flex items-center gap-2 px-3 py-2 hover:bg-[hsl(var(--background-tertiary))] text-sm text-red-400 w-full"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted))]">
                                <div className="flex items-center gap-1">
                                    <Building2 className="w-4 h-4" />
                                    {list.stats.businessCount} businesses
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {list.stats.contactCount} contacts
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreate || editingList) && (
                <ListModal
                    list={editingList}
                    onClose={() => { setShowCreate(false); setEditingList(null) }}
                    onSaved={() => { setShowCreate(false); setEditingList(null); fetchLists() }}
                />
            )}
        </div>
    )
}

function ListModal({
    list,
    onClose,
    onSaved
}: {
    list: List | null
    onClose: () => void
    onSaved: () => void
}) {
    const [name, setName] = useState(list?.name || '')
    const [description, setDescription] = useState(list?.description || '')
    const [color, setColor] = useState(list?.color || '#3B82F6')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            setError('List name is required')
            return
        }

        setSaving(true)
        setError('')

        try {
            const res = await fetch(list ? `/api/lists/${list.id}` : '/api/lists', {
                method: list ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), description: description.trim(), color })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to save list')
            }

            onSaved()
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
                    <h2 className="text-xl font-bold">{list ? 'Edit List' : 'Create New List'}</h2>
                    <button onClick={onClose} className="btn btn-ghost p-2">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            List Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Manufacturing Leads"
                            className="input"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description..."
                            className="input min-h-[80px] resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Color</label>
                        <div className="flex gap-2">
                            {colors.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-lg transition-transform ${color === c ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                list ? 'Save Changes' : 'Create List'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
