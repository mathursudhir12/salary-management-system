/**
 * React Query mutation for POST /api/employees.
 *
 * On success: invalidates the ['employees'] query cache + shows a success toast.
 * On error:   shows an error toast with the server's error message if available.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Employee, EmployeeFormData } from '@/types/employee'

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation<Employee, Error, EmployeeFormData>({
    mutationFn: async (payload) => {
      const { data } = await api.post<{ data: Employee }>('/api/employees', payload)
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee created successfully')
    },
    onError: (err) => {
      toast.error(err.message ?? 'Failed to create employee')
    },
  })
}
