import { NextResponse } from 'next/server'
import * as devStore from '@/lib/dev-store'
import { isDevMode } from '@/lib/config'

export const dynamic = 'force-dynamic'

// GET /api/businesses/[id]/tags - Get tags for a business
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (isDevMode) {
        return NextResponse.json(devStore.getBusinessTags(id))
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('business_tags')
        .select('tags(*)')
        .eq('business_id', id)

    if (error) {
        console.error('Error fetching business tags:', error)
        return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    // Extract tags from the join result
    const tags = data?.map(bt => bt.tags).filter(Boolean) || []
    return NextResponse.json(tags)
}

// POST /api/businesses/[id]/tags - Add a tag to a business
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: businessId } = await params
    const { tagId } = await request.json()

    if (!tagId) {
        return NextResponse.json({ error: 'Tag ID required' }, { status: 400 })
    }

    if (isDevMode) {
        const result = devStore.addTagToBusiness(businessId, tagId)
        if (!result) {
            return NextResponse.json({ error: 'Tag already assigned' }, { status: 409 })
        }
        return NextResponse.json(result, { status: 201 })
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('business_tags')
        .insert({ business_id: businessId, tag_id: tagId })
        .select()
        .single()

    if (error) {
        if (error.code === '23505') { // unique constraint violation
            return NextResponse.json({ error: 'Tag already assigned' }, { status: 409 })
        }
        console.error('Error adding tag:', error)
        return NextResponse.json({ error: 'Failed to add tag' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
}

// DELETE /api/businesses/[id]/tags?tagId=xxx - Remove a tag from a business
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: businessId } = await params
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('tagId')

    if (!tagId) {
        return NextResponse.json({ error: 'Tag ID required' }, { status: 400 })
    }

    if (isDevMode) {
        const success = devStore.removeTagFromBusiness(businessId, tagId)
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
        .from('business_tags')
        .delete()
        .eq('business_id', businessId)
        .eq('tag_id', tagId)

    if (error) {
        console.error('Error removing tag:', error)
        return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
