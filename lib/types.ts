import { z } from 'zod'

import {
    businessInputSchema,
    businessSchema,
    businessSourceSchema,
    businessStatusSchema,
    contactInputSchema,
    contactSchema,
    interactionDirectionSchema,
    interactionInputSchema,
    interactionSchema,
    interactionTypeSchema,
    provinceSchema,
} from './validations'

// Database types matching our Supabase schema
export type Province = z.infer<typeof provinceSchema>

export type BusinessStatus = z.infer<typeof businessStatusSchema>

export type BusinessSource = z.infer<typeof businessSourceSchema>

export type InteractionType = z.infer<typeof interactionTypeSchema>

export type InteractionDirection = z.infer<typeof interactionDirectionSchema>

export type Business = z.infer<typeof businessSchema>

export type Contact = z.infer<typeof contactSchema>

export type Interaction = z.infer<typeof interactionSchema>

// Form input types (for creating/updating)
export type BusinessInput = z.input<typeof businessInputSchema>

export type ContactInput = z.input<typeof contactInputSchema>

export type InteractionInput = z.input<typeof interactionInputSchema>

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
