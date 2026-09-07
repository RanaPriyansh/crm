export const COMMITMENT_STATUSES = [
    'draft',
    'internal_ok',
    'send_hold',
    'confirmed',
    'killed',
] as const

export type CommitmentStatus = (typeof COMMITMENT_STATUSES)[number]

export const COMMODITY_CLASSES = [
    'chilled_bivalves',
    'live_crustacean',
    'frozen_finfish',
    'live_finfish',
    'chilled_produce',
    'frozen_produce',
    'chilled_dairy',
] as const

export type CommodityClass = (typeof COMMODITY_CLASSES)[number]

export const VOLUME_UNITS = ['kg', 'mt', 'lb', 'cases'] as const
export type VolumeUnit = (typeof VOLUME_UNITS)[number]

export const INCOTERMS = [
    'EXW',
    'FCA',
    'FAS',
    'FOB',
    'CFR',
    'CIF',
    'CPT',
    'CIP',
    'DAP',
    'DPU',
    'DDP',
] as const

export type Incoterm = (typeof INCOTERMS)[number]

export const CURRENCIES = ['CAD', 'USD', 'EUR'] as const
export type CommitmentCurrency = (typeof CURRENCIES)[number]

export interface Commitment {
    id: string
    business_id: string
    commodity_class: CommodityClass
    volume: number
    unit: VolumeUnit
    incoterm: Incoterm
    ship_window_from: string
    ship_window_to: string
    currency: CommitmentCurrency
    status: CommitmentStatus
    human_ok_at: string | null
    human_ok_by: string | null
    created_by: string
    created_at: string
    updated_at: string
}

export interface CommitmentAuditEntry {
    id: string
    commitment_id: string
    actor: string
    at: string
    from_status: CommitmentStatus
    to_status: CommitmentStatus
}

export interface CommitmentCreateInput {
    business_id: string
    commodity_class: CommodityClass
    volume: number
    unit: VolumeUnit
    incoterm: Incoterm
    ship_window_from: string
    ship_window_to: string
    currency: CommitmentCurrency
}

export interface TransitionInput {
    to: CommitmentStatus
    human_ok?: boolean
    actor: string
}

export type CommitmentErrorCode =
    | 'illegal_transition'
    | 'hitl_required'
    | 'missing_business'
    | 'missing_ship_window'
    | 'invalid_ship_window'
    | 'invalid_input'
    | 'not_found'
    | 'not_draft'

export class CommitmentError extends Error {
    readonly code: CommitmentErrorCode

    constructor(code: CommitmentErrorCode, message: string) {
        super(message)
        this.name = 'CommitmentError'
        this.code = code
    }
}

export interface CommitmentStore {
    insert(commitment: Commitment): Promise<void>
    get(id: string): Promise<Commitment | null>
    update(commitment: Commitment): Promise<void>
    list(): Promise<Commitment[]>
    appendAudit(entry: CommitmentAuditEntry): Promise<void>
    listAudit(commitmentId: string): Promise<CommitmentAuditEntry[]>
    businessExists(id: string): Promise<boolean>
}
