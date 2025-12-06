import { NextResponse } from 'next/server'
import * as devStore from '@/lib/dev-store'
import { z } from 'zod'
import { isDevMode } from '@/lib/config'

export const dynamic = 'force-dynamic'

const tagSchema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

// GET /api/tags - Get all tags
export async function GET() {
    if (isDevMode) {
        return NextResponse.json(devStore.getTags())
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching tags:', error)
        return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    return NextResponse.json(data)
}

// POST /api/tags - Create a new tag
export async function POST(request: Request) {
    const body = await request.json()
    const result = tagSchema.safeParse(body)

    if (!result.success) {
        return NextResponse.json({
            error: 'Validation failed',
            details: result.error.flatten().fieldErrors
        }, { status: 400 })
    }

    if (isDevMode) {
        const tag = devStore.createTag(result.data)
        return NextResponse.json(tag, { status: 201 })
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('tags')
        .insert(result.data)
        .select()
        .single()

    if (error) {
        console.error('Error creating tag:', error)
        return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
}

// DELETE /api/tags?id=xxx - Delete a tag
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'Tag ID required' }, { status: 400 })
    }

    if (isDevMode) {
        const success = devStore.deleteTag(id)
        if (!success) {
            return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
        }
        return NextResponse.json({ success: true })
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting tag:', error)
        return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
