/**
 * React Query hook for fetching a paginated + searchable employee list.
 *
 * Query key includes page, limit, and search so that React Query caches each
 * combination independently and refetches automatically when any value changes.
 *
 * placeholderData keeps the previous page's rows visible while the next page
 * loads — this prevents the table from flashing blank between page changes.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PaginatedEmployees, EmployeeQueryParams } from '@/types/employee'

export function useEmployees({ page, limit, search }: EmployeeQueryParams) {
  return useQuery<PaginatedEmployees>({
    queryKey: ['employees', page, limit, search ?? ''],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit }
      if (search?.trim()) params.search = search.trim()
      const { data } = await api.get<PaginatedEmployees>('/api/employees', { params })
      return data
    },
    placeholderData: keepPreviousData,
  })
}
