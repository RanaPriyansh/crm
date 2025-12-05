'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Search,
    Plus,
    Filter,
    ChevronLeft,
    ChevronRight,
    Building2,
    Phone,
    Mail,
    MapPin,
    MoreHorizontal,
    Trash2,
    Edit
} from 'lucide-react'
import { Business, Province, BusinessStatus } from '@/lib/types'
import { PROVINCE_NAMES, STATUS_CONFIG, formatPhone } from '@/lib/utils/phone'

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

    // Filters
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [province, setProvince] = useState<Province | ''>(searchParams.get('province') as Province || '')
    const [status, setStatus] = useState<BusinessStatus | ''>(searchParams.get('status') as BusinessStatus || '')
    const [tag, setTag] = useState(searchParams.get('tag') || '')
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
    const [showFilters, setShowFilters] = useState(false)
    const [availableTags, setAvailableTags] = useState<{ id: string; name: string }[]>([])

    // Dropdown state
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)

    const fetchBusinesses = useCallback(async () => {
        setLoading(true)

        const params = new URLSearchParams()
        params.set('page', page.toString())
        params.set('pageSize', '20')
        if (search) params.set('search', search)
        if (province) params.set('province', province)
        if (status) params.set('status', status)
        if (tag) params.set('tag', tag)

        try {
            const res = await fetch(`/api/businesses?${params}`)
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
    }, [page, search, province, status, tag])

    useEffect(() => {
        fetchBusinesses()
        // Fetch tags for filter
        fetch('/api/tags')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAvailableTags(data)
            })
            .catch(err => console.error('Failed to fetch tags:', err))
    }, [fetchBusinesses])

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (province) params.set('province', province)
        if (status) params.set('status', status)
        if (tag) params.set('tag', tag)
        if (page > 1) params.set('page', page.toString())

        const queryString = params.toString()
        router.replace(`/businesses${queryString ? `?${queryString}` : ''}`, { scroll: false })
    }, [search, province, status, tag, page, router])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
    }

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
                <Link href="/businesses/new" className="btn btn-primary">
                    <Plus className="w-4 h-4" />
                    Add Business
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="glass-card p-4">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted))]" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search businesses..."
                            className="input pl-10"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </form>

                {/* Filter dropdowns */}
                {showFilters && (
                    <div className="flex gap-4 mt-4 pt-4 border-t border-[hsl(var(--border))]">
                        <select
                            value={province}
                            onChange={(e) => { setProvince(e.target.value as Province); setPage(1); }}
                            className="input w-48"
                        >
                            <option value="">All Provinces</option>
                            {Object.entries(PROVINCE_NAMES).map(([code, name]) => (
                                <option key={code} value={code}>{name}</option>
                            ))}
                        </select>

                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value as BusinessStatus); setPage(1); }}
                            className="input w-48"
                        >
                            <option value="">All Statuses</option>
                            {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>

                        <select
                            value={tag}
                            onChange={(e) => { setTag(e.target.value); setPage(1); }}
                            className="input w-48"
                        >
                            <option value="">All Tags</option>
                            {availableTags.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>

                        {(province || status || tag) && (
                            <button
                                onClick={() => { setProvince(''); setStatus(''); setTag(''); setPage(1); }}
                                className="btn btn-ghost text-sm"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="table-container glass-card">
                {loading ? (
                    <div className="p-12 text-center text-[hsl(var(--muted))]">
                        <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--color-primary))] border-t-transparent rounded-full mx-auto mb-4" />
                        Loading businesses...
                    </div>
                ) : businesses.length === 0 ? (
                    <div className="p-12 text-center text-[hsl(var(--muted))]">
                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">No businesses found</p>
                        <p className="text-sm">
                            {search || province || status
                                ? 'Try adjusting your filters'
                                : 'Add your first business to get started'}
                        </p>
                    </div>
                ) : (
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
                )}
            </div>

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
                            className="btn btn-secondary"
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
                            className="btn btn-secondary"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
