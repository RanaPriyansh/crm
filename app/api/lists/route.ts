import { NextResponse } from 'next/server'
import * as devStore from '@/lib/dev-store'

// Check dev mode
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isDevMode = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseUrl.startsWith('https://')

export async function GET() {
    if (isDevMode) {
        const lists = devStore.getLists()
        return NextResponse.json(lists)
    }

    // TODO: Supabase implementation
    return NextResponse.json([])
}

export async function POST(request: Request) {
    try {
        const body = await request.json()

        if (!body.name?.trim()) {
            return NextResponse.json({ error: 'List name is required' }, { status: 400 })
        }

        if (isDevMode) {
            const list = devStore.createList({
                name: body.name.trim(),
                description: body.description?.trim(),
                color: body.color,
            })
            return NextResponse.json(list, { status: 201 })
        }

        // TODO: Supabase implementation
        return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
}
