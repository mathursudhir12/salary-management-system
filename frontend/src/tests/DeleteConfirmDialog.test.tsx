/**
 * Tests for DeleteConfirmDialog — delete confirmation modal.
 *
 * TDD Red phase: imports a component that does not yet exist.
 *
 * Strategy:
 *  - Mock useDeleteEmployee so we never hit the network.
 *  - Verify the dialog shows the correct employee name.
 *  - Verify the delete mutation is called on confirm.
 *  - Verify the dialog closes on cancel.
 */
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
import type { Employee } from '@/types/employee'

// ── Mock mutation hook ────────────────────────────────────────────────────────

const mockDeleteMutate = vi.fn()

vi.mock('@/hooks/useDeleteEmployee', () => ({
  useDeleteEmployee: () => ({ mutate: mockDeleteMutate, isPending: false }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// ── Fixture ───────────────────────────────────────────────────────────────────

const mockEmployee: Employee = {
  id:             'emp-42',
  fullName:       'Charlie Brown',
  jobTitle:       'Data Analyst',
  country:        'UK',
  department:     'Data',
  salary:         55000,
  currency:       'GBP',
  employmentType: 'CONTRACT',
  joinDate:       '2021-06-01',
  createdAt:      '2021-06-01T00:00:00.000Z',
  updatedAt:      '2021-06-01T00:00:00.000Z',
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function openDialog() {
  // PointerEventsCheckLevel.Never — jsdom doesn't apply stylesheets so Radix
  // Dialog's pointer-events:none on <body> would falsely block interactions
  // with elements inside the dialog portal.
  const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never })
  render(
    <DeleteConfirmDialog employee={mockEmployee}>
      <button>Delete</button>
    </DeleteConfirmDialog>,
  )
  await user.click(screen.getByRole('button', { name: 'Delete' }))
  return user
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => vi.clearAllMocks())

describe('DeleteConfirmDialog', () => {
  it('renders the trigger element passed as children', () => {
    render(
      <DeleteConfirmDialog employee={mockEmployee}>
        <button>Delete</button>
      </DeleteConfirmDialog>,
    )
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('opens a confirmation dialog when the trigger is clicked', async () => {
    await openDialog()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows "Delete Employee" as the dialog title', async () => {
    await openDialog()
    expect(screen.getByText('Delete Employee')).toBeInTheDocument()
  })

  it("shows the employee's full name in the confirmation message", async () => {
    await openDialog()
    expect(screen.getByText(/charlie brown/i)).toBeInTheDocument()
  })

  it('calls deleteEmployee.mutate with the employee id when Delete is confirmed', async () => {
    await openDialog()
    // When the dialog is open Radix sets aria-hidden="true" on background content,
    // so the trigger button is excluded from ARIA queries. Scope to the dialog to
    // reliably get the confirm button, then use fireEvent (no pointer simulation).
    const confirmBtn = within(screen.getByRole('dialog')).getByRole('button', { name: /delete/i })
    fireEvent.click(confirmBtn)
    expect(mockDeleteMutate).toHaveBeenCalledWith('emp-42', expect.any(Object))
  })

  it('closes the dialog when Cancel is clicked', async () => {
    const user = await openDialog()
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes the dialog after a successful delete mutation', async () => {
    mockDeleteMutate.mockImplementation(
      (_id: unknown, opts: { onSuccess?: () => void }) => opts?.onSuccess?.(),
    )

    await openDialog()
    const confirmBtn = within(screen.getByRole('dialog')).getByRole('button', { name: /delete/i })
    fireEvent.click(confirmBtn)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
