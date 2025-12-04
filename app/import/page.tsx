'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, Download, X } from 'lucide-react'
import { PROVINCE_NAMES } from '@/lib/utils/phone'

interface PreviewRow {
    name: string
    category?: string
    address_line1?: string
    city?: string
    province: string
    postal_code?: string
    phone?: string
    email?: string
    website?: string
}

interface ImportResult {
    success: boolean
    imported: number
    skipped: number
    errors: string[]
}

export default function ImportPage() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<PreviewRow[]>([])
    const [importing, setImporting] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (!selectedFile.name.endsWith('.csv')) {
            setError('Please select a CSV file')
            return
        }

        setFile(selectedFile)
        setError(null)
        setResult(null)

        // Parse CSV for preview
        const text = await selectedFile.text()
        const lines = text.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))

        const rows: PreviewRow[] = []
        for (let i = 1; i < Math.min(lines.length, 6); i++) {
            const values = parseCSVLine(lines[i])
            const row: Record<string, string> = {}
            headers.forEach((header, idx) => {
                row[header] = values[idx]?.trim() || ''
            })

            // Map common column names
            rows.push({
                name: row.name || row.business_name || row.company || '',
                category: row.category || row.industry || row.type || '',
                address_line1: row.address || row.address_line1 || row.street || '',
                city: row.city || row.town || '',
                province: mapProvince(row.province || row.prov || row.state || ''),
                postal_code: row.postal_code || row.postal || row.zip || '',
                phone: row.phone || row.telephone || row.phone_number || '',
                email: row.email || row.email_address || '',
                website: row.website || row.url || row.web || ''
            })
        }

        setPreview(rows)
    }

    const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false

        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
                result.push(current.replace(/^["']|["']$/g, ''))
                current = ''
            } else {
                current += char
            }
        }
        result.push(current.replace(/^["']|["']$/g, ''))
        return result
    }

    const mapProvince = (value: string): string => {
        const upper = value.toUpperCase().trim()
        if (['NS', 'NB', 'PE', 'NL'].includes(upper)) return upper

        const mapping: Record<string, string> = {
            'NOVA SCOTIA': 'NS',
            'NEW BRUNSWICK': 'NB',
            'PRINCE EDWARD ISLAND': 'PE',
            'PEI': 'PE',
            'NEWFOUNDLAND': 'NL',
            'NEWFOUNDLAND AND LABRADOR': 'NL',
            'NEWFOUNDLAND & LABRADOR': 'NL'
        }
        return mapping[upper] || 'NS'
    }

    const handleImport = async () => {
        if (!file) return

        setImporting(true)
        setError(null)

        try {
            const text = await file.text()
            const lines = text.split('\n').filter(line => line.trim())
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))

            let imported = 0
            let skipped = 0
            const errors: string[] = []

            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i])
                const row: Record<string, string> = {}
                headers.forEach((header, idx) => {
                    row[header] = values[idx]?.trim() || ''
                })

                const name = row.name || row.business_name || row.company
                if (!name) {
                    skipped++
                    continue
                }

                const business = {
                    name,
                    category: row.category || row.industry || row.type || null,
                    address_line1: row.address || row.address_line1 || row.street || null,
                    city: row.city || row.town || null,
                    province: mapProvince(row.province || row.prov || row.state || ''),
                    postal_code: row.postal_code || row.postal || row.zip || null,
                    phone_raw: row.phone || row.telephone || row.phone_number || null,
                    email: row.email || row.email_address || null,
                    website: row.website || row.url || row.web || null,
                    source: 'csv_import'
                }

                try {
                    const res = await fetch('/api/businesses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(business)
                    })

                    if (res.ok) {
                        imported++
                    } else {
                        const err = await res.json()
                        errors.push(`Row ${i}: ${err.error}`)
                        skipped++
                    }
                } catch {
                    errors.push(`Row ${i}: Network error`)
                    skipped++
                }
            }

            setResult({ success: true, imported, skipped, errors })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Import failed')
        } finally {
            setImporting(false)
        }
    }

    const clearFile = () => {
        setFile(null)
        setPreview([])
        setResult(null)
        setError(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold">Import Data</h1>
                <p className="text-[hsl(var(--muted))] mt-1">
                    Import businesses from a CSV file
                </p>
            </div>

            {/* Upload area */}
            <div className="glass-card p-8">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {!file ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-12 text-center cursor-pointer hover:border-[hsl(var(--color-primary))] transition-colors"
                    >
                        <Upload className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--muted))]" />
                        <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
                        <p className="text-[hsl(var(--muted))] text-sm mb-4">or click to browse</p>
                        <button className="btn btn-secondary">
                            Select File
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* File info */}
                        <div className="flex items-center justify-between p-4 bg-[hsl(var(--background-tertiary))] rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileText className="w-8 h-8 text-[hsl(var(--color-primary))]" />
                                <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-[hsl(var(--muted))]">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                            <button onClick={clearFile} className="btn btn-ghost p-2">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Preview */}
                        {preview.length > 0 && !result && (
                            <div>
                                <h3 className="font-semibold mb-3">Preview (first 5 rows)</h3>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>City</th>
                                                <th>Province</th>
                                                <th>Phone</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.map((row, idx) => (
                                                <tr key={idx}>
                                                    <td>{row.name || <span className="text-red-400">Missing</span>}</td>
                                                    <td>{row.city || '-'}</td>
                                                    <td>{PROVINCE_NAMES[row.province] || row.province}</td>
                                                    <td>{row.phone || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Import button */}
                        {!result && (
                            <div className="flex justify-end gap-4">
                                <button onClick={clearFile} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={importing}
                                    className="btn btn-primary"
                                >
                                    {importing ? (
                                        <>
                                            <span className="animate-spin">⏳</span>
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Import {preview.length > 0 ? 'All' : ''} Businesses
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Result */}
                        {result && (
                            <div className={`p-6 rounded-lg ${result.imported > 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    {result.imported > 0 ? (
                                        <CheckCircle className="w-6 h-6 text-green-400" />
                                    ) : (
                                        <AlertCircle className="w-6 h-6 text-yellow-400" />
                                    )}
                                    <h3 className="font-semibold">Import Complete</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="p-4 bg-[hsl(var(--background-tertiary))] rounded-lg">
                                        <p className="text-2xl font-bold text-green-400">{result.imported}</p>
                                        <p className="text-sm text-[hsl(var(--muted))]">Imported</p>
                                    </div>
                                    <div className="p-4 bg-[hsl(var(--background-tertiary))] rounded-lg">
                                        <p className="text-2xl font-bold text-yellow-400">{result.skipped}</p>
                                        <p className="text-sm text-[hsl(var(--muted))]">Skipped</p>
                                    </div>
                                </div>
                                {result.errors.length > 0 && (
                                    <details className="text-sm">
                                        <summary className="cursor-pointer text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">
                                            View {result.errors.length} errors
                                        </summary>
                                        <ul className="mt-2 space-y-1 text-red-400">
                                            {result.errors.slice(0, 10).map((err, idx) => (
                                                <li key={idx}>{err}</li>
                                            ))}
                                            {result.errors.length > 10 && (
                                                <li>...and {result.errors.length - 10} more</li>
                                            )}
                                        </ul>
                                    </details>
                                )}
                                <div className="flex justify-end mt-4">
                                    <button onClick={clearFile} className="btn btn-primary">
                                        Import Another File
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}
            </div>

            {/* CSV Format guide */}
            <div className="glass-card p-6">
                <h2 className="font-semibold mb-4">CSV Format Guide</h2>
                <p className="text-[hsl(var(--muted))] text-sm mb-4">
                    Your CSV should have headers in the first row. We&apos;ll automatically map common column names.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="font-medium mb-1">Required</p>
                        <ul className="text-[hsl(var(--muted))] space-y-1">
                            <li>• name / business_name</li>
                            <li>• province / prov</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-medium mb-1">Address</p>
                        <ul className="text-[hsl(var(--muted))] space-y-1">
                            <li>• address / street</li>
                            <li>• city</li>
                            <li>• postal_code</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-medium mb-1">Contact</p>
                        <ul className="text-[hsl(var(--muted))] space-y-1">
                            <li>• phone / telephone</li>
                            <li>• email</li>
                            <li>• website / url</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-medium mb-1">Other</p>
                        <ul className="text-[hsl(var(--muted))] space-y-1">
                            <li>• category / industry</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[hsl(var(--border))]">
                    <a
                        href="/sample-import.csv"
                        download
                        className="inline-flex items-center gap-2 text-[hsl(var(--color-primary))] hover:underline text-sm"
                    >
                        <Download className="w-4 h-4" />
                        Download sample CSV template
                    </a>
                </div>
            </div>
        </div>
    )
}
