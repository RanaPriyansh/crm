// Perishable-trade commitment hub — domain types.
// A commitment is a synthetic, human-gated trade intent against an existing
// business (the counterparty). It is NOT a CRM record and NOT a deal/pipeline.

export type CommitmentStatus =
    | 'draft'
    | 'internal_ok'
    | 'send_hold'
    | 'confirmed'
    | 'killed'

// Generic perishable classes only — never real brand SKUs.
export type CommodityClass =
    | 'fresh_finfish'
    | 'frozen_finfish'
    | 'live_shellfish'
    | 'frozen_shellfish'
    | 'fresh_produce'
    | 'dairy'
    | 'poultry'
    | 'red_meat'

export type VolumeUnit = 'kg' | 'lb' | 'tonne' | 'case' | 'pallet'

// Incoterms 2020 (common subset).
export type Incoterm = 'EXW' | 'FOB' | 'CFR' | 'CIF' | 'DAP' | 'DDP'

export type Currency = 'CAD' | 'USD' | 'EUR' | 'GBP' | 'JPY'

export interface Commitment {
    id: string
    // Fail-closed invariant: a commitment cannot exist without a counterparty.
    business_id: string
    // Denormalized counterparty label for display; source of truth is business_id.
    counterparty_name: string | null
    commodity_class: CommodityClass
    volume: number
    unit: VolumeUnit
    incoterm: Incoterm
    ship_window_from: string // ISO date (YYYY-MM-DD)
    ship_window_to: string   // ISO date (YYYY-MM-DD)
    currency: Currency
    status: CommitmentStatus
    // Human-in-the-loop attestation. Must be true to leave draft.
    human_ok: boolean
    notes: string | null
    created_by: string | null
    created_at: string
    updated_at: string
}

// Append-only: one row per status change. Rows are never edited or deleted.
export interface CommitmentAuditEntry {
    id: string
    commitment_id: string
    actor: string
    from_status: CommitmentStatus | null
    to_status: CommitmentStatus
    human_ok: boolean
    note: string | null
    at: string
}

export interface CommitmentInput {
    business_id: string
    commodity_class: CommodityClass
    volume: number
    unit: VolumeUnit
    incoterm: Incoterm
    ship_window_from: string
    ship_window_to: string
    currency: Currency
    notes?: string | null
}
