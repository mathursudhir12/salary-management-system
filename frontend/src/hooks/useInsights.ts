/**
 * React Query hook for GET /api/insights.
 *
 * Accepts an optional country filter.  When provided the backend also returns
 * countryInsights (min/max/avg/headcount) and avgSalaryByTitle (table of all
 * job titles in that country with their average salary).
 *
 * The query key includes the country so each country's data is cached
 * independently and refetched automatically when the selection changes.
 */
import { useQuery } from '@tanstack/react-query'
import { api }      from '@/lib/api'
import type { InsightsApiResponse } from '@/types/insights'

export function useInsights(country?: string) {
  return useQuery<InsightsApiResponse>({
    queryKey: ['insights', country ?? ''],
    queryFn:  async () => {
      const params: Record<string, string> = {}
      if (country) params.country = country
      const { data } = await api.get<InsightsApiResponse>('/api/insights', { params })
      return data
    },
  })
}
