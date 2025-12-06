'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Search,
    Plus,
    ChevronLeft,
    ChevronRight,
    Building2,
    Phone,
    Mail,
    MapPin,
    MoreHorizontal,
    Trash2,
    Edit,
    LayoutGrid,
    List,
    Zap,
    ListChecks,
    X
} from 'lucide-react'
import { Business } from '@/lib/types'
import { PROVINCE_NAMES, STATUS_CONFIG, formatPhone } from '@/lib/utils/phone'
import { AdvancedFilters, FilterState, defaultFilters } from '@/components/AdvancedFilters'
import { QuickAddModal } from '@/components/QuickAddModal'
import { AddToListModal } from '@/components/AddToListModal'

interface PaginatedResponse {
    data: Business[]
    count: number
    page: number
    pageSize: number
    totalPages: number
}

export default function BusinessesPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [businesses, setBusinesses] = useState<Business[]>([])
    const [loading, setLoading] = useState(true)
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [showAddToList, setShowAddToList] = useState(false)

    // Advanced filters state
    const [filters, setFilters] = useState<FilterState>(() => ({
        ...defaultFilters,
        search: searchParams.get('search') || '',
        provinces: searchParams.get('provinces')?.split(',').filter(Boolean) ||
            (searchParams.get('province') ? [searchParams.get('province')!] : []),
        statuses: searchParams.get('statuses')?.split(',').filter(Boolean) ||
            (searchParams.get('status') ? [searchParams.get('status')!] : []),
        tags: searchParams.get('tags')?.split(',').filter(Boolean) ||
            (searchParams.get('tag') ? [searchParams.get('tag')!] : []),
    }))

    const [availableTags, setAvailableTags] = useState<{ id: string; name: string; color: string }[]>([])
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)

    const fetchBusinesses = useCallback(async () => {
        setLoading(true)

        const params = new URLSearchParams()
        params.set('page', page.toString())
        params.set('pageSize', '20')

        // Apply all filters
        if (filters.search) params.set('search', filters.search)
        if (filters.provinces.length > 0) params.set('provinces', filters.provinces.join(','))
        if (filters.statuses.length > 0) params.set('statuses', filters.statuses.join(','))
        if (filters.sources.length > 0) params.set('sources', filters.sources.join(','))
        if (filters.sizeBands.length > 0) params.set('sizeBands', filters.sizeBands.join(','))
        if (filters.tags.length > 0) params.set('tags', filters.tags.join(','))
        if (filters.city) params.set('city', filters.city)
        if (filters.category) params.set('category', filters.category)
        if (filters.naicsCode) params.set('naicsCode', filters.naicsCode)
        if (filters.hasEmail !== null) params.set('hasEmail', String(filters.hasEmail))
        if (filters.hasPhone !== null) params.set('hasPhone', String(filters.hasPhone))
        if (filters.hasWebsite !== null) params.set('hasWebsite', String(filters.hasWebsite))
        if (filters.hasContacts !== null) params.set('hasContacts', String(filters.hasContacts))
        if (filters.hasCoordinates !== null) params.set('hasCoordinates', String(filters.hasCoordinates))
        if (filters.createdAfter) params.set('createdAfter', filters.createdAfter)
        if (filters.createdBefore) params.set('createdBefore', filters.createdBefore)
        if (filters.interactionAfter) params.set('interactionAfter', filters.interactionAfter)
        if (filters.interactionBefore) params.set('interactionBefore', filters.interactionBefore)

        try {
            const res = await fetch(`/api/businesses?${params}`, { cache: 'no-store' })
            if (res.ok) {
                const data: PaginatedResponse = await res.json()
                setBusinesses(data.data)
                setTotalCount(data.count)
                setTotalPages(data.totalPages)
            }
        } catch (error) {
            console.error('Failed to fetch businesses:', error)
        } finally {
            setLoading(false)
        }
    }, [page, filters])

    useEffect(() => {
        fetchBusinesses()
    }, [fetchBusinesses])

    // Fetch tags for filter
    useEffect(() => {
        fetch('/api/tags', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAvailableTags(data)
            })
            .catch(err => console.error('Failed to fetch tags:', err))
    }, [])

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (filters.search) params.set('search', filters.search)
        if (filters.provinces.length > 0) params.set('provinces', filters.provinces.join(','))
        if (filters.statuses.length > 0) params.set('statuses', filters.statuses.join(','))
        if (filters.tags.length > 0) params.set('tags', filters.tags.join(','))
        if (page > 1) params.set('page', page.toString())

        const queryString = params.toString()
        router.replace(`/businesses${queryString ? `?${queryString}` : ''}`, { scroll: false })
    }, [filters.search, filters.provinces, filters.statuses, filters.tags, page, router])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this business?')) return

        try {
            const res = await fetch(`/api/businesses/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchBusinesses()
            }
        } catch (error) {
            console.error('Failed to delete business:', error)
        }
    }

    const handleFiltersChange = (newFilters: FilterState) => {
        setFilters(newFilters)
        setPage(1)
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Businesses</h1>
                    <p className="text-[hsl(var(--muted))] mt-1">
                        {totalCount.toLocaleString()} businesses in Atlantic Canada
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowQuickAdd(true)}
                        className="btn btn-secondary"
                        title="Quick Add"
                    >
                        <Zap className="w-4 h-4" />
                        Quick Add
                    </button>
                    <Link href="/businesses/new" className="btn btn-primary">
                        <Plus className="w-4 h-4" />
                        Add Business
                    </Link>
                </div>
            </div>

            {/* Search bar */}
            <div className="glass-card p-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted))]" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
                            placeholder="Search businesses by name, city, category, or email..."
                            className="input pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-1 border border-[hsl(var(--border))] rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded ${viewMode === 'table' ? 'bg-[hsl(var(--color-primary))] text-white' : 'hover:bg-[hsl(var(--background-tertiary))]'}`}
                            title="Table View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`p-2 rounded ${viewMode === 'cards' ? 'bg-[hsl(var(--color-primary))] text-white' : 'hover:bg-[hsl(var(--background-tertiary))]'}`}
                            title="Card View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="glass-card p-4 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                            {selectedIds.size} business{selectedIds.size !== 1 ? 'es' : ''} selected
                        </span>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-sm text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] flex items-center gap-1"
                        >
                            <X className="w-4 h-4" />
                            Clear
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAddToList(true)}
                        className="btn btn-primary"
                    >
                        <ListChecks className="w-4 h-4" />
                        Add to List
                    </button>
                </div>
            )}

            {/* Advanced Filters */}
            <AdvancedFilters
                filters={filters}
                onChange={handleFiltersChange}
                availableTags={availableTags}
            />

            {/* Results */}
            {loading ? (
                <div className="glass-card p-12 text-center text-[hsl(var(--muted))]">
                    <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--color-primary))] border-t-transparent rounded-full mx-auto mb-4" />
                    Loading businesses...
                </div>
            ) : businesses.length === 0 ? (
                <div className="glass-card p-12 text-center text-[hsl(var(--muted))]">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No businesses found</p>
                    <p className="text-sm">Try adjusting your filters or add a new business</p>
                </div>
            ) : viewMode === 'table' ? (
                /* Table View */
                <div className="table-container glass-card">
                    <table>
                        <thead>
                            <tr>
                                <th className="w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === businesses.length && businesses.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedIds(new Set(businesses.map(b => b.id)))
                                            } else {
                                                setSelectedIds(new Set())
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-[hsl(var(--border))] accent-[hsl(var(--color-primary))]"
                                    />
                                </th>
                                <th>Business</th>
                                <th>Location</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th className="w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {businesses.map((business) => (
                                <tr key={business.id} className={selectedIds.has(business.id) ? 'bg-[hsl(var(--color-primary))]/5' : ''}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(business.id)}
                                            onChange={(e) => {
                                                const newSet = new Set(selectedIds)
                                                if (e.target.checked) {
                                                    newSet.add(business.id)
                                                } else {
                                                    newSet.delete(business.id)
                                                }
                                                setSelectedIds(newSet)
                                            }}
                                            className="w-4 h-4 rounded border-[hsl(var(--border))] accent-[hsl(var(--color-primary))]"
                                        />
                                    </td>
                                    <td>
                                        <Link
                                            href={`/businesses/${business.id}`}
                                            className="font-medium hover:text-[hsl(var(--color-primary))]"
                                        >
                                            {business.name}
                                        </Link>
                                        {business.category && (
                                            <p className="text-sm text-[hsl(var(--muted))]">{business.category}</p>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-[hsl(var(--muted))]" />
                                            <span>
                                                {business.city && `${business.city}, `}
                                                {business.province}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="space-y-1">
                                            {business.phone_raw && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="w-3 h-3 text-[hsl(var(--muted))]" />
                                                    {formatPhone(business.phone_raw)}
                                                </div>
                                            )}
                                            {business.email && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="w-3 h-3 text-[hsl(var(--muted))]" />
                                                    {business.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${STATUS_CONFIG[business.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                                            {STATUS_CONFIG[business.status]?.label || business.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenDropdown(openDropdown === business.id ? null : business.id)}
                                                className="p-2 rounded-lg hover:bg-[hsl(var(--background-tertiary))]"
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                            {openDropdown === business.id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setOpenDropdown(null)}
                                                    />
                                                    <div className="absolute right-0 top-full mt-1 z-20 bg-[hsl(var(--background-secondary))] border border-[hsl(var(--border))] rounded-lg shadow-lg py-1 min-w-32">
                                                        <Link
                                                            href={`/businesses/${business.id}/edit`}
                                                            className="flex items-center gap-2 px-3 py-2 hover:bg-[hsl(var(--background-tertiary))] text-sm"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Edit
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(business.id)}
                                                            className="flex items-center gap-2 px-3 py-2 hover:bg-[hsl(var(--background-tertiary))] text-sm text-red-400 w-full"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Card View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {businesses.map((business) => (
                        <div key={business.id} className="glass-card p-5 hover:border-[hsl(var(--color-primary))] transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <Link
                                        href={`/businesses/${business.id}`}
                                        className="font-semibold hover:text-[hsl(var(--color-primary))]"
                                    >
                                        {business.name}
                                    </Link>
                                    {business.category && (
                                        <p className="text-sm text-[hsl(var(--muted))]">{business.category}</p>
                                    )}
                                </div>
                                <span className={`badge ${STATUS_CONFIG[business.status]?.color || ''}`}>
                                    {STATUS_CONFIG[business.status]?.label || business.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-[hsl(var(--muted))]">
                                    <MapPin className="w-4 h-4" />
                                    {business.city && `${business.city}, `}{PROVINCE_NAMES[business.province]}
                                </div>
                                {business.phone_raw && (
                                    <div className="flex items-center gap-2 text-[hsl(var(--muted))]">
                                        <Phone className="w-4 h-4" />
                                        {formatPhone(business.phone_raw)}
                                    </div>
                                )}
                                {business.email && (
                                    <div className="flex items-center gap-2 text-[hsl(var(--muted))]">
                                        <Mail className="w-4 h-4" />
                                        <span className="truncate">{business.email}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 mt-4 pt-3 border-t border-[hsl(var(--border))]">
                                <Link
                                    href={`/businesses/${business.id}`}
                                    className="btn btn-secondary flex-1 py-1.5 text-sm"
                                >
                                    View
                                </Link>
                                <Link
                                    href={`/businesses/${business.id}/edit`}
                                    className="btn btn-ghost py-1.5 text-sm"
                                >
                                    <Edit className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-[hsl(var(--muted))]">
                        Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, totalCount)} of {totalCount}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="btn btn-secondary disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>
                        <span className="px-4 text-sm">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="btn btn-secondary disabled:opacity-50"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Add Modal */}
            {showQuickAdd && (
                <QuickAddModal
                    onClose={() => setShowQuickAdd(false)}
                    onCreated={() => {
                        setShowQuickAdd(false)
                        fetchBusinesses()
                    }}
                />
            )}

            {/* Add to List Modal */}
            {showAddToList && (
                <AddToListModal
                    itemIds={Array.from(selectedIds)}
                    itemType="business"
                    onClose={() => setShowAddToList(false)}
                    onAdded={() => {
                        setSelectedIds(new Set())
                    }}
                />
            )}
        </div>
    )
}
