import { NextResponse } from 'next/server'
import * as devStore from '@/lib/dev-store'
import { processRegistryJob } from '@/lib/registry/processor'
import type { RegistrySource, RegistryJobMode } from '@/lib/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isDevMode = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseUrl.startsWith('https://')

const VALID_SOURCES: RegistrySource[] = ['ns_registry', 'nb_registry', 'pei_registry', 'nl_registry', 'opencorporates', 'statscan']
const VALID_MODES: RegistryJobMode[] = ['full_refresh', 'incremental']

// GET - List all registry jobs
export async function GET() {
    if (isDevMode) {
        const jobs = devStore.getRegistryJobs()
        // Sort by created_at descending
        jobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        return NextResponse.json(jobs)
    }

    return NextResponse.json([])
}

// POST - Create and start a new registry job
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { source, mode = 'full_refresh', query, csvData } = body

        // Validate source
        if (!source || !VALID_SOURCES.includes(source)) {
            return NextResponse.json(
                { error: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}` },
                { status: 400 }
            )
        }

        // Validate mode
        if (!VALID_MODES.includes(mode)) {
            return NextResponse.json(
                { error: `Invalid mode. Must be one of: ${VALID_MODES.join(', ')}` },
                { status: 400 }
            )
        }

        // For CSV sources, require csvData
        if (['nb_registry', 'pei_registry', 'nl_registry'].includes(source) && !csvData) {
            return NextResponse.json(
                { error: 'CSV data required for file-based sources. Upload a file.' },
                { status: 400 }
            )
        }

        if (isDevMode) {
            // Create the job
            const job = devStore.createRegistryJob({ source, mode, query })

            // Fire and forget - start processing async
            // Don't await - return immediately
            processRegistryJob(job.id, { query, csvData }).catch(err => {
                console.error('Background job error:', err)
            })

            // Return 202 Accepted with job ID
            return NextResponse.json(job, { status: 202 })
        }

        return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
}
