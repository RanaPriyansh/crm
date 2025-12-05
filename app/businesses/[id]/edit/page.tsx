'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { businessInputSchema, type BusinessFormInput } from '@/lib/validations'
import { PROVINCE_NAMES, STATUS_OPTIONS, SOURCE_OPTIONS, SIZE_BAND_OPTIONS } from '@/lib/utils/phone'
import { Business } from '@/lib/types'

export default function EditBusinessPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<BusinessFormInput>({
        resolver: zodResolver(businessInputSchema),
    })

    const fetchBusiness = useCallback(async () => {
        try {
            const res = await fetch(`/api/businesses/${params.id}`)
            if (!res.ok) {
                setError('Business not found')
                return
            }
            const data: Business = await res.json()
            reset({
                name: data.name,
                category: data.category || '',
                description: data.description || '',
                address_line1: data.address_line1 || '',
                address_line2: data.address_line2 || '',
                city: data.city || '',
                province: data.province,
                postal_code: data.postal_code || '',
                phone_raw: data.phone_raw || '',
                email: data.email || '',
                website: data.website || '',
                latitude: data.latitude,
                longitude: data.longitude,
                naics_code: data.naics_code || '',
                size_band: data.size_band || undefined,
                status: data.status,
                source: data.source,
            })
        } catch {
            setError('Failed to load business')
        } finally {
            setLoading(false)
        }
    }, [params.id, reset])

    useEffect(() => {
        fetchBusiness()
    }, [fetchBusiness])

    const onSubmit = async (data: BusinessFormInput) => {
        setSubmitting(true)
        setError(null)

        try {
            const res = await fetch(`/api/businesses/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to update')
            }

            router.push(`/businesses/${params.id}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update business')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--color-primary))]" />
            </div>
        )
    }

    if (error && !loading) {
        return (
            <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-red-400">{error}</h1>
                <Link href="/businesses" className="btn btn-secondary mt-4">
                    Back to Businesses
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/businesses/${params.id}`} className="btn btn-ghost p-2">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-3xl font-bold">Edit Business</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Info */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Business Name *</label>
                            <input {...register('name')} className="input w-full" />
                            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <input {...register('category')} className="input w-full" placeholder="e.g., Restaurant, Tech" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">NAICS Code</label>
                            <input {...register('naics_code')} className="input w-full" placeholder="e.g., 722511" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea {...register('description')} className="input w-full" rows={3} />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Address</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Address Line 1</label>
                            <input {...register('address_line1')} className="input w-full" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Address Line 2</label>
                            <input {...register('address_line2')} className="input w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">City</label>
                            <input {...register('city')} className="input w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Province *</label>
                            <select {...register('province')} className="input w-full">
                                {Object.entries(PROVINCE_NAMES).map(([code, name]) => (
                                    <option key={code} value={code}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Postal Code</label>
                            <input {...register('postal_code')} className="input w-full" placeholder="A1A 1A1" />
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input {...register('phone_raw')} className="input w-full" placeholder="(902) 555-1234" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input {...register('email')} type="email" className="input w-full" />
                            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Website</label>
                            <input {...register('website')} className="input w-full" placeholder="https://..." />
                            {errors.website && <p className="text-red-400 text-sm mt-1">{errors.website.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Map Coordinates</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Latitude</label>
                            <input {...register('latitude', { valueAsNumber: true })} type="number" step="any" className="input w-full" placeholder="44.6488" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Longitude</label>
                            <input {...register('longitude', { valueAsNumber: true })} type="number" step="any" className="input w-full" placeholder="-63.5752" />
                        </div>
                    </div>
                </div>

                {/* Classification */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Status & Classification</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <select {...register('status')} className="input w-full">
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Source</label>
                            <select {...register('source')} className="input w-full">
                                {SOURCE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Size</label>
                            <select {...register('size_band')} className="input w-full">
                                <option value="">Select size...</option>
                                {SIZE_BAND_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="glass-card p-4 border-red-500/50 bg-red-500/10">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                    <Link href={`/businesses/${params.id}`} className="btn btn-secondary flex-1">
                        Cancel
                    </Link>
                    <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                        {submitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : (
                            <><Save className="w-4 h-4" /> Save Changes</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
