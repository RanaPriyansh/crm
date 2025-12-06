import { parseFiltersFromSearchParams, BUSINESS_PAGE_SIZE } from '@/lib/businesses/filters'
import { fetchBusinessesFromServer } from './actions'
import { BusinessesClient } from './BusinessesClient'

interface BusinessesPageProps {
    searchParams: Record<string, string | string[] | undefined>
}

export default async function BusinessesPage({ searchParams }: BusinessesPageProps) {
    const { filters, page } = parseFiltersFromSearchParams(searchParams)

    const initialData = await fetchBusinessesFromServer({
        filters,
        page,
        pageSize: BUSINESS_PAGE_SIZE,
    })

    return (
        <BusinessesClient
            initialFilters={filters}
            initialPage={page}
            initialData={initialData}
        />
    )
}
