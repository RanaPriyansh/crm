import { z } from 'zod'
import {
    COMMODITY_CLASSES,
    COMMITMENT_STATUSES,
    CURRENCIES,
    CommitmentError,
    INCOTERMS,
    VOLUME_UNITS,
    type CommitmentCreateInput,
    type CommitmentStatus,
} from './types'

export const commitmentCreateSchema = z.object({
    business_id: z.string().uuid('business_id is required'),
    commodity_class: z.enum(COMMODITY_CLASSES),
    volume: z.number().positive('volume must be > 0'),
    unit: z.enum(VOLUME_UNITS),
    incoterm: z.enum(INCOTERMS),
    ship_window_from: z.string().min(1, 'ship_window_from is required'),
    ship_window_to: z.string().min(1, 'ship_window_to is required'),
    currency: z.enum(CURRENCIES),
})

export const transitionSchema = z.object({
    to: z.enum(COMMITMENT_STATUSES),
    human_ok: z.boolean().optional(),
})

function hasShipWindow(from: string | undefined, to: string | undefined): boolean {
    return Boolean(from && from.trim() && to && to.trim())
}

export function validateCreateInput(input: unknown): CommitmentCreateInput {
    if (!input || typeof input !== 'object') {
        throw new CommitmentError('invalid_input', 'Commitment body is required')
    }

    const raw = input as Record<string, unknown>

    if (!raw.business_id) {
        throw new CommitmentError('missing_business', 'No commitment without a business_id')
    }

    if (!hasShipWindow(
        typeof raw.ship_window_from === 'string' ? raw.ship_window_from : undefined,
        typeof raw.ship_window_to === 'string' ? raw.ship_window_to : undefined
    )) {
        throw new CommitmentError('missing_ship_window', 'Ship window from and to are required')
    }

    const parsed = commitmentCreateSchema.safeParse(input)
    if (!parsed.success) {
        throw new CommitmentError(
            'invalid_input',
            parsed.error.issues.map((i) => i.message).join('; ')
        )
    }

    if (parsed.data.ship_window_from > parsed.data.ship_window_to) {
        throw new CommitmentError(
            'invalid_ship_window',
            'ship_window_from must be on or before ship_window_to'
        )
    }

    return parsed.data
}

export function validateTransitionTarget(to: unknown): CommitmentStatus {
    const parsed = z.enum(COMMITMENT_STATUSES).safeParse(to)
    if (!parsed.success) {
        throw new CommitmentError('illegal_transition', 'Unknown status')
    }
    return parsed.data
}
