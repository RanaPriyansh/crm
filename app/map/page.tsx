'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Building2, MapPin, Filter, X, Search } from 'lucide-react'
import { Business } from '@/lib/types'
import { PROVINCE_NAMES, STATUS_CONFIG } from '@/lib/utils/phone'
import 'leaflet/dist/leaflet.css'

// Dynamic import for Leaflet
const MapContainer = dynamic(
    () => import('react-leaflet').then(mod => mod.MapContainer),
    { ssr: false }
)
const TileLayer = dynamic(
    () => import('react-leaflet').then(mod => mod.TileLayer),
    { ssr: false }
)
const Marker = dynamic(
    () => import('react-leaflet').then(mod => mod.Marker),
    { ssr: false }
)
const Popup = dynamic(
    () => import('react-leaflet').then(mod => mod.Popup),
    { ssr: false }
)

export default function MapPage() {
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedProvince, setSelectedProvince] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [L, setL] = useState<typeof import('leaflet') | null>(null)

    useEffect(() => {
        // Load Leaflet
        import('leaflet').then(leaflet => {
            setL(leaflet.default)
        })
    }, [])

    useEffect(() => {
        async function fetchBusinesses() {
            try {
                const params = new URLSearchParams({ pageSize: '500' })
                if (selectedProvince) params.set('province', selectedProvince)
                if (searchQuery) params.set('search', searchQuery)

                const res = await fetch(`/api/businesses?${params}`)
                const data = await res.json()
                setBusinesses(data.data || [])
            } catch (error) {
                console.error('Failed to fetch businesses:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchBusinesses()
    }, [selectedProvince, searchQuery])

    // Filter businesses with coordinates
    const mappableBusinesses = useMemo(() =>
        businesses.filter(b => b.latitude && b.longitude),
        [businesses]
    )

    // Calculate map center
    const mapCenter = useMemo(() => {
        if (mappableBusinesses.length === 0) {
            // Default to Atlantic Canada center
            return { lat: 45.9636, lng: -64.5167 }
        }
        const avgLat = mappableBusinesses.reduce((sum, b) => sum + (b.latitude || 0), 0) / mappableBusinesses.length
        const avgLng = mappableBusinesses.reduce((sum, b) => sum + (b.longitude || 0), 0) / mappableBusinesses.length
        return { lat: avgLat, lng: avgLng }
    }, [mappableBusinesses])

    // Create custom icon
    const customIcon = useMemo(() => {
        if (!L) return null
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background: linear-gradient(135deg, hsl(264, 80%, 54%), hsl(199, 89%, 48%));
                width: 32px;
                height: 32px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        })
    }, [L])

    if (loading || !L) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--color-primary))] border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-[hsl(var(--color-primary))]" />
                        Business Map
                    </h1>
                    <span className="badge bg-[hsl(var(--color-primary))]/20 text-[hsl(var(--color-primary))]">
                        {mappableBusinesses.length} on map
                    </span>
                    {businesses.length - mappableBusinesses.length > 0 && (
                        <span className="text-sm text-[hsl(var(--muted))]">
                            ({businesses.length - mappableBusinesses.length} without coordinates)
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted))]" />
                        <input
                            type="text"
                            placeholder="Search businesses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10 w-64"
                        />
                    </div>

                    {/* Filters toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn btn-secondary ${showFilters ? 'bg-[hsl(var(--color-primary))]/20' : ''}`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>
            </div>

            {/* Filters panel */}
            {showFilters && (
                <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--background-secondary))] flex items-center gap-4">
                    <select
                        value={selectedProvince}
                        onChange={(e) => setSelectedProvince(e.target.value)}
                        className="input w-48"
                    >
                        <option value="">All Provinces</option>
                        {Object.entries(PROVINCE_NAMES).map(([code, name]) => (
                            <option key={code} value={code}>{name}</option>
                        ))}
                    </select>

                    {selectedProvince && (
                        <button
                            onClick={() => setSelectedProvince('')}
                            className="btn btn-ghost text-sm"
                        >
                            <X className="w-4 h-4" /> Clear filters
                        </button>
                    )}
                </div>
            )}

            {/* Map */}
            <div className="flex-1 relative">
                {mappableBusinesses.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[hsl(var(--background-tertiary))]">
                        <Building2 className="w-16 h-16 text-[hsl(var(--muted))] opacity-50 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">No businesses with coordinates</h2>
                        <p className="text-[hsl(var(--muted))] mb-4">
                            Add latitude and longitude to businesses to see them on the map
                        </p>
                        <Link href="/import" className="btn btn-primary">
                            Import CSV with coordinates
                        </Link>
                    </div>
                ) : (
                    <MapContainer
                        center={[mapCenter.lat, mapCenter.lng]}
                        zoom={7}
                        style={{ height: '100%', width: '100%' }}
                        className="z-0"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {mappableBusinesses.map((business) => (
                            customIcon && (
                                <Marker
                                    key={business.id}
                                    position={[business.latitude!, business.longitude!]}
                                    icon={customIcon}
                                >
                                    <Popup>
                                        <div className="min-w-[200px]">
                                            <h3 className="font-bold text-lg mb-1">{business.name}</h3>
                                            {business.category && (
                                                <p className="text-sm text-gray-600 mb-2">{business.category}</p>
                                            )}
                                            <p className="text-sm mb-2">
                                                {[business.city, PROVINCE_NAMES[business.province]].filter(Boolean).join(', ')}
                                            </p>
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_CONFIG[business.status]?.color || ''}`}>
                                                {STATUS_CONFIG[business.status]?.label || business.status}
                                            </span>
                                            <Link
                                                href={`/businesses/${business.id}`}
                                                className="block mt-3 text-center py-1.5 px-3 bg-[hsl(264,80%,54%)] text-white rounded hover:opacity-90 text-sm font-medium"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </Popup>
                                </Marker>
                            )
                        ))}
                    </MapContainer>
                )}
            </div>
        </div>
    )
}
