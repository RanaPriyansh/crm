'use client'

import { useState, useEffect } from 'react'
import {
    Filter,
    X,
    ChevronDown,
    ChevronUp,
    Mail,
    Phone,
    Globe,
    Users,
    MapPin,
    Calendar,
    Tag,
    Building2,
    Bookmark,
    Check
} from 'lucide-react'
import { PROVINCE_NAMES, STATUS_CONFIG, SOURCE_CONFIG } from '@/lib/utils/phone'
import { FilterState, defaultFilters } from '@/lib/businesses/filters'

interface FilterPreset {
    id: string
    name: string
    filters: Partial<FilterState>
}

interface AdvancedFiltersProps {
    filters: FilterState
    onChange: (filters: FilterState) => void
    availableTags: { id: string; name: string; color: string }[]
}

const SIZE_BANDS = [
    { value: 'micro', label: 'Micro (1-4)' },
    { value: 'small', label: 'Small (5-49)' },
    { value: 'medium', label: 'Medium (50-249)' },
    { value: 'large', label: 'Large (250+)' },
]

const BOOLEAN_OPTIONS = [
    { value: null, label: 'Any' },
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
]

export function AdvancedFilters({ filters, onChange, availableTags }: AdvancedFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [activeSection, setActiveSection] = useState<string | null>('basic')
    const [presets, setPresets] = useState<FilterPreset[]>([])
    const [showPresetModal, setShowPresetModal] = useState(false)
    const [presetName, setPresetName] = useState('')

    // Load presets from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('crm-filter-presets')
        if (saved) {
            try {
                setPresets(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to load presets:', e)
            }
        }
    }, [])

    // Count active filters
    const activeFilterCount = [
        filters.provinces.length > 0,
        filters.statuses.length > 0,
        filters.sources.length > 0,
        filters.sizeBands.length > 0,
        filters.tags.length > 0,
        filters.city !== '',
        filters.category !== '',
        filters.naicsCode !== '',
        filters.hasEmail !== null,
        filters.hasPhone !== null,
        filters.hasWebsite !== null,
        filters.hasContacts !== null,
        filters.hasCoordinates !== null,
        filters.createdAfter !== '',
        filters.createdBefore !== '',
        filters.interactionAfter !== '',
        filters.interactionBefore !== '',
    ].filter(Boolean).length

    const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        onChange({ ...filters, [key]: value })
    }

    const toggleArrayValue = (key: 'provinces' | 'statuses' | 'sources' | 'sizeBands' | 'tags', value: string) => {
        const current = filters[key]
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value]
        onChange({ ...filters, [key]: updated })
    }

    const clearAllFilters = () => {
        onChange({ ...defaultFilters, search: filters.search })
    }

    const savePreset = () => {
        if (!presetName.trim()) return
        const newPreset: FilterPreset = {
            id: Date.now().toString(),
            name: presetName.trim(),
            filters: { ...filters, search: '' },
        }
        const updated = [...presets, newPreset]
        setPresets(updated)
        localStorage.setItem('crm-filter-presets', JSON.stringify(updated))
        setShowPresetModal(false)
        setPresetName('')
    }

    const loadPreset = (preset: FilterPreset) => {
        onChange({ ...defaultFilters, ...preset.filters, search: filters.search })
    }

    const deletePreset = (id: string) => {
        const updated = presets.filter(p => p.id !== id)
        setPresets(updated)
        localStorage.setItem('crm-filter-presets', JSON.stringify(updated))
    }

    const FilterSection = ({ id, title, icon: Icon, children }: {
        id: string;
        title: string;
        icon: typeof Filter;
        children: React.ReactNode
    }) => (
        <div className="border-b border-[hsl(var(--border))] last:border-b-0">
            <button
                onClick={() => setActiveSection(activeSection === id ? null : id)}
                className="w-full flex items-center justify-between p-3 hover:bg-[hsl(var(--background-tertiary))] transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[hsl(var(--muted))]" />
                    <span className="font-medium text-sm">{title}</span>
                </div>
                {activeSection === id ? (
                    <ChevronUp className="w-4 h-4 text-[hsl(var(--muted))]" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-[hsl(var(--muted))]" />
                )}
            </button>
            {activeSection === id && (
                <div className="p-3 pt-0 space-y-3">
                    {children}
                </div>
            )}
        </div>
    )

    const MultiSelect = ({
        options,
        selected,
        onToggle,
        getColor
    }: {
        options: { value: string; label: string }[];
        selected: string[];
        onToggle: (value: string) => void;
        getColor?: (value: string) => string;
    }) => (
        <div className="flex flex-wrap gap-2">
            {options.map(opt => {
                const isSelected = selected.includes(opt.value)
                const color = getColor?.(opt.value)
                return (
                    <button
                        key={opt.value}
                        onClick={() => onToggle(opt.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1
                            ${isSelected
                                ? 'bg-[hsl(var(--color-primary))] text-white'
                                : 'bg-[hsl(var(--background-tertiary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]'
                            }`}
                        style={color && isSelected ? { backgroundColor: color } : undefined}
                    >
                        {isSelected && <Check className="w-3 h-3" />}
                        {opt.label}
                    </button>
                )
            })}
        </div>
    )

    const BooleanFilter = ({
        label,
        value,
        onChange: onBoolChange
    }: {
        label: string;
        value: boolean | null;
        onChange: (v: boolean | null) => void
    }) => (
        <div className="flex items-center justify-between">
            <span className="text-sm">{label}</span>
            <div className="flex gap-1">
                {BOOLEAN_OPTIONS.map(opt => (
                    <button
                        key={String(opt.value)}
                        onClick={() => onBoolChange(opt.value)}
                        className={`px-2 py-0.5 rounded text-xs transition-colors
                            ${value === opt.value
                                ? 'bg-[hsl(var(--color-primary))] text-white'
                                : 'bg-[hsl(var(--background-tertiary))] hover:bg-[hsl(var(--border))]'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    )

    return (
        <div className="glass-card">
            {/* Header with toggle */}
            <div className="p-4 flex items-center justify-between border-b border-[hsl(var(--border))]">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 font-medium"
                >
                    <Filter className="w-4 h-4 text-[hsl(var(--color-primary))]" />
                    Advanced Filters
                    {activeFilterCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--color-primary))] text-white text-xs">
                            {activeFilterCount}
                        </span>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[hsl(var(--muted))]" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-[hsl(var(--muted))]" />
                    )}
                </button>

                <div className="flex items-center gap-2">
                    {presets.length > 0 && (
                        <select
                            onChange={(e) => {
                                const preset = presets.find(p => p.id === e.target.value)
                                if (preset) loadPreset(preset)
                            }}
                            className="input py-1 text-sm"
                            value=""
                        >
                            <option value="">Load preset...</option>
                            {presets.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    )}
                    {activeFilterCount > 0 && (
                        <>
                            <button
                                onClick={() => setShowPresetModal(true)}
                                className="btn btn-ghost text-sm py-1"
                            >
                                <Bookmark className="w-3 h-3" />
                                Save
                            </button>
                            <button
                                onClick={clearAllFilters}
                                className="btn btn-ghost text-sm py-1 text-red-400"
                            >
                                <X className="w-3 h-3" />
                                Clear All
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
                <div className="px-4 py-2 border-b border-[hsl(var(--border))] flex flex-wrap gap-2">
                    {filters.provinces.map(p => (
                        <span key={p} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                            {PROVINCE_NAMES[p] || p}
                            <button onClick={() => toggleArrayValue('provinces', p)} className="hover:text-white">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    {filters.statuses.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                            {STATUS_CONFIG[s]?.label || s}
                            <button onClick={() => toggleArrayValue('statuses', s)} className="hover:text-white">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    {filters.sources.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs">
                            {SOURCE_CONFIG[s]?.label || s}
                            <button onClick={() => toggleArrayValue('sources', s)} className="hover:text-white">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    {filters.sizeBands.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                            {SIZE_BANDS.find(b => b.value === s)?.label || s}
                            <button onClick={() => toggleArrayValue('sizeBands', s)} className="hover:text-white">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    {filters.tags.map(t => {
                        const tag = availableTags.find(at => at.id === t)
                        return (
                            <span
                                key={t}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs"
                                style={{ backgroundColor: tag?.color || '#666' }}
                            >
                                {tag?.name || t}
                                <button onClick={() => toggleArrayValue('tags', t)} className="hover:opacity-80">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )
                    })}
                    {filters.city && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">
                            City: {filters.city}
                            <button onClick={() => updateFilter('city', '')} className="hover:text-white">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {filters.hasEmail !== null && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs">
                            {filters.hasEmail ? 'Has' : 'No'} Email
                            <button onClick={() => updateFilter('hasEmail', null)} className="hover:text-white">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {filters.hasPhone !== null && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs">
                            {filters.hasPhone ? 'Has' : 'No'} Phone
                            <button onClick={() => updateFilter('hasPhone', null)} className="hover:text-white">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {(filters.createdAfter || filters.createdBefore) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs">
                            Created: {filters.createdAfter || '...'} - {filters.createdBefore || '...'}
                            <button onClick={() => { updateFilter('createdAfter', ''); updateFilter('createdBefore', ''); }} className="hover:text-white">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}

            {/* Expanded filter sections */}
            {isExpanded && (
                <div className="divide-y divide-[hsl(var(--border))]">
                    <FilterSection id="basic" title="Location & Category" icon={MapPin}>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-[hsl(var(--muted))] mb-1">Province</label>
                                <MultiSelect
                                    options={Object.entries(PROVINCE_NAMES).map(([v, l]) => ({ value: v, label: l }))}
                                    selected={filters.provinces}
                                    onToggle={(v) => toggleArrayValue('provinces', v)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[hsl(var(--muted))] mb-1">City</label>
                                    <input
                                        type="text"
                                        value={filters.city}
                                        onChange={(e) => updateFilter('city', e.target.value)}
                                        placeholder="Filter by city..."
                                        className="input py-1.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[hsl(var(--muted))] mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={filters.category}
                                        onChange={(e) => updateFilter('category', e.target.value)}
                                        placeholder="e.g., Restaurant..."
                                        className="input py-1.5 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </FilterSection>

                    <FilterSection id="status" title="Status & Source" icon={Building2}>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-[hsl(var(--muted))] mb-1">Status</label>
                                <MultiSelect
                                    options={Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
                                    selected={filters.statuses}
                                    onToggle={(v) => toggleArrayValue('statuses', v)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[hsl(var(--muted))] mb-1">Source</label>
                                <MultiSelect
                                    options={Object.entries(SOURCE_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
                                    selected={filters.sources}
                                    onToggle={(v) => toggleArrayValue('sources', v)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[hsl(var(--muted))] mb-1">Size</label>
                                <MultiSelect
                                    options={SIZE_BANDS}
                                    selected={filters.sizeBands}
                                    onToggle={(v) => toggleArrayValue('sizeBands', v)}
                                />
                            </div>
                        </div>
                    </FilterSection>

                    <FilterSection id="tags" title="Tags" icon={Tag}>
                        {availableTags.length > 0 ? (
                            <MultiSelect
                                options={availableTags.map(t => ({ value: t.id, label: t.name }))}
                                selected={filters.tags}
                                onToggle={(v) => toggleArrayValue('tags', v)}
                                getColor={(v) => availableTags.find(t => t.id === v)?.color || ''}
                            />
                        ) : (
                            <p className="text-sm text-[hsl(var(--muted))]">No tags available</p>
                        )}
                    </FilterSection>

                    <FilterSection id="contact" title="Contact Data" icon={Mail}>
                        <div className="space-y-2">
                            <BooleanFilter label="Has Email" value={filters.hasEmail} onChange={(v) => updateFilter('hasEmail', v)} />
                            <BooleanFilter label="Has Phone" value={filters.hasPhone} onChange={(v) => updateFilter('hasPhone', v)} />
                            <BooleanFilter label="Has Website" value={filters.hasWebsite} onChange={(v) => updateFilter('hasWebsite', v)} />
                            <BooleanFilter label="Has Contacts" value={filters.hasContacts} onChange={(v) => updateFilter('hasContacts', v)} />
                            <BooleanFilter label="Has Coordinates" value={filters.hasCoordinates} onChange={(v) => updateFilter('hasCoordinates', v)} />
                        </div>
                    </FilterSection>

                    <FilterSection id="dates" title="Date Ranges" icon={Calendar}>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-[hsl(var(--muted))] mb-1">Created Date</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        value={filters.createdAfter}
                                        onChange={(e) => updateFilter('createdAfter', e.target.value)}
                                        className="input py-1.5 text-sm"
                                    />
                                    <input
                                        type="date"
                                        value={filters.createdBefore}
                                        onChange={(e) => updateFilter('createdBefore', e.target.value)}
                                        className="input py-1.5 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-[hsl(var(--muted))] mb-1">Last Interaction</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        value={filters.interactionAfter}
                                        onChange={(e) => updateFilter('interactionAfter', e.target.value)}
                                        className="input py-1.5 text-sm"
                                    />
                                    <input
                                        type="date"
                                        value={filters.interactionBefore}
                                        onChange={(e) => updateFilter('interactionBefore', e.target.value)}
                                        className="input py-1.5 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </FilterSection>

                    <FilterSection id="industry" title="Industry Codes" icon={Building2}>
                        <div>
                            <label className="block text-xs text-[hsl(var(--muted))] mb-1">NAICS Code</label>
                            <input
                                type="text"
                                value={filters.naicsCode}
                                onChange={(e) => updateFilter('naicsCode', e.target.value)}
                                placeholder="e.g., 722511..."
                                className="input py-1.5 text-sm"
                            />
                        </div>
                    </FilterSection>
                </div>
            )}

            {/* Save preset modal */}
            {showPresetModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass-card p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold mb-4">Save Filter Preset</h3>
                        <input
                            type="text"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            placeholder="Preset name..."
                            className="input mb-4"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowPresetModal(false)} className="btn btn-secondary flex-1">
                                Cancel
                            </button>
                            <button onClick={savePreset} className="btn btn-primary flex-1" disabled={!presetName.trim()}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
