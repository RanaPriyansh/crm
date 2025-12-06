import { Business } from '@/lib/types'

export interface PaginatedResponse {
    data: Business[]
    count: number
    page: number
    pageSize: number
    totalPages: number
}
