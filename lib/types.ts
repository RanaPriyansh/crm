// Database types matching our Supabase schema

export type Province = 'NS' | 'NB' | 'PE' | 'NL'

export type BusinessStatus = 'active' | 'inactive' | 'do_not_contact' | 'bad_data' | 'duplicate'

export type BusinessSource = 'manual' | 'csv_import' | 'api_import' | 'scraper' | 'other'

export type InteractionType = 'call' | 'email' | 'meeting' | 'note' | 'other'

export type InteractionDirection = 'inbound' | 'outbound' | 'internal'

export interface Business {
    id: string
    name: string
    category: string | null
    description: string | null
    address_line1: string | null
    address_line2: string | null
    city: string | null
    province: Province
    postal_code: string | null
    phone_raw: string | null
    phone_e164: string | null
    email: string | null
    website: string | null
    latitude: number | null
    longitude: number | null
    naics_code: string | null
    size_band: 'micro' | 'small' | 'medium' | 'large' | null
    status: BusinessStatus
    source: BusinessSource
    source_ref: string | null
    contact_count: number
    last_interaction_at: string | null
    created_by: string | null
    updated_by: string | null
    created_at: string
    updated_at: string
    deleted_at: string | null
}

export interface Contact {
    id: string
    business_id: string
    first_name: string | null
    last_name: string | null
    position: string | null
    email: string | null
    phone_raw: string | null
    phone_e164: string | null
    is_primary: boolean
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface Interaction {
    id: string
    business_id: string
    contact_id: string | null
    type: InteractionType
    direction: InteractionDirection
    subject: string | null
    notes: string | null
    external_ref: string | null
    occurred_at: string
    user_id: string | null
    created_at: string
}

export interface ImportJob {
    id: string
    filename: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    total_rows: number
    imported_count: number
    skipped_count: number
    error_count: number
    error_log: string | null
    started_at: string | null
    finished_at: string | null
    user_id: string | null
    created_at: string
}

export interface Tag {
    id: string
    name: string
    color: string
    created_at: string
}

// Lists for organizing businesses and contacts
export type ListType = 'business' | 'contact' | 'mixed'

export interface List {
    id: string
    name: string
    description: string | null
    type: ListType
    color: string
    created_at: string
    updated_at: string
    stats: {
        businessCount: number
        contactCount: number
    }
}

export interface ListItem {
    list_id: string
    item_id: string
    item_type: 'business' | 'contact'
    added_at: string
}

// Form input types (for creating/updating)
export interface BusinessInput {
    name: string
    category?: string
    description?: string
    address_line1?: string
    address_line2?: string
    city?: string
    province: Province
    postal_code?: string
    phone_raw?: string
    email?: string
    website?: string
    naics_code?: string
    size_band?: 'micro' | 'small' | 'medium' | 'large'
    status?: BusinessStatus
    source?: BusinessSource
    source_ref?: string
}

export interface ContactInput {
    business_id: string
    first_name?: string
    last_name?: string
    position?: string
    email?: string
    phone_raw?: string
    is_primary?: boolean
}

export interface InteractionInput {
    business_id: string
    contact_id?: string
    type: InteractionType
    direction: InteractionDirection
    subject?: string
    notes?: string
    external_ref?: string
    occurred_at?: string
}

// API response types
export interface PaginatedResponse<T> {
    data: T[]
    count: number
    page: number
    pageSize: number
    totalPages: number
}

export interface ApiError {
    error: string
    details?: string
}

// Dashboard stats
export interface DashboardStats {
    totalBusinesses: number
    totalContacts: number
    recentInteractions: number
    byProvince: {
        province: Province
        count: number
    }[]
    recentlyAdded: Business[]
}
