/**
 * React Query mutation for PUT /api/employees/:id.
 *
 * On success: invalidates the ['employees'] query cache + shows a success toast.
 * On error:   shows an error toast.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Employee, EmployeeFormData } from '@/types/employee'

interface UpdatePayload {
  id:   string
  data: Partial<EmployeeFormData>
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation<Employee, Error, UpdatePayload>({
    mutationFn: async ({ id, data }) => {
      const { data: res } = await api.put<{ data: Employee }>(`/api/employees/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee updated successfully')
    },
    onError: (err) => {
      toast.error(err.message ?? 'Failed to update employee')
    },
  })
}
