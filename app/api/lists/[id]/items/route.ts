import { NextResponse } from 'next/server'
import * as devStore from '@/lib/dev-store'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isDevMode = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseUrl.startsWith('https://')

// POST - Add item(s) to list (supports bulk)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: listId } = await params

    try {
        const body = await request.json()
        const { itemIds, itemType } = body

        if (!itemType || !['business', 'contact'].includes(itemType)) {
            return NextResponse.json({ error: 'Invalid item type' }, { status: 400 })
        }

        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return NextResponse.json({ error: 'itemIds array is required' }, { status: 400 })
        }

        if (isDevMode) {
            // Check list exists
            const list = devStore.getListById(listId)
            if (!list) {
                return NextResponse.json({ error: 'List not found' }, { status: 404 })
            }

            const added = devStore.addMultipleToList(listId, itemIds, itemType)
            return NextResponse.json({ added, total: itemIds.length })
        }

        return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
}

// DELETE - Remove item from list
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: listId } = await params

    try {
        const { searchParams } = new URL(request.url)
        const itemId = searchParams.get('itemId')

        if (!itemId) {
            return NextResponse.json({ error: 'itemId query param is required' }, { status: 400 })
        }

        if (isDevMode) {
            const removed = devStore.removeFromList(listId, itemId)
            if (!removed) {
                return NextResponse.json({ error: 'Item not found in list' }, { status: 404 })
            }
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
    } catch {
        return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
    }
}
