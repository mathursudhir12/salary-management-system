/**
 * Tests for EmployeeFormDialog — create & edit modal.
 *
 * TDD Red phase: all tests import a component that does not yet exist.
 *
 * Strategy:
 *  - Mock useCreateEmployee and useUpdateEmployee so we never hit the network.
 *  - Use @testing-library/user-event to simulate real user interactions.
 *  - Radix Dialog renders into a portal inside document.body — screen queries
 *    still find it because RTL searches the whole document.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmployeeFormDialog from '@/components/EmployeeFormDialog'
import type { Employee } from '@/types/employee'

// ── Mock mutation hooks ────────────────────────────────────────────────────────

const mockCreateMutate = vi.fn()
const mockUpdateMutate = vi.fn()

vi.mock('@/hooks/useCreateEmployee', () => ({
  useCreateEmployee: () => ({ mutate: mockCreateMutate, isPending: false }),
}))

vi.mock('@/hooks/useUpdateEmployee', () => ({
  useUpdateEmployee: () => ({ mutate: mockUpdateMutate, isPending: false }),
}))

// sonner is called inside the hooks (which are mocked), but mock it anyway
// so any accidental direct call in the component doesn't blow up
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockEmployee: Employee = {
  id:             'emp-1',
  fullName:       'Alice Smith',
  jobTitle:       'Senior Engineer',
  country:        'USA',
  department:     'Engineering',
  salary:         100000,
  currency:       'USD',
  employmentType: 'FULL_TIME',
  joinDate:       '2022-01-01',
  createdAt:      '2022-01-01T00:00:00.000Z',
  updatedAt:      '2022-01-01T00:00:00.000Z',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Open the dialog by clicking the trigger button labelled `triggerLabel`. */
async function openDialog(
  ui: React.ReactElement,
  triggerLabel = 'Open',
) {
  const user = userEvent.setup()
  render(ui)
  await user.click(screen.getByRole('button', { name: triggerLabel }))
  return user
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => vi.clearAllMocks())

describe('EmployeeFormDialog', () => {
  // ── Trigger rendering ────────────────────────────────────────────────────────

  it('renders the trigger element passed as children', () => {
    render(
      <EmployeeFormDialog>
        <button>Add Employee</button>
      </EmployeeFormDialog>,
    )
    expect(screen.getByRole('button', { name: 'Add Employee' })).toBeInTheDocument()
  })

  // ── Dialog open / close ───────────────────────────────────────────────────────

  it('opens the form dialog when the trigger is clicked', async () => {
    await openDialog(
      <EmployeeFormDialog><button>Open</button></EmployeeFormDialog>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows "Add Employee" as the dialog title in create mode', async () => {
    await openDialog(
      <EmployeeFormDialog><button>Open</button></EmployeeFormDialog>,
    )
    expect(screen.getByText('Add Employee')).toBeInTheDocument()
  })

  it('closes the dialog when Cancel is clicked', async () => {
    const user = await openDialog(
      <EmployeeFormDialog><button>Open</button></EmployeeFormDialog>,
    )
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // ── Form fields ───────────────────────────────────────────────────────────────

  it('renders all required form fields', async () => {
    await openDialog(
      <EmployeeFormDialog><button>Open</button></EmployeeFormDialog>,
    )
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/department/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/salary/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/employment type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/join date/i)).toBeInTheDocument()
  })

  // ── Client-side validation ────────────────────────────────────────────────────

  it('shows a validation error for Full Name when the form is submitted empty', async () => {
    const user = await openDialog(
      <EmployeeFormDialog><button>Open</button></EmployeeFormDialog>,
    )
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
  })

  it('shows a validation error for Salary when it is zero', async () => {
    const user = await openDialog(
      <EmployeeFormDialog><button>Open</button></EmployeeFormDialog>,
    )
    // fullName present, salary left empty / zero
    await user.type(screen.getByLabelText(/full name/i), 'Bob Jones')
    await user.type(screen.getByLabelText(/job title/i), 'Engineer')
    // leave salary empty
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(screen.getByText(/salary must be greater than 0/i)).toBeInTheDocument()
  })

  it('shows a validation error for Join Date when it is blank', async () => {
    const user = await openDialog(
      <EmployeeFormDialog><button>Open</button></EmployeeFormDialog>,
    )
    await user.type(screen.getByLabelText(/full name/i), 'Bob Jones')
    await user.type(screen.getByLabelText(/job title/i), 'Engineer')
    await user.type(screen.getByLabelText(/salary/i), '50000')
    // leave joinDate empty
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(screen.getByText(/join date is required/i)).toBeInTheDocument()
  })

  // ── Edit mode ─────────────────────────────────────────────────────────────────

  it('shows "Edit Employee" as the dialog title when an employee prop is provided', async () => {
    await openDialog(
      <EmployeeFormDialog employee={mockEmployee}><button>Open</button></EmployeeFormDialog>,
    )
    expect(screen.getByText('Edit Employee')).toBeInTheDocument()
  })

  it('pre-fills all form fields with the employee data in edit mode', async () => {
    await openDialog(
      <EmployeeFormDialog employee={mockEmployee}><button>Open</button></EmployeeFormDialog>,
    )
    expect(screen.getByDisplayValue('Alice Smith')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Senior Engineer')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2022-01-01')).toBeInTheDocument()
  })

  // ── Mutation calls ────────────────────────────────────────────────────────────

  it('calls createEmployee.mutate with form data on submit in create mode', async () => {
    const user = await openDialog(
      <EmployeeFormDialog><button>Open</button></EmployeeFormDialog>,
    )

    await user.type(screen.getByLabelText(/full name/i), 'Bob Jones')
    await user.type(screen.getByLabelText(/job title/i), 'Engineer')
    // department + country + employmentType have defaults → no selection needed
    await user.type(screen.getByLabelText(/salary/i), '75000')
    // joinDate — use fireEvent.change because userEvent.type on date inputs
    // types character-by-character which doesn't match date input format in jsdom
    fireEvent.change(screen.getByLabelText(/join date/i), { target: { value: '2023-01-15' } })

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Bob Jones',
        jobTitle: 'Engineer',
        salary:   75000,
        joinDate: '2023-01-15',
      }),
      expect.any(Object),
    )
  })

  it('calls updateEmployee.mutate with {id, data} on submit in edit mode', async () => {
    const user = await openDialog(
      <EmployeeFormDialog employee={mockEmployee}><button>Open</button></EmployeeFormDialog>,
    )

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id:   'emp-1',
        data: expect.objectContaining({ fullName: 'Alice Smith' }),
      }),
      expect.any(Object),
    )
  })

  it('closes the dialog after a successful create mutation', async () => {
    mockCreateMutate.mockImplementation(
      (_data: unknown, opts: { onSuccess?: () => void }) => opts?.onSuccess?.(),
    )

    const user = await openDialog(
      <EmployeeFormDialog><button>Open</button></EmployeeFormDialog>,
    )

    await user.type(screen.getByLabelText(/full name/i), 'Bob Jones')
    await user.type(screen.getByLabelText(/job title/i), 'Engineer')
    await user.type(screen.getByLabelText(/salary/i), '75000')
    fireEvent.change(screen.getByLabelText(/join date/i), { target: { value: '2023-01-15' } })

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
