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
 */
import { useState } from 'react'
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

export default function DeleteConfirmDialog({ employee, children }: DeleteConfirmDialogProps) {
  const [open, setOpen]    = useState(false)
  const { mutate, isPending } = useDeleteEmployee()

  function handleConfirm() {
    mutate(employee.id, { onSuccess: () => setOpen(false) })
  }

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
            onClick={() => setOpen(false)}
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
}
