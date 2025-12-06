import { z } from 'zod'

// Province enum
export const provinceSchema = z.enum(['NS', 'NB', 'PE', 'NL'])

// Business schemas
export const businessStatusSchema = z.enum([
    'active', 'inactive', 'do_not_contact', 'bad_data', 'duplicate'
])

export const businessSourceSchema = z.enum([
    'manual', 'csv_import', 'api_import', 'scraper', 'other'
])

export const sizeBandSchema = z.enum(['micro', 'small', 'medium', 'large'])

export const businessInputSchema = z.object({
    name: z.string().min(1, 'Business name is required').max(255),
    category: z.string().max(100).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    address_line1: z.string().max(255).optional().nullable(),
    address_line2: z.string().max(255).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    province: provinceSchema,
    postal_code: z.string().max(10).optional().nullable(),
    phone_raw: z.string().max(50).optional().nullable(),
    email: z.string().email('Invalid email').max(255).optional().nullable().or(z.literal('')),
    website: z.string().url('Invalid URL').max(255).optional().nullable().or(z.literal('')),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    naics_code: z.string().max(10).optional().nullable(),
    size_band: sizeBandSchema.optional().nullable(),
    status: businessStatusSchema.default('active'),
    source: businessSourceSchema.default('manual'),
    source_ref: z.string().max(500).optional().nullable(),
})

export const businessSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    category: z.string().nullable(),
    description: z.string().nullable(),
    address_line1: z.string().nullable(),
    address_line2: z.string().nullable(),
    city: z.string().nullable(),
    province: provinceSchema,
    postal_code: z.string().nullable(),
    phone_raw: z.string().nullable(),
    phone_e164: z.string().nullable(),
    email: z.string().nullable(),
    website: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    naics_code: z.string().nullable(),
    size_band: sizeBandSchema.nullable(),
    status: businessStatusSchema,
    source: businessSourceSchema,
    source_ref: z.string().nullable(),
    contact_count: z.number(),
    last_interaction_at: z.string().datetime().nullable(),
    created_by: z.string().nullable(),
    updated_by: z.string().nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    deleted_at: z.string().datetime().nullable(),
})

export type BusinessSchema = z.infer<typeof businessSchema>
export type BusinessInputSchema = z.infer<typeof businessInputSchema>
export type BusinessFormInput = z.input<typeof businessInputSchema>

// Contact schemas
export const contactInputSchema = z.object({
    business_id: z.string().uuid(),
    first_name: z.string().max(100).optional().nullable(),
    last_name: z.string().max(100).optional().nullable(),
    position: z.string().max(100).optional().nullable(),
    email: z.string().email('Invalid email').max(255).optional().nullable().or(z.literal('')),
    phone_raw: z.string().max(50).optional().nullable(),
    is_primary: z.boolean().optional().default(false),
})

export const contactSchema = z.object({
    id: z.string().uuid(),
    business_id: z.string().uuid(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    position: z.string().nullable(),
    email: z.string().nullable(),
    phone_raw: z.string().nullable(),
    phone_e164: z.string().nullable(),
    is_primary: z.boolean(),
    created_by: z.string().nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
})

export type ContactSchema = z.infer<typeof contactSchema>
export type ContactInputSchema = z.infer<typeof contactInputSchema>

// Interaction schemas
export const interactionTypeSchema = z.enum(['call', 'email', 'meeting', 'note', 'other'])
export const interactionDirectionSchema = z.enum(['inbound', 'outbound', 'internal'])

export const interactionInputSchema = z.object({
    business_id: z.string().uuid(),
    contact_id: z.string().uuid().optional().nullable(),
    type: interactionTypeSchema,
    direction: interactionDirectionSchema,
    subject: z.string().max(255).optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
    external_ref: z.string().max(255).optional().nullable(),
    occurred_at: z.string().datetime().optional(),
})

export const interactionSchema = z.object({
    id: z.string().uuid(),
    business_id: z.string().uuid(),
    contact_id: z.string().uuid().nullable(),
    type: interactionTypeSchema,
    direction: interactionDirectionSchema,
    subject: z.string().nullable(),
    notes: z.string().nullable(),
    external_ref: z.string().nullable(),
    occurred_at: z.string().datetime(),
    user_id: z.string().nullable(),
    created_at: z.string().datetime(),
})

export type InteractionSchema = z.infer<typeof interactionSchema>
export type InteractionInputSchema = z.infer<typeof interactionInputSchema>

// Query params schemas
export const businessQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    province: provinceSchema.optional(),
    status: businessStatusSchema.optional(),
    source: businessSourceSchema.optional(),
    sortBy: z.enum(['name', 'city', 'created_at', 'last_interaction_at']).default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type BusinessQuerySchema = z.infer<typeof businessQuerySchema>

// CSV Import schema
export const csvRowSchema = z.object({
    name: z.string().min(1),
    category: z.string().optional(),
    address_line1: z.string().optional(),
    city: z.string().optional(),
    province: provinceSchema,
    postal_code: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
})

export type CsvRowSchema = z.infer<typeof csvRowSchema>

// Validation helper
export function validateAndParse<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: true; data: T
} | {
    success: false; error: z.ZodError
} {
    const result = schema.safeParse(data)
    if (result.success) {
        return { success: true, data: result.data }
    }
    return { success: false, error: result.error }
}
