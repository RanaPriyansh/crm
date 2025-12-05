'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tag, Plus, X, Loader2 } from 'lucide-react'

interface TagData {
    id: string
    name: string
    color: string
}

interface TagsManagerProps {
    businessId: string
}

export function TagsManager({ businessId }: TagsManagerProps) {
    const [tags, setTags] = useState<TagData[]>([])
    const [allTags, setAllTags] = useState<TagData[]>([])
    const [loading, setLoading] = useState(true)
    const [showDropdown, setShowDropdown] = useState(false)
    const [newTagName, setNewTagName] = useState('')
    const [creating, setCreating] = useState(false)

    const fetchTags = useCallback(async () => {
        try {
            const [businessTagsRes, allTagsRes] = await Promise.all([
                fetch(`/api/businesses/${businessId}/tags`, { cache: 'no-store' }),
                fetch('/api/tags', { cache: 'no-store' })
            ])
            const businessTags = await businessTagsRes.json()
            const all = await allTagsRes.json()
            setTags(Array.isArray(businessTags) ? businessTags : [])
            setAllTags(Array.isArray(all) ? all : [])
        } catch (error) {
            console.error('Failed to fetch tags:', error)
        } finally {
            setLoading(false)
        }
    }, [businessId])

    useEffect(() => {
        fetchTags()
    }, [fetchTags])

    const addTag = async (tagId: string) => {
        try {
            const res = await fetch(`/api/businesses/${businessId}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagId })
            })
            if (res.ok) {
                await fetchTags()
                setShowDropdown(false)
            }
        } catch (error) {
            console.error('Failed to add tag:', error)
        }
    }

    const removeTag = async (tagId: string) => {
        try {
            await fetch(`/api/businesses/${businessId}/tags?tagId=${tagId}`, {
                method: 'DELETE'
            })
            setTags(prev => prev.filter(t => t.id !== tagId))
        } catch (error) {
            console.error('Failed to remove tag:', error)
        }
    }

    const createAndAddTag = async () => {
        if (!newTagName.trim()) return
        setCreating(true)
        try {
            const res = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTagName.trim() })
            })
            if (res.ok) {
                const newTag = await res.json()
                await addTag(newTag.id)
                setNewTagName('')
            }
        } catch (error) {
            console.error('Failed to create tag:', error)
        } finally {
            setCreating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-[hsl(var(--muted))]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading tags...</span>
            </div>
        )
    }

    const availableTags = allTags.filter(t => !tags.some(bt => bt.id === t.id))

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[hsl(var(--muted))]" />
                <span className="text-sm font-medium">Tags</span>
            </div>

            <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                    <span
                        key={tag.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: tag.color }}
                    >
                        {tag.name}
                        <button
                            onClick={() => removeTag(tag.id)}
                            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted))] hover:border-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary))] transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                        Add tag
                    </button>

                    {showDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowDropdown(false)}
                            />
                            <div className="absolute top-full left-0 mt-1 z-50 bg-[hsl(var(--background-secondary))] border border-[hsl(var(--border))] rounded-lg shadow-lg p-2 min-w-48">
                                {availableTags.length > 0 && (
                                    <div className="space-y-1 mb-2">
                                        {availableTags.map(tag => (
                                            <button
                                                key={tag.id}
                                                onClick={() => addTag(tag.id)}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[hsl(var(--background-tertiary))] text-left text-sm"
                                            >
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: tag.color }}
                                                />
                                                {tag.name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="border-t border-[hsl(var(--border))] pt-2 mt-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newTagName}
                                            onChange={(e) => setNewTagName(e.target.value)}
                                            placeholder="New tag name..."
                                            className="input flex-1 text-sm py-1"
                                            onKeyDown={(e) => e.key === 'Enter' && createAndAddTag()}
                                        />
                                        <button
                                            onClick={createAndAddTag}
                                            disabled={!newTagName.trim() || creating}
                                            className="btn btn-primary py-1 px-2 text-sm disabled:opacity-50"
                                        >
                                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
