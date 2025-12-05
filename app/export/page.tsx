'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileJson, Filter } from 'lucide-react'
import { PROVINCE_NAMES } from '@/lib/utils/phone'

export default function ExportPage() {
    const [format, setFormat] = useState<'csv' | 'json'>('csv')
    const [province, setProvince] = useState('')
    const [exporting, setExporting] = useState(false)

    const handleExport = async () => {
        setExporting(true)
        try {
            const params = new URLSearchParams({ format })
            if (province) params.set('province', province)

            const res = await fetch(`/api/export/businesses?${params}`)
            const blob = await res.blob()

            // Create download link
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `businesses-export.${format}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Export failed:', error)
            alert('Export failed. Please try again.')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Download className="w-8 h-8 text-[hsl(var(--color-accent))]" />
                    Export Data
                </h1>
                <p className="text-[hsl(var(--muted))] mt-2">
                    Download your business data in various formats
                </p>
            </div>

            <div className="glass-card p-6 space-y-6">
                <h2 className="text-xl font-semibold">Export Businesses</h2>

                {/* Format selection */}
                <div>
                    <label className="block text-sm font-medium mb-3">Export Format</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setFormat('csv')}
                            className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${format === 'csv'
                                    ? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary))]/10'
                                    : 'border-[hsl(var(--border))] hover:border-[hsl(var(--muted))]'
                                }`}
                        >
                            <FileSpreadsheet className={`w-8 h-8 ${format === 'csv' ? 'text-[hsl(var(--color-primary))]' : 'text-[hsl(var(--muted))]'}`} />
                            <span className="font-medium">CSV</span>
                            <span className="text-xs text-[hsl(var(--muted))]">For Excel, Google Sheets</span>
                        </button>
                        <button
                            onClick={() => setFormat('json')}
                            className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${format === 'json'
                                    ? 'border-[hsl(var(--color-primary))] bg-[hsl(var(--color-primary))]/10'
                                    : 'border-[hsl(var(--border))] hover:border-[hsl(var(--muted))]'
                                }`}
                        >
                            <FileJson className={`w-8 h-8 ${format === 'json' ? 'text-[hsl(var(--color-primary))]' : 'text-[hsl(var(--muted))]'}`} />
                            <span className="font-medium">JSON</span>
                            <span className="text-xs text-[hsl(var(--muted))]">For developers, APIs</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter by Province (optional)
                    </label>
                    <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="input w-full"
                    >
                        <option value="">All Provinces</option>
                        {Object.entries(PROVINCE_NAMES).map(([code, name]) => (
                            <option key={code} value={code}>{name}</option>
                        ))}
                    </select>
                </div>

                {/* Export button */}
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="btn btn-primary w-full py-3 text-lg"
                >
                    {exporting ? (
                        <>
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            Download {format.toUpperCase()}
                        </>
                    )}
                </button>
            </div>

            {/* Info */}
            <div className="glass-card p-6">
                <h3 className="font-semibold mb-3">What's included in the export?</h3>
                <ul className="space-y-2 text-sm text-[hsl(var(--muted))]">
                    <li>• Business name, category, and description</li>
                    <li>• Full address including city, province, postal code</li>
                    <li>• Contact info: phone, email, website</li>
                    <li>• Geographic coordinates (latitude/longitude)</li>
                    <li>• Classification: NAICS code, size band</li>
                    <li>• Status and source information</li>
                </ul>
            </div>
        </div>
    )
}
