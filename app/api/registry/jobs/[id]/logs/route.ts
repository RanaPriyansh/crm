import { NextResponse } from 'next/server'
import * as devStore from '@/lib/dev-store'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isDevMode = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseUrl.startsWith('https://')

// GET - Stream job logs
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (isDevMode) {
        const job = devStore.getRegistryJobById(id)
        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        return NextResponse.json({
            logs: job.logs,
            status: job.status,
            stats: job.stats,
        })
    }

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
