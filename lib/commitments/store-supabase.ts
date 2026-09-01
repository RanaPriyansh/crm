import type { SupabaseClient } from '@supabase/supabase-js'
import { CommitmentError, type Commitment, type CommitmentStore } from './types'

export function createSupabaseStore(supabase: SupabaseClient): CommitmentStore {
    return {
        async insert(commitment) {
            const { error } = await supabase.from('commitments').insert(commitment)
            if (error) throw new Error(error.message)
        },
        async get(id) {
            const { data, error } = await supabase
                .from('commitments')
                .select('*')
                .eq('id', id)
                .maybeSingle()
            if (error) throw new Error(error.message)
            return (data as Commitment | null) ?? null
        },
        async update(commitment) {
            const { error } = await supabase
                .from('commitments')
                .update({
                    status: commitment.status,
                    human_ok_at: commitment.human_ok_at,
                    human_ok_by: commitment.human_ok_by,
                    updated_at: commitment.updated_at,
                })
                .eq('id', commitment.id)
            if (error) throw new Error(error.message)
        },
        async list() {
            const { data, error } = await supabase
                .from('commitments')
                .select('*')
                .order('ship_window_from', { ascending: true })
            if (error) throw new Error(error.message)
            return (data as Commitment[]) || []
        },
        async appendAudit(entry) {
            const { error } = await supabase.from('commitment_audit').insert(entry)
            if (error) throw new Error(error.message)
        },
        async listAudit(commitmentId) {
            const { data, error } = await supabase
                .from('commitment_audit')
                .select('*')
                .eq('commitment_id', commitmentId)
                .order('at', { ascending: true })
            if (error) throw new Error(error.message)
            return data || []
        },
        async businessExists(id) {
            const { data, error } = await supabase
                .from('businesses')
                .select('id')
                .eq('id', id)
                .is('deleted_at', null)
                .maybeSingle()
            if (error) throw new Error(error.message)
            return Boolean(data)
        },
    }
}

export function rethrowStore(error: unknown): never {
    if (error instanceof CommitmentError) throw error
    throw error
}
