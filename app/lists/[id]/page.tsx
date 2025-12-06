'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Building2,
    Users,
    Trash2,
    Edit,
    MapPin,
    Phone,
    Mail,
    ExternalLink
} from 'lucide-react'
import { List, Business, Contact } from '@/lib/types'
import { PROVINCE_NAMES, formatPhone } from '@/lib/utils/phone'

interface ListDetail extends List {
    businesses: Array<{ item_id: string; added_at: string; data: Business }>
    contacts: Array<{ item_id: string; added_at: string; data: Contact }>
}

export default function ListDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [list, setList] = useState<ListDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'businesses' | 'contacts'>('businesses')
    const [editName, setEditName] = useState(false)
    const [name, setName] = useState('')

    const fetchList = async () => {
        try {
            const res = await fetch(`/api/lists/${params.id}`)
            if (res.ok) {
                const data = await res.json()
                setList(data)
                setName(data.name)
                // Auto-select tab based on content
                if (data.stats.businessCount === 0 && data.stats.contactCount > 0) {
                    setActiveTab('contacts')
                }
            } else if (res.status === 404) {
                router.push('/lists')
            }
        } catch (err) {
            console.error('Failed to fetch list:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchList()
    }, [params.id])

    const handleRemove = async (itemId: string) => {
        if (!confirm('Remove this item from the list?')) return

        try {
            const res = await fetch(`/api/lists/${params.id}/items?itemId=${itemId}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                fetchList()
            }
        } catch (err) {
            console.error('Failed to remove item:', err)
        }
    }

    const handleSaveName = async () => {
        if (!name.trim()) return

        try {
            const res = await fetch(`/api/lists/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim() })
            })
            if (res.ok) {
                setEditName(false)
                fetchList()
            }
        } catch (err) {
            console.error('Failed to update name:', err)
        }
    }

    if (loading) {
        return (
            <div className="glass-card p-12 text-center text-[hsl(var(--muted))]">
                <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--color-primary))] border-t-transparent rounded-full mx-auto mb-4" />
                Loading list...
            </div>
        )
    }

    if (!list) return null

    const totalItems = list.stats.businessCount + list.stats.contactCount
    const isMixed = list.stats.businessCount > 0 && list.stats.contactCount > 0

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/lists" className="btn btn-ghost p-2">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    {editName ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input text-2xl font-bold py-1"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveName()
                                    if (e.key === 'Escape') { setEditName(false); setName(list.name) }
                                }}
                            />
                            <button onClick={handleSaveName} className="btn btn-primary py-1">Save</button>
                            <button onClick={() => { setEditName(false); setName(list.name) }} className="btn btn-secondary py-1">Cancel</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${list.color}20` }}
                            >
                                <Building2 className="w-5 h-5" style={{ color: list.color }} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold">{list.name}</h1>
                                    <button onClick={() => setEditName(true)} className="p-1 rounded hover:bg-[hsl(var(--background-tertiary))]">
                                        <Edit className="w-4 h-4 text-[hsl(var(--muted))]" />
                                    </button>
                                </div>
                                {list.description && (
                                    <p className="text-[hsl(var(--muted))]">{list.description}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="text-right text-sm text-[hsl(var(--muted))]">
                    {totalItems} item{totalItems !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Tabs - only show if mixed */}
            {isMixed && (
                <div className="flex gap-1 border-b border-[hsl(var(--border))]">
                    <button
                        onClick={() => setActiveTab('businesses')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'businesses'
                            ? 'border-[hsl(var(--color-primary))] text-[hsl(var(--color-primary))]'
                            : 'border-transparent text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Businesses ({list.stats.businessCount})
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('contacts')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'contacts'
                            ? 'border-[hsl(var(--color-primary))] text-[hsl(var(--color-primary))]'
                            : 'border-transparent text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Contacts ({list.stats.contactCount})
                        </div>
                    </button>
                </div>
            )}

            {/* Content */}
            {totalItems === 0 ? (
                <div className="glass-card p-12 text-center text-[hsl(var(--muted))]">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">This list is empty</p>
                    <p className="text-sm">Add businesses or contacts from their respective pages using the bulk action bar</p>
                </div>
            ) : (
                <>
                    {/* Businesses Tab */}
                    {(activeTab === 'businesses' || !isMixed) && list.stats.businessCount > 0 && (
                        <div className="table-container glass-card">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Business</th>
                                        <th>Location</th>
                                        <th>Contact</th>
                                        <th>Added</th>
                                        <th className="w-12"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.businesses.map(({ item_id, added_at, data }) => (
                                        <tr key={item_id}>
                                            <td>
                                                <Link
                                                    href={`/businesses/${data.id}`}
                                                    className="font-medium hover:text-[hsl(var(--color-primary))] flex items-center gap-1"
                                                >
                                                    {data.name}
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                                {data.category && (
                                                    <p className="text-sm text-[hsl(var(--muted))]">{data.category}</p>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-[hsl(var(--muted))]" />
                                                    <span>
                                                        {data.city && `${data.city}, `}
                                                        {PROVINCE_NAMES[data.province] || data.province}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="space-y-1">
                                                    {data.phone_raw && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Phone className="w-3 h-3 text-[hsl(var(--muted))]" />
                                                            {formatPhone(data.phone_raw)}
                                                        </div>
                                                    )}
                                                    {data.email && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Mail className="w-3 h-3 text-[hsl(var(--muted))]" />
                                                            {data.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-sm text-[hsl(var(--muted))]">
                                                {new Date(added_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleRemove(item_id)}
                                                    className="p-2 rounded-lg hover:bg-[hsl(var(--background-tertiary))] text-red-400"
                                                    title="Remove from list"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Contacts Tab */}
                    {(activeTab === 'contacts' || !isMixed) && list.stats.contactCount > 0 && (
                        <div className="table-container glass-card">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Contact</th>
                                        <th>Position</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Added</th>
                                        <th className="w-12"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.contacts.map(({ item_id, added_at, data }) => (
                                        <tr key={item_id}>
                                            <td className="font-medium">
                                                {[data.first_name, data.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                                            </td>
                                            <td className="text-[hsl(var(--muted))]">
                                                {data.position || '-'}
                                            </td>
                                            <td>
                                                {data.email ? (
                                                    <a href={`mailto:${data.email}`} className="text-[hsl(var(--color-primary))] hover:underline">
                                                        {data.email}
                                                    </a>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                {data.phone_raw ? formatPhone(data.phone_raw) : '-'}
                                            </td>
                                            <td className="text-sm text-[hsl(var(--muted))]">
                                                {new Date(added_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleRemove(item_id)}
                                                    className="p-2 rounded-lg hover:bg-[hsl(var(--background-tertiary))] text-red-400"
                                                    title="Remove from list"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
