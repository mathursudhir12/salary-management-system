/**
 * EmployeeFormDialog — Create or edit an employee in a shadcn Dialog.
 *
 * Usage — create mode:
 *   <EmployeeFormDialog>
 *     <Button>+ Add Employee</Button>
 *   </EmployeeFormDialog>
 *
 * Usage — edit mode (employee prop provided):
 *   <EmployeeFormDialog employee={emp}>
 *     <Button variant="ghost" size="icon">✏️</Button>
 *   </EmployeeFormDialog>
 *
 * Behaviour:
 *  - Dialog is uncontrolled (manages its own open state).
 *  - Form is reset every time the dialog opens.
 *  - Client-side validation runs on submit; errors are shown below each field.
 *  - Calls useCreateEmployee or useUpdateEmployee accordingly.
 *  - Closes automatically after a successful mutation.
 *  - Selecting a country auto-fills the currency field.
 */
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { useCreateEmployee } from '@/hooks/useCreateEmployee'
import { useUpdateEmployee } from '@/hooks/useUpdateEmployee'
import type { Employee, EmployeeFormData } from '@/types/employee'

// ── Constants ─────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'India', 'USA', 'UK', 'Germany', 'France',
  'Canada', 'Australia', 'Brazil', 'Japan', 'Singapore',
] as const

const CURRENCY_MAP: Record<string, string> = {
  India: 'INR', USA: 'USD', UK: 'GBP', Germany: 'EUR',
  France: 'EUR', Canada: 'CAD', Australia: 'AUD',
  Brazil: 'BRL', Japan: 'JPY', Singapore: 'SGD',
}

const DEPARTMENTS = [
  'Engineering', 'Product', 'Data', 'Operations', 'HR',
  'Finance', 'Design', 'Marketing', 'Sales', 'Legal',
] as const

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT',  label: 'Contract'  },
] as const

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  fullName:       string
  jobTitle:       string
  department:     string
  country:        string
  salary:         string  // string so <input type="number"> stays controlled
  currency:       string
  employmentType: string
  joinDate:       string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const DEFAULT_FORM: FormState = {
  fullName:       '',
  jobTitle:       '',
  department:     DEPARTMENTS[0],
  country:        COUNTRIES[0],
  salary:         '',
  currency:       CURRENCY_MAP[COUNTRIES[0]],
  employmentType: 'FULL_TIME',
  joinDate:       '',
}

function employeeToForm(emp: Employee): FormState {
  return {
    fullName:       emp.fullName,
    jobTitle:       emp.jobTitle,
    department:     emp.department,
    country:        emp.country,
    salary:         String(emp.salary),
    currency:       emp.currency,
    employmentType: emp.employmentType,
    joinDate:       emp.joinDate,
  }
}

function validate(form: FormState): FormErrors {
  const errs: FormErrors = {}
  if (!form.fullName.trim())                    errs.fullName       = 'Full name is required'
  if (!form.jobTitle.trim())                    errs.jobTitle       = 'Job title is required'
  if (!form.department)                         errs.department     = 'Department is required'
  if (!form.country)                            errs.country        = 'Country is required'
  if (!form.salary || Number(form.salary) <= 0) errs.salary         = 'Salary must be greater than 0'
  if (!form.currency.trim())                    errs.currency       = 'Currency is required'
  if (!form.employmentType)                     errs.employmentType = 'Employment type is required'
  if (!form.joinDate)                           errs.joinDate       = 'Join date is required'
  return errs
}

// ── Shared select / input class ───────────────────────────────────────────────
const SELECT_CLS = [
  'flex h-10 w-full rounded-md border border-input bg-background',
  'px-3 py-2 text-sm ring-offset-background',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-ring focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ')

// ── Component ─────────────────────────────────────────────────────────────────

interface EmployeeFormDialogProps {
  employee?: Employee
  children:  React.ReactNode
}

export default function EmployeeFormDialog({ employee, children }: EmployeeFormDialogProps) {
  const [open, setOpen]     = useState(false)
  const [form, setForm]     = useState<FormState>(DEFAULT_FORM)
  const [errors, setErrors] = useState<FormErrors>({})

  const isEdit    = !!employee
  const create    = useCreateEmployee()
  const update    = useUpdateEmployee()
  const isPending = create.isPending || update.isPending

  // Reset the form every time the dialog opens (handles re-use across rows)
  useEffect(() => {
    if (open) {
      setForm(employee ? employeeToForm(employee) : { ...DEFAULT_FORM })
      setErrors({})
    }
  }, [open, employee])

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Auto-sync currency when country changes
      if (field === 'country') next.currency = CURRENCY_MAP[value] ?? prev.currency
      return next
    })
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const payload: EmployeeFormData = {
      fullName:       form.fullName.trim(),
      jobTitle:       form.jobTitle.trim(),
      department:     form.department,
      country:        form.country,
      salary:         Number(form.salary),
      currency:       form.currency.trim().toUpperCase(),
      employmentType: form.employmentType as EmployeeFormData['employmentType'],
      joinDate:       form.joinDate,
    }

    if (isEdit) {
      update.mutate(
        { id: employee.id, data: payload },
        { onSuccess: () => setOpen(false) },
      )
    } else {
      create.mutate(payload, { onSuccess: () => setOpen(false) })
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the employee's details below."
              : 'Fill in the details to create a new employee.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 py-4">

            {/* Full Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={e => setField('fullName', e.target.value)}
                placeholder="e.g. Jane Smith"
                disabled={isPending}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName}</p>
              )}
            </div>

            {/* Job Title */}
            <div className="grid gap-1.5">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={form.jobTitle}
                onChange={e => setField('jobTitle', e.target.value)}
                placeholder="e.g. Software Engineer"
                disabled={isPending}
              />
              {errors.jobTitle && (
                <p className="text-xs text-destructive">{errors.jobTitle}</p>
              )}
            </div>

            {/* Department + Country */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  value={form.department}
                  onChange={e => setField('department', e.target.value)}
                  className={SELECT_CLS}
                  disabled={isPending}
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-xs text-destructive">{errors.department}</p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  value={form.country}
                  onChange={e => setField('country', e.target.value)}
                  className={SELECT_CLS}
                  disabled={isPending}
                >
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.country && (
                  <p className="text-xs text-destructive">{errors.country}</p>
                )}
              </div>
            </div>

            {/* Salary + Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  min={1}
                  value={form.salary}
                  onChange={e => setField('salary', e.target.value)}
                  placeholder="e.g. 75000"
                  disabled={isPending}
                />
                {errors.salary && (
                  <p className="text-xs text-destructive">{errors.salary}</p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={form.currency}
                  onChange={e => setField('currency', e.target.value)}
                  placeholder="e.g. USD"
                  maxLength={3}
                  disabled={isPending}
                />
                {errors.currency && (
                  <p className="text-xs text-destructive">{errors.currency}</p>
                )}
              </div>
            </div>

            {/* Employment Type + Join Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="employmentType">Employment Type</Label>
                <select
                  id="employmentType"
                  value={form.employmentType}
                  onChange={e => setField('employmentType', e.target.value)}
                  className={SELECT_CLS}
                  disabled={isPending}
                >
                  {EMPLOYMENT_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.employmentType && (
                  <p className="text-xs text-destructive">{errors.employmentType}</p>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="joinDate">Join Date</Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={form.joinDate}
                  onChange={e => setField('joinDate', e.target.value)}
                  disabled={isPending}
                />
                {errors.joinDate && (
                  <p className="text-xs text-destructive">{errors.joinDate}</p>
                )}
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
