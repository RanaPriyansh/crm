import { NextResponse } from 'next/server'
import * as devStore from '@/lib/dev-store'
import { Business } from '@/lib/types'

// Check dev mode
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isDevMode = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseUrl.startsWith('https://')

export const dynamic = 'force-dynamic'

// GET /api/export/businesses - Export businesses as CSV
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const province = searchParams.get('province')

    let businesses: Business[]

    if (isDevMode) {
        businesses = devStore.getBusinesses()
        if (province) {
            businesses = businesses.filter(b => b.province === province)
        }
    } else {
        // Production mode would fetch from Supabase
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()

        let query = supabase
            .from('businesses')
            .select('*')
            .is('deleted_at', null)

        if (province) {
            query = query.eq('province', province)
        }

        const { data } = await query.order('name')
        businesses = data || []
    }

    if (format === 'json') {
        return NextResponse.json(businesses, {
            headers: {
                'Content-Disposition': 'attachment; filename="businesses.json"'
            }
        })
    }

    // Convert to CSV
    const headers = [
        'name', 'category', 'description',
        'address_line1', 'address_line2', 'city', 'province', 'postal_code',
        'phone_raw', 'email', 'website',
        'latitude', 'longitude',
        'naics_code', 'size_band', 'status', 'source',
        'created_at'
    ]

    const escapeCSV = (value: unknown): string => {
        if (value === null || value === undefined) return ''
        const str = String(value)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
        }
        return str
    }

    const csvRows = [
        headers.join(','),
        ...businesses.map(business =>
            headers.map(h => escapeCSV((business as unknown as Record<string, unknown>)[h])).join(',')
        )
    ]

    const csv = csvRows.join('\n')

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="businesses-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
    })
}
