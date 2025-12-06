'use client'

import { useState, useEffect } from 'react'
import { X, ListChecks, Plus, Loader2, Check } from 'lucide-react'
import { List } from '@/lib/types'

interface AddToListModalProps {
    itemIds: string[]
    itemType: 'business' | 'contact'
    onClose: () => void
    onAdded: () => void
}

export function AddToListModal({ itemIds, itemType, onClose, onAdded }: AddToListModalProps) {
    const [lists, setLists] = useState<List[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedList, setSelectedList] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [newListName, setNewListName] = useState('')
    const [creatingList, setCreatingList] = useState(false)

    useEffect(() => {
        fetch('/api/lists')
            .then(res => res.json())
            .then(data => {
                setLists(Array.isArray(data) ? data : [])
            })
            .catch(err => console.error('Failed to fetch lists:', err))
            .finally(() => setLoading(false))
    }, [])

    const handleAdd = async () => {
        if (!selectedList) {
            setError('Please select a list')
            return
        }

        setSaving(true)
        setError('')

        try {
            const res = await fetch(`/api/lists/${selectedList}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemIds, itemType })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to add to list')
            }

            const result = await res.json()
            onAdded()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setSaving(false)
        }
    }

    const handleCreateList = async () => {
        if (!newListName.trim()) return

        setCreatingList(true)
        try {
            const res = await fetch('/api/lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newListName.trim() })
            })

            if (res.ok) {
                const newList = await res.json()
                setLists([...lists, newList])
                setSelectedList(newList.id)
                setShowCreate(false)
                setNewListName('')
            }
        } catch (err) {
            console.error('Failed to create list:', err)
        } finally {
            setCreatingList(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 max-w-md w-full animate-fade-in max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-[hsl(var(--color-primary))]" />
                        <h2 className="text-xl font-bold">Add to List</h2>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost p-2">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-sm text-[hsl(var(--muted))] mb-4">
                    Adding {itemIds.length} {itemType}{itemIds.length !== 1 ? 's' : ''} to a list
                </p>

                {loading ? (
                    <div className="py-8 text-center text-[hsl(var(--muted))]">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading lists...
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                        {lists.length === 0 && !showCreate ? (
                            <div className="text-center py-6 text-[hsl(var(--muted))]">
                                <p className="mb-2">No lists yet</p>
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="text-[hsl(var(--color-primary))] hover:underline"
                                >
                                    Create your first list
                                </button>
                            </div>
                        ) : (
                            <>
                                {lists.map((list) => (
                                    <button
                                        key={list.id}
                                        onClick={() => setSelectedList(list.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${selectedList === list.id
                                            ? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary))]/10'
                                            : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--background-tertiary))]'
                                            }`}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: `${list.color}20` }}
                                        >
                                            {selectedList === list.id ? (
                                                <Check className="w-4 h-4" style={{ color: list.color }} />
                                            ) : (
                                                <ListChecks className="w-4 h-4" style={{ color: list.color }} />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-medium">{list.name}</p>
                                            <p className="text-xs text-[hsl(var(--muted))]">
                                                {list.stats.businessCount + list.stats.contactCount} items
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </>
                        )}

                        {/* Create new list inline */}
                        {showCreate ? (
                            <div className="p-3 border border-[hsl(var(--border))] rounded-lg">
                                <input
                                    type="text"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    placeholder="New list name..."
                                    className="input mb-2"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateList()
                                        if (e.key === 'Escape') { setShowCreate(false); setNewListName('') }
                                    }}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setShowCreate(false); setNewListName('') }}
                                        className="btn btn-secondary flex-1 py-1 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateList}
                                        disabled={creatingList || !newListName.trim()}
                                        className="btn btn-primary flex-1 py-1 text-sm"
                                    >
                                        {creatingList ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                                    </button>
                                </div>
                            </div>
                        ) : lists.length > 0 && (
                            <button
                                onClick={() => setShowCreate(true)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-[hsl(var(--border))] hover:bg-[hsl(var(--background-tertiary))] text-[hsl(var(--muted))]"
                            >
                                <Plus className="w-5 h-5" />
                                Create new list
                            </button>
                        )}
                    </div>
                )}

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                <div className="flex gap-3">
                    <button onClick={onClose} className="btn btn-secondary flex-1">
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={saving || !selectedList}
                        className="btn btn-primary flex-1"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Add to List
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
