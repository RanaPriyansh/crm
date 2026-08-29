// Fail-closed validation for commitment creation.
// Rejects: missing business_id, missing/!invalid ship window, bad enums.

import { z } from 'zod'
import type { CommitmentInput } from './types'

export const commodityClassSchema = z.enum([
    'fresh_finfish',
    'frozen_finfish',
    'live_shellfish',
    'frozen_shellfish',
    'fresh_produce',
    'dairy',
    'poultry',
    'red_meat',
])

export const volumeUnitSchema = z.enum(['kg', 'lb', 'tonne', 'case', 'pallet'])

export const incotermSchema = z.enum(['EXW', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'])

export const currencySchema = z.enum(['CAD', 'USD', 'EUR', 'GBP', 'JPY'])

// Calendar date (YYYY-MM-DD) that is also a real, parseable date.
const isoDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid calendar date')

export const commitmentInputSchema = z
    .object({
        business_id: z.string().min(1, 'business_id is required'),
        commodity_class: commodityClassSchema,
        volume: z.number().positive('volume must be greater than 0'),
        unit: volumeUnitSchema,
        incoterm: incotermSchema,
        ship_window_from: isoDateSchema,
        ship_window_to: isoDateSchema,
        currency: currencySchema,
        notes: z.string().max(2000).optional().nullable(),
    })
    .refine(
        (v) => Date.parse(v.ship_window_from) <= Date.parse(v.ship_window_to),
        {
            message: 'ship_window_from must be on or before ship_window_to',
            path: ['ship_window_to'],
        },
    )

export type CommitmentInputSchema = z.infer<typeof commitmentInputSchema>

export type ValidateResult =
    | { ok: true; value: CommitmentInput }
    | { ok: false; errors: Record<string, string[]> }

export function validateCommitmentInput(data: unknown): ValidateResult {
    const result = commitmentInputSchema.safeParse(data)
    if (result.success) {
        return { ok: true, value: result.data }
    }
    return { ok: false, errors: result.error.flatten().fieldErrors }
}

// Status transition request payload (for the transition endpoint).
export const transitionInputSchema = z.object({
    to: z.enum(['internal_ok', 'send_hold', 'confirmed', 'killed']),
    human_ok: z.boolean().optional().default(false),
    actor: z.string().min(1).optional(),
    note: z.string().max(2000).optional().nullable(),
})

export type TransitionInputSchema = z.infer<typeof transitionInputSchema>
