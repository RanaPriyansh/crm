'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Search, Plus, Phone, Mail, Building2, Star } from 'lucide-react'
import { Contact, Business } from '@/lib/types'
import { formatPhone } from '@/lib/utils/phone'
import { ContactModal } from '@/components/ContactModal'

interface ContactWithBusiness extends Contact {
    businesses?: { name: string; city: string; province: string }
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<ContactWithBusiness[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>('')

    const fetchContacts = async () => {
        try {
            const res = await fetch('/api/contacts')
            const data = await res.json()
            setContacts(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Failed to fetch contacts:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchContacts()
        // Fetch businesses for the modal
        fetch('/api/businesses?pageSize=100')
            .then(res => res.json())
            .then(data => setBusinesses(data.data || []))
    }, [])

    // Filter contacts by search
    const filteredContacts = contacts.filter(contact => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase()
        const email = (contact.email || '').toLowerCase()
        const businessName = (contact.businesses?.name || '').toLowerCase()
        return fullName.includes(query) || email.includes(query) || businessName.includes(query)
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--color-primary))] border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Users className="w-8 h-8 text-[hsl(var(--color-secondary))]" />
                        Contacts
                    </h1>
                    <p className="text-[hsl(var(--muted))] mt-1">
                        {contacts.length} total contacts
                    </p>
                </div>
                <button
                    onClick={() => { setSelectedBusinessId(''); setShowModal(true); }}
                    className="btn btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    Add Contact
                </button>
            </div>

            {/* Search */}
            <div className="glass-card p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted))]" />
                    <input
                        type="text"
                        placeholder="Search contacts by name, email, or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-12 w-full"
                    />
                </div>
            </div>

            {/* Contacts Grid */}
            {filteredContacts.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-[hsl(var(--muted))] opacity-50" />
                    <h2 className="text-xl font-semibold mb-2">
                        {searchQuery ? 'No contacts found' : 'No contacts yet'}
                    </h2>
                    <p className="text-[hsl(var(--muted))] mb-4">
                        {searchQuery
                            ? 'Try a different search term'
                            : 'Add contacts to businesses to manage your relationships'
                        }
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn btn-primary"
                        >
                            <Plus className="w-4 h-4" />
                            Add First Contact
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredContacts.map((contact) => (
                        <div key={contact.id} className="glass-card p-5 hover:border-[hsl(var(--color-primary))] transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] flex items-center justify-center text-white font-bold text-lg">
                                        {(contact.first_name?.[0] || contact.last_name?.[0] || '?').toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold flex items-center gap-2">
                                            {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                                            {contact.is_primary && (
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            )}
                                        </h3>
                                        {contact.position && (
                                            <p className="text-sm text-[hsl(var(--muted))]">{contact.position}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                {contact.email && (
                                    <a
                                        href={`mailto:${contact.email}`}
                                        className="flex items-center gap-2 text-[hsl(var(--muted))] hover:text-[hsl(var(--color-primary))]"
                                    >
                                        <Mail className="w-4 h-4" />
                                        {contact.email}
                                    </a>
                                )}
                                {contact.phone_raw && (
                                    <a
                                        href={`tel:${contact.phone_e164 || contact.phone_raw}`}
                                        className="flex items-center gap-2 text-[hsl(var(--muted))] hover:text-[hsl(var(--color-primary))]"
                                    >
                                        <Phone className="w-4 h-4" />
                                        {formatPhone(contact.phone_raw)}
                                    </a>
                                )}
                                {contact.businesses?.name && (
                                    <Link
                                        href={`/businesses/${contact.business_id}`}
                                        className="flex items-center gap-2 text-[hsl(var(--muted))] hover:text-[hsl(var(--color-primary))]"
                                    >
                                        <Building2 className="w-4 h-4" />
                                        {contact.businesses.name}
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Contact Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Select Business</h2>
                        <p className="text-[hsl(var(--muted))] mb-4">
                            First, select which business this contact belongs to:
                        </p>
                        <select
                            value={selectedBusinessId}
                            onChange={(e) => setSelectedBusinessId(e.target.value)}
                            className="input w-full mb-4"
                        >
                            <option value="">Select a business...</option>
                            {businesses.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { }}
                                disabled={!selectedBusinessId}
                                className="btn btn-primary flex-1 disabled:opacity-50"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedBusinessId && showModal && (
                <ContactModal
                    businessId={selectedBusinessId}
                    onClose={() => { setShowModal(false); setSelectedBusinessId(''); }}
                    onSaved={() => { fetchContacts(); setShowModal(false); setSelectedBusinessId(''); }}
                />
            )}
        </div>
    )
}
