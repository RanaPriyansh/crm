'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save } from 'lucide-react'
import { businessInputSchema, BusinessInputSchema, BusinessFormInput } from '@/lib/validations'
import { PROVINCE_NAMES, STATUS_CONFIG, SOURCE_CONFIG } from '@/lib/utils/phone'

export default function NewBusinessPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<BusinessFormInput, unknown, BusinessInputSchema>({
        resolver: zodResolver(businessInputSchema),
        defaultValues: {
            province: 'NS',
            status: 'active',
            source: 'manual'
        }
    })

    const onSubmit = async (data: BusinessInputSchema) => {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/businesses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to create business')
            }

            const business = await res.json()
            router.push(`/businesses/${business.id}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <Link
                href="/businesses"
                className="inline-flex items-center gap-2 text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to businesses
            </Link>

            <div className="glass-card p-8">
                <h1 className="text-2xl font-bold mb-6">Add New Business</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b border-[hsl(var(--border))] pb-2">
                            Basic Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">
                                    Business Name <span className="text-red-400">*</span>
                                </label>
                                <input {...register('name')} className="input" placeholder="Enter business name" />
                                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <input {...register('category')} className="input" placeholder="e.g., Restaurant, Retail" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Province <span className="text-red-400">*</span>
                                </label>
                                <select {...register('province')} className="input">
                                    {Object.entries(PROVINCE_NAMES).map(([code, name]) => (
                                        <option key={code} value={code}>{name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                {...register('description')}
                                className="input min-h-24"
                                placeholder="Brief description of the business"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b border-[hsl(var(--border))] pb-2">
                            Address
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Street Address</label>
                                <input {...register('address_line1')} className="input" placeholder="123 Main Street" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Address Line 2</label>
                                <input {...register('address_line2')} className="input" placeholder="Suite, Unit, etc." />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">City</label>
                                <input {...register('city')} className="input" placeholder="Halifax" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Postal Code</label>
                                <input {...register('postal_code')} className="input" placeholder="A1A 1A1" />
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b border-[hsl(var(--border))] pb-2">
                            Contact Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <input {...register('phone_raw')} className="input" placeholder="(902) 555-0123" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input {...register('email')} type="email" className="input" placeholder="info@business.com" />
                                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Website</label>
                                <input {...register('website')} type="url" className="input" placeholder="https://www.business.com" />
                                {errors.website && <p className="text-red-400 text-sm mt-1">{errors.website.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Classification */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b border-[hsl(var(--border))] pb-2">
                            Classification
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <select {...register('status')} className="input">
                                    {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Source</label>
                                <select {...register('source')} className="input">
                                    {Object.entries(SOURCE_CONFIG).map(([value, { label }]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Size</label>
                                <select {...register('size_band')} className="input">
                                    <option value="">Not specified</option>
                                    <option value="micro">Micro (1-4 employees)</option>
                                    <option value="small">Small (5-49 employees)</option>
                                    <option value="medium">Medium (50-249 employees)</option>
                                    <option value="large">Large (250+ employees)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">NAICS Code</label>
                                <input {...register('naics_code')} className="input" placeholder="e.g., 722511" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Source Reference</label>
                                <input {...register('source_ref')} className="input" placeholder="External URL or ID" />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 border-t border-[hsl(var(--border))]">
                        <Link href="/businesses" className="btn btn-secondary">
                            Cancel
                        </Link>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Create Business
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
