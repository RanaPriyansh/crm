'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
    ArrowLeft,
    Building2,
    MapPin,
    Phone,
    Mail,
    Globe,
    Calendar,
    Edit,
    Trash2,
    Plus,
    MessageSquare,
    User,
    MoreVertical
} from 'lucide-react'
import { Business, Contact, Interaction } from '@/lib/types'
import { PROVINCE_NAMES, STATUS_CONFIG, SOURCE_CONFIG, formatPhone } from '@/lib/utils/phone'
import { ContactModal } from '@/components/ContactModal'

// Dynamic import Leaflet to avoid SSR issues
const BusinessMap = dynamic(() => import('@/components/BusinessMap'), {
    ssr: false,
    loading: () => (
        <div className="h-64 bg-[hsl(var(--background-tertiary))] rounded-lg flex items-center justify-center">
            <span className="text-[hsl(var(--muted))]">Loading map...</span>
        </div>
    )
})

interface BusinessWithRelations extends Business {
    contacts: Contact[]
    interactions: Interaction[]
}

export default function BusinessDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [business, setBusiness] = useState<BusinessWithRelations | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showContactModal, setShowContactModal] = useState(false)
    const [editingContact, setEditingContact] = useState<Contact | null>(null)
    const [contactMenuOpen, setContactMenuOpen] = useState<string | null>(null)

    const fetchBusiness = useCallback(async () => {
        try {
            const res = await fetch(`/api/businesses/${params.id}`)
            if (!res.ok) {
                if (res.status === 404) {
                    setError('Business not found')
                } else {
                    setError('Failed to load business')
                }
                return
            }
            const data = await res.json()
            setBusiness(data)
        } catch {
            setError('Failed to load business')
        } finally {
            setLoading(false)
        }
    }, [params.id])

    useEffect(() => {
        fetchBusiness()
    }, [fetchBusiness])

    const handleDeleteContact = async (contactId: string) => {
        if (!confirm('Delete this contact?')) return
        try {
            const res = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' })
            if (res.ok) {
                fetchBusiness()
            }
        } catch {
            alert('Failed to delete contact')
        }
        setContactMenuOpen(null)
    }


    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this business?')) return

        try {
            const res = await fetch(`/api/businesses/${params.id}`, { method: 'DELETE' })
            if (res.ok) {
                router.push('/businesses')
            }
        } catch {
            alert('Failed to delete business')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--color-primary))] border-t-transparent rounded-full" />
            </div>
        )
    }

    if (error || !business) {
        return (
            <div className="text-center py-12">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-[hsl(var(--muted))] opacity-50" />
                <h2 className="text-xl font-semibold mb-2">{error || 'Business not found'}</h2>
                <Link href="/businesses" className="text-[hsl(var(--color-primary))] hover:underline">
                    Back to businesses
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <Link
                        href="/businesses"
                        className="inline-flex items-center gap-2 text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to businesses
                    </Link>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold">{business.name}</h1>
                        <span className={`badge ${STATUS_CONFIG[business.status]?.color || ''}`}>
                            {STATUS_CONFIG[business.status]?.label || business.status}
                        </span>
                    </div>
                    {business.category && (
                        <p className="text-[hsl(var(--muted))] mt-1">{business.category}</p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Link href={`/businesses/${business.id}/edit`} className="btn btn-secondary">
                        <Edit className="w-4 h-4" />
                        Edit
                    </Link>
                    <button onClick={handleDelete} className="btn btn-secondary text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Details card */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold mb-4">Business Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                {/* Address */}
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-[hsl(var(--muted))] mt-0.5" />
                                    <div>
                                        <p className="text-sm text-[hsl(var(--muted))]">Address</p>
                                        <p>
                                            {business.address_line1 || 'No address'}
                                            {business.address_line2 && <><br />{business.address_line2}</>}
                                            {(business.city || business.province || business.postal_code) && (
                                                <><br />{[business.city, business.province, business.postal_code].filter(Boolean).join(', ')}</>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-[hsl(var(--muted))] mt-0.5" />
                                    <div>
                                        <p className="text-sm text-[hsl(var(--muted))]">Phone</p>
                                        <p>{business.phone_raw ? formatPhone(business.phone_raw) : 'Not provided'}</p>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-[hsl(var(--muted))] mt-0.5" />
                                    <div>
                                        <p className="text-sm text-[hsl(var(--muted))]">Email</p>
                                        <p>
                                            {business.email ? (
                                                <a href={`mailto:${business.email}`} className="text-[hsl(var(--color-primary))] hover:underline">
                                                    {business.email}
                                                </a>
                                            ) : 'Not provided'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Website */}
                                <div className="flex items-start gap-3">
                                    <Globe className="w-5 h-5 text-[hsl(var(--muted))] mt-0.5" />
                                    <div>
                                        <p className="text-sm text-[hsl(var(--muted))]">Website</p>
                                        <p>
                                            {business.website ? (
                                                <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--color-primary))] hover:underline">
                                                    {business.website.replace(/^https?:\/\//, '')}
                                                </a>
                                            ) : 'Not provided'}
                                        </p>
                                    </div>
                                </div>

                                {/* Province */}
                                <div className="flex items-start gap-3">
                                    <Building2 className="w-5 h-5 text-[hsl(var(--muted))] mt-0.5" />
                                    <div>
                                        <p className="text-sm text-[hsl(var(--muted))]">Province</p>
                                        <p>{PROVINCE_NAMES[business.province]}</p>
                                    </div>
                                </div>

                                {/* Source */}
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-[hsl(var(--muted))] mt-0.5" />
                                    <div>
                                        <p className="text-sm text-[hsl(var(--muted))]">Source</p>
                                        <p>
                                            {SOURCE_CONFIG[business.source]?.icon} {SOURCE_CONFIG[business.source]?.label || business.source}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {business.description && (
                            <div className="mt-6 pt-6 border-t border-[hsl(var(--border))]">
                                <p className="text-sm text-[hsl(var(--muted))] mb-2">Description</p>
                                <p>{business.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Map */}
                    {(business.latitude && business.longitude) && (
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold mb-4">Location</h2>
                            <BusinessMap
                                latitude={business.latitude}
                                longitude={business.longitude}
                                name={business.name}
                                address={[business.address_line1, business.city, business.province].filter(Boolean).join(', ')}
                            />
                        </div>
                    )}

                    {/* Interactions */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Recent Interactions</h2>
                            <button className="btn btn-secondary text-sm">
                                <Plus className="w-4 h-4" />
                                Log Interaction
                            </button>
                        </div>

                        {business.interactions.length === 0 ? (
                            <div className="text-center py-8 text-[hsl(var(--muted))]">
                                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No interactions logged yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {business.interactions.map((interaction) => (
                                    <div key={interaction.id} className="flex gap-4 p-4 rounded-lg bg-[hsl(var(--background-tertiary))]">
                                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--color-primary))]/10 flex items-center justify-center flex-shrink-0">
                                            <MessageSquare className="w-5 h-5 text-[hsl(var(--color-primary))]" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium capitalize">{interaction.type}</span>
                                                <span className="text-xs text-[hsl(var(--muted))] capitalize">• {interaction.direction}</span>
                                            </div>
                                            {interaction.subject && <p className="font-medium">{interaction.subject}</p>}
                                            {interaction.notes && <p className="text-sm text-[hsl(var(--muted))]">{interaction.notes}</p>}
                                            <p className="text-xs text-[hsl(var(--muted))] mt-2">
                                                {new Date(interaction.occurred_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Contacts */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Contacts</h2>
                            <button
                                onClick={() => { setEditingContact(null); setShowContactModal(true); }}
                                className="btn btn-ghost text-sm p-2"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {business.contacts.length === 0 ? (
                            <div className="text-center py-6 text-[hsl(var(--muted))]">
                                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No contacts yet</p>
                                <button
                                    onClick={() => { setEditingContact(null); setShowContactModal(true); }}
                                    className="text-[hsl(var(--color-primary))] hover:underline text-sm mt-2"
                                >
                                    Add first contact
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {business.contacts.map((contact) => (
                                    <div key={contact.id} className="p-3 rounded-lg bg-[hsl(var(--background-tertiary))] relative group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">
                                                    {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                                                </p>
                                                {contact.is_primary && (
                                                    <span className="badge bg-[hsl(var(--color-primary))]/20 text-[hsl(var(--color-primary))]">
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setContactMenuOpen(contactMenuOpen === contact.id ? null : contact.id)}
                                                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[hsl(var(--border))] transition-opacity"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                {contactMenuOpen === contact.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setContactMenuOpen(null)} />
                                                        <div className="absolute right-0 top-full mt-1 z-20 bg-[hsl(var(--background-secondary))] border border-[hsl(var(--border))] rounded-lg shadow-lg py-1 min-w-24">
                                                            <button
                                                                onClick={() => { setEditingContact(contact); setShowContactModal(true); setContactMenuOpen(null); }}
                                                                className="block w-full text-left px-3 py-1.5 hover:bg-[hsl(var(--background-tertiary))] text-sm"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteContact(contact.id)}
                                                                className="block w-full text-left px-3 py-1.5 hover:bg-[hsl(var(--background-tertiary))] text-sm text-red-400"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {contact.position && (
                                            <p className="text-sm text-[hsl(var(--muted))]">{contact.position}</p>
                                        )}
                                        {contact.email && (
                                            <p className="text-sm mt-2">
                                                <a href={`mailto:${contact.email}`} className="text-[hsl(var(--color-primary))] hover:underline">
                                                    {contact.email}
                                                </a>
                                            </p>
                                        )}
                                        {contact.phone_raw && (
                                            <p className="text-sm text-[hsl(var(--muted))]">{formatPhone(contact.phone_raw)}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Metadata */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold mb-4">Metadata</h2>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-[hsl(var(--muted))]">Created</dt>
                                <dd>{new Date(business.created_at).toLocaleDateString()}</dd>
                            </div>
                            <div>
                                <dt className="text-[hsl(var(--muted))]">Last Updated</dt>
                                <dd>{new Date(business.updated_at).toLocaleDateString()}</dd>
                            </div>
                            {business.last_interaction_at && (
                                <div>
                                    <dt className="text-[hsl(var(--muted))]">Last Interaction</dt>
                                    <dd>{new Date(business.last_interaction_at).toLocaleDateString()}</dd>
                                </div>
                            )}
                            {business.naics_code && (
                                <div>
                                    <dt className="text-[hsl(var(--muted))]">NAICS Code</dt>
                                    <dd>{business.naics_code}</dd>
                                </div>
                            )}
                            {business.size_band && (
                                <div>
                                    <dt className="text-[hsl(var(--muted))]">Size</dt>
                                    <dd className="capitalize">{business.size_band}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            </div>

            {/* Contact Modal */}
            {showContactModal && (
                <ContactModal
                    businessId={business.id}
                    contact={editingContact || undefined}
                    onClose={() => { setShowContactModal(false); setEditingContact(null); }}
                    onSaved={() => fetchBusiness()}
                />
            )}
        </div>
    )
}
