// Synthetic seed data for the commitment hub.
// Everything here is invented for local demos: no real companies, no brand
// SKUs, no real contact details. Counterparties are generic placeholders.

import type { CommodityClass, Currency, Incoterm, VolumeUnit } from './types'

export interface SyntheticCounterparty {
    name: string
    city: string
    province: 'NS' | 'NB' | 'PE' | 'NL'
    category: string
    email: string
}

// Synthetic counterparties only. Names are obviously placeholder/test entities.
export const SYNTHETIC_COUNTERPARTIES: SyntheticCounterparty[] = [
    {
        name: 'Northwater Synthetic Traders',
        city: 'Halifax',
        province: 'NS',
        category: 'Perishable wholesale (synthetic)',
        email: 'desk@northwater.example',
    },
    {
        name: 'Harbourline Test Provisions',
        city: 'Saint John',
        province: 'NB',
        category: 'Perishable wholesale (synthetic)',
        email: 'orders@harbourline.example',
    },
    {
        name: 'Tidewater Sample Foods',
        city: 'Charlottetown',
        province: 'PE',
        category: 'Perishable wholesale (synthetic)',
        email: 'trade@tidewater.example',
    },
    {
        name: 'Bayfront Mock Distributors',
        city: "St. John's",
        province: 'NL',
        category: 'Perishable wholesale (synthetic)',
        email: 'sales@bayfront.example',
    },
]

interface SampleCommitmentTemplate {
    commodity_class: CommodityClass
    volume: number
    unit: VolumeUnit
    incoterm: Incoterm
    currency: Currency
    ship_offset_from_days: number
    ship_offset_to_days: number
    notes: string
}

export const SAMPLE_COMMITMENT_TEMPLATES: SampleCommitmentTemplate[] = [
    {
        commodity_class: 'live_shellfish',
        volume: 12,
        unit: 'pallet',
        incoterm: 'FOB',
        currency: 'CAD',
        ship_offset_from_days: 14,
        ship_offset_to_days: 21,
        notes: 'Synthetic demo commitment.',
    },
    {
        commodity_class: 'fresh_finfish',
        volume: 8000,
        unit: 'kg',
        incoterm: 'CIF',
        currency: 'USD',
        ship_offset_from_days: 10,
        ship_offset_to_days: 17,
        notes: 'Synthetic demo commitment.',
    },
    {
        commodity_class: 'fresh_produce',
        volume: 40,
        unit: 'case',
        incoterm: 'DAP',
        currency: 'CAD',
        ship_offset_from_days: 7,
        ship_offset_to_days: 12,
        notes: 'Synthetic demo commitment.',
    },
    {
        commodity_class: 'frozen_finfish',
        volume: 20,
        unit: 'tonne',
        incoterm: 'CFR',
        currency: 'EUR',
        ship_offset_from_days: 21,
        ship_offset_to_days: 35,
        notes: 'Synthetic demo commitment.',
    },
]

export function isoDateInDays(days: number, from: Date = new Date()): string {
    const d = new Date(from)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
}
