import { NextResponse } from 'next/server'
import * as devStore from '@/lib/dev-store'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isDevMode = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseUrl.startsWith('https://')

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (isDevMode) {
        const list = devStore.getListById(id)
        if (!list) {
            return NextResponse.json({ error: 'List not found' }, { status: 404 })
        }
        return NextResponse.json(list)
    }

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const body = await request.json()

        if (isDevMode) {
            const list = devStore.updateList(id, {
                name: body.name?.trim(),
                description: body.description?.trim(),
                color: body.color,
            })
            if (!list) {
                return NextResponse.json({ error: 'List not found' }, { status: 404 })
            }
            return NextResponse.json(list)
        }

        return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (isDevMode) {
        const deleted = devStore.deleteList(id)
        if (!deleted) {
            return NextResponse.json({ error: 'List not found' }, { status: 404 })
        }
        return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
