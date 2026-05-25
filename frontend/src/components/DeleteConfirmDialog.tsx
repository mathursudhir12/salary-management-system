/**
 * DeleteConfirmDialog — confirmation modal before deleting an employee.
 *
 * Usage:
 *   <DeleteConfirmDialog employee={emp}>
 *     <Button variant="ghost" size="icon" aria-label={`Delete ${emp.fullName}`}>
 *       <TrashIcon />
 *     </Button>
 *   </DeleteConfirmDialog>
 *
 * Behaviour:
 *  - Dialog is uncontrolled (manages its own open state).
 *  - Shows the employee's name so the HR manager can confirm the right person.
 *  - Calls useDeleteEmployee on confirm; closes automatically on success.
 *
 * Performance:
 *  - Component wrapped in memo.
 *  - handleConfirm and handleCancel wrapped in useCallback.
 *  - All data fetching goes through useDeleteEmployee — no axios calls here.
 */
import { useState, useCallback, memo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button }           from '@/components/ui/button'
import { useDeleteEmployee } from '@/hooks/useDeleteEmployee'
import type { Employee }    from '@/types/employee'

interface DeleteConfirmDialogProps {
  employee: Employee
  children: React.ReactNode
}

const DeleteConfirmDialog = memo(function DeleteConfirmDialog({
  employee,
  children,
}: DeleteConfirmDialogProps) {
  const [open, setOpen]           = useState(false)
  const { mutate, isPending }     = useDeleteEmployee()

  const handleConfirm = useCallback(() => {
    mutate(employee.id, { onSuccess: () => setOpen(false) })
  }, [mutate, employee.id])

  const handleCancel = useCallback(() => setOpen(false), [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Employee</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            <strong>{employee.fullName}</strong>?{' '}
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

export default DeleteConfirmDialog
