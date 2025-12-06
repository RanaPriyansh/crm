'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
    Zap
} from 'lucide-react'
import { PROVINCE_NAMES, STATUS_CONFIG, formatPhone } from '@/lib/utils/phone'
import { AdvancedFilters } from '@/components/AdvancedFilters'
import { QuickAddModal } from '@/components/QuickAddModal'
import {
    BUSINESS_PAGE_SIZE,
    FilterState,
    filtersEqual,
    filtersToSearchParams
} from '@/lib/businesses/filters'
import { PaginatedResponse } from '@/lib/businesses/types'
import { useBusinessesQuery } from './useBusinessesQuery'

interface BusinessesClientProps {
    initialFilters: FilterState
    initialPage: number
    initialData: PaginatedResponse
}

export function BusinessesClient({ initialFilters, initialPage, initialData }: BusinessesClientProps) {
    const router = useRouter()
    const [filters, setFilters] = useState<FilterState>(initialFilters)
    const [page, setPage] = useState(initialPage)
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [availableTags, setAvailableTags] = useState<{ id: string; name: string; color: string }[]>([])
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)

    const isInitialQuery = useMemo(
        () => page === initialPage && filtersEqual(filters, initialFilters),
        [filters, initialFilters, initialPage, page]
    )

    const { query, deleteBusiness, quickAdd } = useBusinessesQuery({
        filters,
        page,
        initialData: isInitialQuery ? initialData : undefined,
    })

    const { data } = query
    const businesses = data?.data || []
    const totalCount = data?.count || 0
    const totalPages = data?.totalPages || 0

    const isLoading = query.isLoading && !data
    const isRefetching = query.isFetching && !!data

    const fetchTags = useCallback(() => {
        fetch('/api/tags', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAvailableTags(data)
            })
            .catch(err => console.error('Failed to fetch tags:', err))
    }, [])

    useEffect(() => {
        fetchTags()
    }, [fetchTags])

    useEffect(() => {
        const params = filtersToSearchParams(filters, page)
        const queryString = params.toString()
        router.replace(`/businesses${queryString ? `?${queryString}` : ''}`, { scroll: false })
    }, [filters, page, router])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this business?')) return
        deleteBusiness.mutate(id)
    }

    const handleFiltersChange = (newFilters: FilterState) => {
        setFilters(newFilters)
        setPage(1)
    }

    const handleQuickAdd = async (payload: {
        name: string
        province: string
        city?: string | null
        phone_raw?: string | null
        category?: string | null
    }) => {
        await quickAdd.mutateAsync(payload)
    }

    const showingCountStart = ((page - 1) * BUSINESS_PAGE_SIZE) + 1
    const showingCountEnd = Math.min(page * BUSINESS_PAGE_SIZE, totalCount)

    return (
        <div className="space-y-6 animate-fade-in">
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

            <AdvancedFilters
                filters={filters}
                onChange={handleFiltersChange}
                availableTags={availableTags}
            />

            {isLoading ? (
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
                <div className="table-container glass-card relative">
                    {isRefetching && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-black/20 flex items-center justify-center rounded-lg">
                            <div className="animate-spin w-6 h-6 border-2 border-[hsl(var(--color-primary))] border-t-transparent rounded-full" />
                        </div>
                    )}
                    <table>
                        <thead>
                            <tr>
                                <th>Business</th>
                                <th>Location</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th className="w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {businesses.map((business) => (
                                <tr key={business.id}>
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
                                                            disabled={deleteBusiness.isPending}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
                    {isRefetching && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-black/20 flex items-center justify-center rounded-lg">
                            <div className="animate-spin w-6 h-6 border-2 border-[hsl(var(--color-primary))] border-t-transparent rounded-full" />
                        </div>
                    )}
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

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-[hsl(var(--muted))]">
                        Showing {showingCountStart} to {showingCountEnd} of {totalCount}
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

            {showQuickAdd && (
                <QuickAddModal
                    onClose={() => setShowQuickAdd(false)}
                    onCreated={() => {
                        setShowQuickAdd(false)
                        setPage(1)
                        fetchTags()
                    }}
                    onCreate={handleQuickAdd}
                    isSubmitting={quickAdd.isPending}
                />
            )}
        </div>
    )
}
