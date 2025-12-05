'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Building2, User, X, Loader2 } from 'lucide-react'
import { Business, Contact } from '@/lib/types'

interface SearchResults {
    businesses: Business[]
    contacts: Contact[]
}

export function GlobalSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResults>({ businesses: [], contacts: [] })
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults({ businesses: [], contacts: [] })
            return
        }

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
                const data = await res.json()
                setResults(data)
            } catch {
                console.error('Search failed')
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Keyboard shortcut (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
                setOpen(true)
            }
            if (e.key === 'Escape') {
                setOpen(false)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleSelect = (type: 'business' | 'contact', id: string) => {
        setOpen(false)
        setQuery('')
        if (type === 'business') {
            router.push(`/businesses/${id}`)
        } else {
            // Navigate to the contact's business
            const contact = results.contacts.find(c => c.id === id)
            if (contact?.business_id) {
                router.push(`/businesses/${contact.business_id}`)
            }
        }
    }

    const hasResults = results.businesses.length > 0 || results.contacts.length > 0

    return (
        <div ref={containerRef} className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted))]" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search... (⌘K)"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    className="input pl-10 pr-10 w-full"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(''); setResults({ businesses: [], contacts: [] }); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Results dropdown */}
            {open && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--muted))]" />
                        </div>
                    ) : !hasResults ? (
                        <div className="py-8 text-center text-[hsl(var(--muted))]">
                            No results found
                        </div>
                    ) : (
                        <>
                            {results.businesses.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-medium text-[hsl(var(--muted))] uppercase">
                                        Businesses
                                    </div>
                                    {results.businesses.map((b) => (
                                        <button
                                            key={b.id}
                                            onClick={() => handleSelect('business', b.id)}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[hsl(var(--background-tertiary))] text-left"
                                        >
                                            <Building2 className="w-4 h-4 text-[hsl(var(--color-primary))]" />
                                            <div>
                                                <p className="font-medium">{b.name}</p>
                                                <p className="text-xs text-[hsl(var(--muted))]">
                                                    {[b.city, b.province].filter(Boolean).join(', ')}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.contacts.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-medium text-[hsl(var(--muted))] uppercase mt-2">
                                        Contacts
                                    </div>
                                    {results.contacts.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSelect('contact', c.id)}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[hsl(var(--background-tertiary))] text-left"
                                        >
                                            <User className="w-4 h-4 text-[hsl(var(--color-secondary))]" />
                                            <div>
                                                <p className="font-medium">
                                                    {[c.first_name, c.last_name].filter(Boolean).join(' ')}
                                                </p>
                                                {c.email && (
                                                    <p className="text-xs text-[hsl(var(--muted))]">{c.email}</p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
