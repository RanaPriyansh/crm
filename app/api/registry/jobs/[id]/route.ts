import { NextResponse } from 'next/server'
import * as devStore from '@/lib/dev-store'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isDevMode = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseUrl.startsWith('https://')

// GET - Get job status and results
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

        // Get records for this job
        const records = devStore.getRegistryRecords(id)

        return NextResponse.json({
            ...job,
            records: records.slice(0, 100), // Limit for performance
            totalRecords: records.length,
        })
    }

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

// DELETE - Cancel/delete a job
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (isDevMode) {
        const job = devStore.getRegistryJobById(id)
        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        // For now, we just mark running jobs as failed
        if (job.status === 'running') {
            devStore.updateRegistryJob(id, { status: 'failed' })
            devStore.appendJobLog(id, 'Job cancelled by user')
        }

        return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
