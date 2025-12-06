import { NextResponse } from 'next/server'
import * as devStore from '@/lib/dev-store'
import { importRecords } from '@/lib/registry/processor'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isDevMode = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseUrl.startsWith('https://')

// POST - Import selected records to businesses
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: jobId } = await params

    try {
        const body = await request.json()
        const { recordIds } = body

        if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
            return NextResponse.json(
                { error: 'recordIds array is required' },
                { status: 400 }
            )
        }

        if (isDevMode) {
            const job = devStore.getRegistryJobById(jobId)
            if (!job) {
                return NextResponse.json({ error: 'Job not found' }, { status: 404 })
            }

            if (job.status !== 'completed') {
                return NextResponse.json(
                    { error: 'Can only import from completed jobs' },
                    { status: 400 }
                )
            }

            const imported = importRecords(jobId, recordIds)

            return NextResponse.json({
                imported,
                total: recordIds.length,
            })
        }

        return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
}
