'use client'

import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BUSINESS_PAGE_SIZE, FilterState, filtersToSearchParams } from '@/lib/businesses/filters'
import { PaginatedResponse } from '@/lib/businesses/types'
import { Business } from '@/lib/types'

interface QueryOptions {
    filters: FilterState
    page: number
    initialData?: PaginatedResponse
}

interface QuickAddInput {
    name: string
    province: string
    city?: string | null
    phone_raw?: string | null
    category?: string | null
}

const QUERY_KEY = 'businesses'

function buildQueryKey(filters: FilterState, page: number) {
    return [QUERY_KEY, { filters, page, pageSize: BUSINESS_PAGE_SIZE }]
}

function buildQueryString(filters: FilterState, page: number) {
    const params = filtersToSearchParams(filters, page)
    params.set('pageSize', BUSINESS_PAGE_SIZE.toString())
    return params.toString()
}

async function fetchBusinesses(filters: FilterState, page: number): Promise<PaginatedResponse> {
    const queryString = buildQueryString(filters, page)
    const res = await fetch(`/api/businesses?${queryString}`, { cache: 'no-store' })
    if (!res.ok) {
        throw new Error('Failed to fetch businesses')
    }
    return res.json()
}

export function useBusinessesQuery({ filters, page, initialData }: QueryOptions) {
    const queryClient = useQueryClient()

    const queryKey = useMemo(() => buildQueryKey(filters, page), [filters, page])

    const query = useQuery({
        queryKey,
        queryFn: () => fetchBusinesses(filters, page),
        initialData,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/businesses/${id}`, { method: 'DELETE' })
            if (!res.ok) {
                throw new Error('Failed to delete business')
            }
            return id
        },
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey })
            const previous = queryClient.getQueryData<PaginatedResponse>(queryKey)

            if (previous) {
                const updatedData = previous.data.filter(b => b.id !== id)
                const newCount = Math.max(0, previous.count - 1)
                const newTotalPages = Math.ceil(newCount / BUSINESS_PAGE_SIZE)

                queryClient.setQueryData<PaginatedResponse>(queryKey, {
                    ...previous,
                    data: updatedData,
                    count: newCount,
                    totalPages: newTotalPages,
                })
            }

            return { previous }
        },
        onError: (_error, _id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKey, context.previous)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })

    const quickAddMutation = useMutation({
        mutationFn: async (payload: QuickAddInput) => {
            const res = await fetch('/api/businesses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || 'Failed to create business')
            }

            return res.json() as Promise<Business>
        },
        onSuccess: (business) => {
            const existing = queryClient.getQueryData<PaginatedResponse>(queryKey)
            if (!existing) return

            const nextData = existing.page === 1
                ? [business, ...existing.data].slice(0, BUSINESS_PAGE_SIZE)
                : existing.data

            const updatedCount = existing.count + 1

            queryClient.setQueryData<PaginatedResponse>(queryKey, {
                ...existing,
                data: nextData,
                count: updatedCount,
                totalPages: Math.ceil(updatedCount / BUSINESS_PAGE_SIZE),
            })
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })

    return {
        query,
        deleteBusiness: deleteMutation,
        quickAdd: quickAddMutation,
        queryKey,
    }
}
