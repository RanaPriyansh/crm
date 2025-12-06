'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Database,
    Play,
    Upload,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    ChevronDown,
    FileText,
    Download,
    AlertCircle
} from 'lucide-react'
import type { RegistryJob, RegistrySource, RegistryRecord } from '@/lib/types'

const SOURCE_OPTIONS: { value: RegistrySource; label: string; type: 'api' | 'csv' }[] = [
    { value: 'ns_registry', label: 'Nova Scotia Registry', type: 'api' },
    { value: 'nb_registry', label: 'New Brunswick Corporate', type: 'csv' },
    { value: 'pei_registry', label: 'PEI Corporate Names', type: 'csv' },
    { value: 'nl_registry', label: 'Newfoundland Companies', type: 'csv' },
]

const STATUS_ICONS = {
    pending: Clock,
    running: Loader2,
    completed: CheckCircle2,
    failed: XCircle,
}

const STATUS_COLORS = {
    pending: 'text-yellow-400',
    running: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
}

export default function RegistryPage() {
    const [jobs, setJobs] = useState<RegistryJob[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSource, setSelectedSource] = useState<RegistrySource>('ns_registry')
    const [query, setQuery] = useState('')
    const [csvFile, setCsvFile] = useState<File | null>(null)
    const [starting, setStarting] = useState(false)
    const [expandedJob, setExpandedJob] = useState<string | null>(null)
    const [jobRecords, setJobRecords] = useState<Record<string, RegistryRecord[]>>({})
    const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
    const [importing, setImporting] = useState(false)

    const sourceConfig = SOURCE_OPTIONS.find(s => s.value === selectedSource)

    const fetchJobs = useCallback(async () => {
        try {
            const res = await fetch('/api/registry/jobs')
            if (res.ok) {
                const data = await res.json()
                setJobs(data)
            }
        } catch (err) {
            console.error('Failed to fetch jobs:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    // Poll for running jobs
    useEffect(() => {
        fetchJobs()
        const interval = setInterval(() => {
            const hasRunning = jobs.some(j => j.status === 'running' || j.status === 'pending')
            if (hasRunning) {
                fetchJobs()
            }
        }, 2000)
        return () => clearInterval(interval)
    }, [jobs, fetchJobs])

    const handleStartJob = async () => {
        setStarting(true)

        try {
            let csvData: string | undefined

            if (sourceConfig?.type === 'csv' && csvFile) {
                csvData = await csvFile.text()
            }

            const res = await fetch('/api/registry/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: selectedSource,
                    mode: 'full_refresh',
                    query: query || undefined,
                    csvData,
                })
            })

            if (res.ok) {
                setQuery('')
                setCsvFile(null)
                fetchJobs()
            }
        } catch (err) {
            console.error('Failed to start job:', err)
        } finally {
            setStarting(false)
        }
    }

    const handleExpandJob = async (jobId: string) => {
        if (expandedJob === jobId) {
            setExpandedJob(null)
            return
        }

        setExpandedJob(jobId)
        setSelectedRecords(new Set())

        try {
            const res = await fetch(`/api/registry/jobs/${jobId}`)
            if (res.ok) {
                const data = await res.json()
                setJobRecords(prev => ({ ...prev, [jobId]: data.records || [] }))
            }
        } catch (err) {
            console.error('Failed to fetch job details:', err)
        }
    }

    const handleImport = async (jobId: string) => {
        if (selectedRecords.size === 0) return

        setImporting(true)
        try {
            const res = await fetch(`/api/registry/jobs/${jobId}/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordIds: Array.from(selectedRecords) })
            })

            if (res.ok) {
                const data = await res.json()
                alert(`Imported ${data.imported} of ${data.total} records to businesses`)
                setSelectedRecords(new Set())
                fetchJobs()
            }
        } catch (err) {
            console.error('Failed to import:', err)
        } finally {
            setImporting(false)
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Database className="w-8 h-8 text-[hsl(var(--color-primary))]" />
                    Registry Import
                </h1>
                <p className="text-[hsl(var(--muted))] mt-1">
                    Import business data from government registries and open data sources
                </p>
            </div>

            {/* New Import Section */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4">Start New Import</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Source Selector */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Data Source</label>
                        <select
                            value={selectedSource}
                            onChange={(e) => setSelectedSource(e.target.value as RegistrySource)}
                            className="input"
                        >
                            {SOURCE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label} ({opt.type === 'api' ? 'API' : 'CSV Upload'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Query / Filter */}
                    {sourceConfig?.type === 'api' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Search Filter (optional)
                            </label>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g., Active"
                                className="input"
                            />
                        </div>
                    )}

                    {/* CSV Upload */}
                    {sourceConfig?.type === 'csv' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Upload CSV File</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="csv-upload"
                                />
                                <label
                                    htmlFor="csv-upload"
                                    className="input cursor-pointer flex items-center gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    {csvFile ? csvFile.name : 'Choose file...'}
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Start Button */}
                    <div className="flex items-end">
                        <button
                            onClick={handleStartJob}
                            disabled={starting || (sourceConfig?.type === 'csv' && !csvFile)}
                            className="btn btn-primary w-full"
                        >
                            {starting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    Start Import
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {sourceConfig?.type === 'api' && (
                    <p className="text-sm text-[hsl(var(--muted))] mt-3">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        NS Registry uses the Socrata Open Data API. Data is fetched in real-time.
                    </p>
                )}
            </div>

            {/* Job History */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Import History</h2>
                    <button onClick={fetchJobs} className="btn btn-ghost p-2">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {loading ? (
                    <div className="py-8 text-center text-[hsl(var(--muted))]">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading jobs...
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="py-8 text-center text-[hsl(var(--muted))]">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No import jobs yet</p>
                        <p className="text-sm">Start your first import above</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {jobs.map(job => {
                            const StatusIcon = STATUS_ICONS[job.status]
                            const isExpanded = expandedJob === job.id
                            const records = jobRecords[job.id] || []

                            return (
                                <div key={job.id} className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
                                    {/* Job Header */}
                                    <button
                                        onClick={() => handleExpandJob(job.id)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-[hsl(var(--background-tertiary))] transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <StatusIcon className={`w-5 h-5 ${STATUS_COLORS[job.status]} ${job.status === 'running' ? 'animate-spin' : ''}`} />
                                            <div className="text-left">
                                                <p className="font-medium">
                                                    {SOURCE_OPTIONS.find(s => s.value === job.source)?.label || job.source}
                                                </p>
                                                <p className="text-sm text-[hsl(var(--muted))]">
                                                    {new Date(job.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right text-sm">
                                                <p>{job.stats.fetched} fetched</p>
                                                <p className="text-[hsl(var(--muted))]">
                                                    {job.stats.normalized} normalized, {job.stats.created} imported
                                                </p>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="border-t border-[hsl(var(--border))] p-4 bg-[hsl(var(--background-secondary))]">
                                            {/* Logs */}
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium mb-2">Logs</h4>
                                                <div className="bg-[hsl(var(--background))] rounded p-3 max-h-32 overflow-y-auto text-xs font-mono">
                                                    {job.logs.map((log, i) => (
                                                        <div key={i} className="text-[hsl(var(--muted))]">{log}</div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Records */}
                                            {records.length > 0 && job.status === 'completed' && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="text-sm font-medium">
                                                            Records ({records.length})
                                                        </h4>
                                                        <button
                                                            onClick={() => handleImport(job.id)}
                                                            disabled={selectedRecords.size === 0 || importing}
                                                            className="btn btn-primary py-1 text-sm"
                                                        >
                                                            {importing ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Download className="w-4 h-4" />
                                                            )}
                                                            Import Selected ({selectedRecords.size})
                                                        </button>
                                                    </div>
                                                    <div className="max-h-64 overflow-y-auto border border-[hsl(var(--border))] rounded">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-[hsl(var(--background))]">
                                                                <tr>
                                                                    <th className="p-2 text-left w-8">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedRecords.size === records.filter(r => r.status === 'processed').length}
                                                                            onChange={(e) => {
                                                                                if (e.target.checked) {
                                                                                    setSelectedRecords(new Set(records.filter(r => r.status === 'processed').map(r => r.id)))
                                                                                } else {
                                                                                    setSelectedRecords(new Set())
                                                                                }
                                                                            }}
                                                                            className="rounded"
                                                                        />
                                                                    </th>
                                                                    <th className="p-2 text-left">Name</th>
                                                                    <th className="p-2 text-left">Registry ID</th>
                                                                    <th className="p-2 text-left">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {records.map(record => (
                                                                    <tr key={record.id} className="border-t border-[hsl(var(--border))]">
                                                                        <td className="p-2">
                                                                            {record.status === 'processed' && (
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={selectedRecords.has(record.id)}
                                                                                    onChange={(e) => {
                                                                                        const newSet = new Set(selectedRecords)
                                                                                        if (e.target.checked) {
                                                                                            newSet.add(record.id)
                                                                                        } else {
                                                                                            newSet.delete(record.id)
                                                                                        }
                                                                                        setSelectedRecords(newSet)
                                                                                    }}
                                                                                    className="rounded"
                                                                                />
                                                                            )}
                                                                        </td>
                                                                        <td className="p-2">
                                                                            {record.normalized_data?.name || 'Unknown'}
                                                                            {record.normalized_data?.is_numbered_company && (
                                                                                <span className="ml-2 text-xs px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                                                                                    Holding
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="p-2 font-mono text-xs">
                                                                            {record.normalized_data?.registry_id}
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <span className={record.normalized_data?.is_active ? 'text-green-400' : 'text-[hsl(var(--muted))]'}>
                                                                                {record.normalized_data?.status_raw}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
