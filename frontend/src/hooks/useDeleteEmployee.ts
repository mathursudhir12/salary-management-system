/**
 * React Query mutation for DELETE /api/employees/:id.
 *
 * On success: invalidates the ['employees'] query cache + shows a success toast.
 * On error:   shows an error toast.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'

export function useDeleteEmployee() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/api/employees/${id}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee deleted successfully')
    },
    onError: (err) => {
      toast.error(err.message ?? 'Failed to delete employee')
    },
  })
}
