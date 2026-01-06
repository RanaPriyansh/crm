import { NextResponse } from 'next/server'
import * as devStore from '@/lib/dev-store'
import { isDevMode } from '@/lib/config'

export const dynamic = 'force-dynamic'

// GET /api/search?q=query - Global search across businesses and contacts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''

    if (!query || query.length < 2) {
        return NextResponse.json({ businesses: [], contacts: [] })
    }

    if (isDevMode) {
        const businesses = devStore.getBusinesses().filter(b =>
            b.name.toLowerCase().includes(query) ||
            b.city?.toLowerCase().includes(query) ||
            b.category?.toLowerCase().includes(query)
        ).slice(0, 5)

        const contacts = devStore.getContacts().filter(c =>
            `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query)
        ).slice(0, 5)

        return NextResponse.json({ businesses, contacts })
    }

    // Production mode
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [businessesRes, contactsRes] = await Promise.all([
        supabase
            .from('businesses')
            .select('id, name, city, province, category')
            .is('deleted_at', null)
            .or(`name.ilike.%${query}%,city.ilike.%${query}%,category.ilike.%${query}%`)
            .limit(5),
        supabase
            .from('contacts')
            .select('id, first_name, last_name, email, business_id')
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(5)
    ])

    return NextResponse.json({
        businesses: businessesRes.data || [],
        contacts: contactsRes.data || []
    })
}
