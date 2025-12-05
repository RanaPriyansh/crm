'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Tag, Plus, Trash2, Building2, ExternalLink } from 'lucide-react'

interface TagData {
    id: string
    name: string
    color: string
    businessCount?: number
}

export default function TagsPage() {
    const [tags, setTags] = useState<TagData[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [newTagName, setNewTagName] = useState('')
    const [creating, setCreating] = useState(false)

    const fetchTags = async () => {
        try {
            const res = await fetch('/api/tags', { cache: 'no-store' })
            const data = await res.json()
            if (Array.isArray(data)) {
                // Fetch business counts for each tag
                const tagsWithCounts = await Promise.all(
                    data.map(async (tag: TagData) => {
                        const countRes = await fetch(`/api/businesses?tags=${tag.id}&pageSize=1`, { cache: 'no-store' })
                        const countData = await countRes.json()
                        return { ...tag, businessCount: countData.count || 0 }
                    })
                )
                setTags(tagsWithCounts)
            }
        } catch (error) {
            console.error('Failed to fetch tags:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTags()
    }, [])

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return
        setCreating(true)
        try {
            const res = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTagName.trim() })
            })
            if (res.ok) {
                setNewTagName('')
                setShowCreate(false)
                fetchTags()
            }
        } catch (error) {
            console.error('Failed to create tag:', error)
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteTag = async (id: string, name: string) => {
        if (!confirm(`Delete tag "${name}"? This will remove it from all businesses.`)) return
        try {
            const res = await fetch(`/api/tags?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchTags()
            }
        } catch (error) {
            console.error('Failed to delete tag:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--color-primary))] border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Tag className="w-8 h-8 text-[hsl(var(--color-primary))]" />
                        Tags
                    </h1>
                    <p className="text-[hsl(var(--muted))] mt-1">
                        Manage tags to organize and filter your businesses
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="btn btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    Create Tag
                </button>
            </div>

            {/* Create Tag Form */}
            {showCreate && (
                <div className="glass-card p-4">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="New tag name..."
                            className="input flex-1"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                        />
                        <button
                            onClick={() => setShowCreate(false)}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateTag}
                            disabled={!newTagName.trim() || creating}
                            className="btn btn-primary"
                        >
                            {creating ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </div>
            )}

            {/* Tags List */}
            {tags.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Tag className="w-16 h-16 mx-auto mb-4 text-[hsl(var(--muted))] opacity-50" />
                    <h2 className="text-xl font-semibold mb-2">No tags yet</h2>
                    <p className="text-[hsl(var(--muted))] mb-4">
                        Create tags to organize and filter your businesses
                    </p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="btn btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        Create First Tag
                    </button>
                </div>
            ) : (
                <div className="glass-card divide-y divide-[hsl(var(--border))]">
                    {tags.map((tag) => (
                        <div
                            key={tag.id}
                            className="p-4 flex items-center justify-between hover:bg-[hsl(var(--background-tertiary))] transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <span
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: tag.color }}
                                />
                                <div>
                                    <p className="font-medium">{tag.name}</p>
                                    <p className="text-sm text-[hsl(var(--muted))]">
                                        {tag.businessCount} {tag.businessCount === 1 ? 'business' : 'businesses'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {tag.businessCount && tag.businessCount > 0 ? (
                                    <Link
                                        href={`/businesses?tags=${tag.id}`}
                                        className="btn btn-ghost text-sm py-1"
                                    >
                                        <Building2 className="w-4 h-4" />
                                        View
                                        <ExternalLink className="w-3 h-3" />
                                    </Link>
                                ) : null}
                                <button
                                    onClick={() => handleDeleteTag(tag.id, tag.name)}
                                    className="btn btn-ghost text-red-400 text-sm py-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats */}
            {tags.length > 0 && (
                <div className="glass-card p-4">
                    <p className="text-sm text-[hsl(var(--muted))]">
                        <span className="font-medium text-[hsl(var(--foreground))]">{tags.length}</span> tags total •
                        <span className="font-medium text-[hsl(var(--foreground))]"> {tags.reduce((acc, t) => acc + (t.businessCount || 0), 0)}</span> businesses tagged
                    </p>
                </div>
            )}
        </div>
    )
}
