import type { CommitmentCreateInput } from './types'

export const SYNTHETIC_SOURCE_REF = 'synthetic-counterparty'

export type SyntheticCounterparty = {
    name: string
    category: string
    city: string
    province: 'NS' | 'NB' | 'PE' | 'NL'
    source: 'other'
    source_ref: typeof SYNTHETIC_SOURCE_REF
    status: 'active'
    description: string
}

/** Fake trading desks only. Generic perishable classes, no brand SKUs. */
export const SYNTHETIC_COUNTERPARTIES: SyntheticCounterparty[] = [
    {
        name: 'North Harbor Cold Chain Ltd',
        category: 'Cold storage',
        city: 'Halifax',
        province: 'NS',
        source: 'other',
        source_ref: SYNTHETIC_SOURCE_REF,
        status: 'active',
        description: 'Synthetic counterparty for perishable-trade commitments',
    },
    {
        name: 'Bayline Produce Brokers Inc',
        category: 'Produce brokerage',
        city: 'Moncton',
        province: 'NB',
        source: 'other',
        source_ref: SYNTHETIC_SOURCE_REF,
        status: 'active',
        description: 'Synthetic counterparty for perishable-trade commitments',
    },
    {
        name: 'Midcoast Frozen Foods Co',
        category: 'Frozen foods wholesale',
        city: 'Charlottetown',
        province: 'PE',
        source: 'other',
        source_ref: SYNTHETIC_SOURCE_REF,
        status: 'active',
        description: 'Synthetic counterparty for perishable-trade commitments',
    },
    {
        name: 'Harbor Gate Trading Desk',
        category: 'Seafood trading desk',
        city: "St. John's",
        province: 'NL',
        source: 'other',
        source_ref: SYNTHETIC_SOURCE_REF,
        status: 'active',
        description: 'Synthetic counterparty for perishable-trade commitments',
    },
    {
        name: 'Fundy Chill Distributors',
        category: 'Chilled distribution',
        city: 'Saint John',
        province: 'NB',
        source: 'other',
        source_ref: SYNTHETIC_SOURCE_REF,
        status: 'active',
        description: 'Synthetic counterparty for perishable-trade commitments',
    },
]

export function draftCommitmentFor(
    businessId: string,
    index: number
): CommitmentCreateInput {
    const windows = [
        { from: '2026-09-08', to: '2026-09-12' },
        { from: '2026-09-15', to: '2026-09-18' },
        { from: '2026-09-20', to: '2026-09-24' },
    ]
    const specs: Array<Omit<CommitmentCreateInput, 'business_id' | 'ship_window_from' | 'ship_window_to'>> = [
        {
            commodity_class: 'chilled_bivalves',
            volume: 12,
            unit: 'mt',
            incoterm: 'FOB',
            currency: 'CAD',
        },
        {
            commodity_class: 'chilled_produce',
            volume: 8000,
            unit: 'kg',
            incoterm: 'CIF',
            currency: 'USD',
        },
        {
            commodity_class: 'frozen_finfish',
            volume: 20,
            unit: 'mt',
            incoterm: 'CFR',
            currency: 'CAD',
        },
    ]
    const window = windows[index % windows.length]
    const spec = specs[index % specs.length]
    return {
        business_id: businessId,
        ...spec,
        ship_window_from: window.from,
        ship_window_to: window.to,
    }
}
