'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Save, User, Phone, Mail, Briefcase } from 'lucide-react'
import { contactInputSchema } from '@/lib/validations'
import { z } from 'zod'

type ContactFormData = z.input<typeof contactInputSchema>

interface ContactModalProps {
    businessId: string
    contact?: {
        id: string
        first_name: string | null
        last_name: string | null
        position: string | null
        email: string | null
        phone_raw: string | null
        is_primary: boolean
    }
    onClose: () => void
    onSaved: () => void
}

export function ContactModal({ businessId, contact, onClose, onSaved }: ContactModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const isEdit = !!contact

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactInputSchema),
        defaultValues: {
            business_id: businessId,
            first_name: contact?.first_name || '',
            last_name: contact?.last_name || '',
            position: contact?.position || '',
            email: contact?.email || '',
            phone_raw: contact?.phone_raw || '',
            is_primary: contact?.is_primary || false,
        }
    })

    const onSubmit = async (data: ContactFormData) => {
        setLoading(true)
        setError(null)

        try {
            const url = isEdit ? `/api/contacts/${contact.id}` : '/api/contacts'
            const method = isEdit ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to save contact')
            }

            onSaved()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative glass-card w-full max-w-md p-6 m-4 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">
                        {isEdit ? 'Edit Contact' : 'Add Contact'}
                    </h2>
                    <button onClick={onClose} className="btn btn-ghost p-2">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <input type="hidden" {...register('business_id')} />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">First Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted))]" />
                                <input
                                    {...register('first_name')}
                                    className="input pl-10"
                                    placeholder="John"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Last Name</label>
                            <input
                                {...register('last_name')}
                                className="input"
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Position / Title</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted))]" />
                            <input
                                {...register('position')}
                                className="input pl-10"
                                placeholder="CEO, Sales Manager, etc."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted))]" />
                            <input
                                {...register('email')}
                                type="email"
                                className="input pl-10"
                                placeholder="john@company.com"
                            />
                        </div>
                        {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted))]" />
                            <input
                                {...register('phone_raw')}
                                className="input pl-10"
                                placeholder="(902) 555-0123"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            {...register('is_primary')}
                            id="is_primary"
                            className="w-4 h-4 rounded border-[hsl(var(--border))] bg-[hsl(var(--background-secondary))]"
                        />
                        <label htmlFor="is_primary" className="text-sm">
                            Primary contact for this business
                        </label>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {isEdit ? 'Update' : 'Add'} Contact
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
