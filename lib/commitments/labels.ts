import type { CommodityClass, CommitmentStatus } from './types'

export const STATUS_LABEL: Record<CommitmentStatus, string> = {
    draft: 'draft',
    internal_ok: 'internal_ok',
    send_hold: 'send_hold (not sent)',
    confirmed: 'confirmed',
    killed: 'killed',
}

export const COMMODITY_LABEL: Record<CommodityClass, string> = {
    chilled_bivalves: 'Chilled bivalves',
    live_crustacean: 'Live crustacean',
    frozen_finfish: 'Frozen finfish',
    live_finfish: 'Live finfish',
    chilled_produce: 'Chilled produce',
    frozen_produce: 'Frozen produce',
    chilled_dairy: 'Chilled dairy',
}

export const MACHINE_ORDER: CommitmentStatus[] = [
    'draft',
    'internal_ok',
    'send_hold',
    'confirmed',
]
