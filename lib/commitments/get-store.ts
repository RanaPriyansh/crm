import { createClient } from '@/lib/supabase/server'
import { isDevMode } from '@/lib/config'
import { createDevStore } from './store-dev'
import { createSupabaseStore } from './store-supabase'
import type { CommitmentStore } from './types'

export async function getCommitmentStore(): Promise<CommitmentStore> {
    if (isDevMode) return createDevStore()
    const supabase = await createClient()
    return createSupabaseStore(supabase)
}

export async function currentActor(): Promise<string> {
    if (isDevMode) return 'dev-user'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.email || user?.id || 'unknown'
}
