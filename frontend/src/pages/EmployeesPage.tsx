/**
 * Employees list page.
 *
 * Features:
 *  - Fetch paginated employees from GET /api/employees via react-query
 *  - Search bar (debounced 300 ms) — filters by fullName or country on the backend
 *  - shadcn/ui Table with skeleton rows while loading
 *  - Ellipsis-style pagination (Previous / page numbers / Next)
 *  - Add Employee button → EmployeeFormDialog (create mode)
 *  - Edit icon per row  → EmployeeFormDialog (edit mode, pre-filled)
 *  - Delete icon per row → DeleteConfirmDialog (confirmation before delete)
 */

import { useState, useEffect } from 'react'
import { useEmployees }          from '@/hooks/useEmployees'
import { useDebounce }           from '@/hooks/useDebounce'
import { Button }                from '@/components/ui/button'
import { Input }                 from '@/components/ui/input'
import { Badge }                 from '@/components/ui/badge'
import { Skeleton }              from '@/components/ui/skeleton'
import EmployeeFormDialog        from '@/components/EmployeeFormDialog'
import DeleteConfirmDialog       from '@/components/DeleteConfirmDialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import type { Employee } from '@/types/employee'

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_LIMIT    = 20
const SKELETON_ROWS = 8

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format a salary number (or string from Postgres) with its ISO currency code */
function formatSalary(raw: number | string, currency: string): string {
  const amount = Number(raw)
  try {
    return new Intl.NumberFormat('en-US', {
      style:                 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

/** Human-readable label + Tailwind classes for each employment type */
const EMPLOYMENT_TYPE_META: Record<string, { label: string; className: string }> = {
  FULL_TIME: { label: 'Full Time', className: 'border-green-200  bg-green-50  text-green-800' },
  PART_TIME: { label: 'Part Time', className: 'border-yellow-200 bg-yellow-50 text-yellow-800' },
  CONTRACT:  { label: 'Contract',  className: 'border-blue-200   bg-blue-50   text-blue-800'  },
}

/** Build the array of page numbers / ellipses to render in the pagination bar */
function buildPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')

  const start = Math.max(2, current - 1)
  const end   = Math.min(total - 1, current + 1)
  for (let p = start; p <= end; p++) pages.push(p)

  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Single table row rendered from live data */
function EmployeeRow({ emp }: { emp: Employee }) {
  const meta = EMPLOYMENT_TYPE_META[emp.employmentType] ?? {
    label:     emp.employmentType,
    className: '',
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{emp.fullName}</TableCell>
      <TableCell className="text-muted-foreground">{emp.jobTitle}</TableCell>
      <TableCell>{emp.department}</TableCell>
      <TableCell>{emp.country}</TableCell>
      <TableCell className="font-mono text-right">
        {formatSalary(emp.salary, emp.currency)}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={meta.className}>
          {meta.label}
        </Badge>
      </TableCell>

      {/* Actions — edit + delete */}
      <TableCell>
        <div className="flex items-center gap-1">
          {/* Edit */}
          <EmployeeFormDialog employee={emp}>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${emp.fullName}`}
              title="Edit employee"
            >
              {/* Pencil icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </Button>
          </EmployeeFormDialog>

          {/* Delete */}
          <DeleteConfirmDialog employee={emp}>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${emp.fullName}`}
              title="Delete employee"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {/* Trash icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </Button>
          </DeleteConfirmDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}

/** Skeleton placeholder row shown while data loads */
function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  )
}

/** Pagination bar with Previous / numbered pages / Next */
function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled,
}: {
  page:         number
  totalPages:   number
  onPageChange: (p: number) => void
  disabled:     boolean
}) {
  if (totalPages <= 1) return null

  const pageRange = buildPageRange(page, totalPages)

  return (
    <div className="flex items-center justify-between gap-2 pt-4">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages.toLocaleString()}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page === 1}
          aria-label="Previous page"
        >
          ← Prev
        </Button>

        {pageRange.map((p, idx) =>
          p === '…' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">…</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onPageChange(p)}
              disabled={disabled}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page === totalPages}
          aria-label="Next page"
        >
          Next →
        </Button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [page, setPage]               = useState(1)
  const [searchInput, setSearchInput] = useState('')

  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const { data, isLoading, isError, isFetching } = useEmployees({
    page,
    limit:  PAGE_LIMIT,
    search: debouncedSearch,
  })

  const employees  = data?.data       ?? []
  const total      = data?.total      ?? 0
  const totalPages = data?.totalPages ?? 0

  return (
    <main className="container mx-auto px-4 py-8">

      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Loading…'
              : `${total.toLocaleString()} employee${total !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Add Employee button */}
        <EmployeeFormDialog>
          <Button className="shrink-0">
            {/* Plus icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5"  x2="12" y2="19" />
              <line x1="5"  y1="12" x2="19" y2="12" />
            </svg>
            Add Employee
          </Button>
        </EmployeeFormDialog>
      </div>

      {/* ── Search bar ── */}
      <div className="mb-4 max-w-sm">
        <label htmlFor="employee-search" className="sr-only">Search employees</label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input
            id="employee-search"
            type="search"
            placeholder="Search by name or country…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* ── Error state ── */}
      {isError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load employees. Make sure the backend is running on port 5000.
        </div>
      )}

      {/* ── Table ── */}
      {!isError && (
        <div className={isFetching && !isLoading ? 'opacity-60 transition-opacity' : ''}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Salary</TableHead>
                <TableHead>Employment Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading &&
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {!isLoading &&
                employees.map((emp) => (
                  <EmployeeRow key={emp.id} emp={emp} />
                ))}

              {!isLoading && employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                    {debouncedSearch
                      ? `No employees match "${debouncedSearch}".`
                      : 'No employees found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Pagination ── */}
      {!isLoading && !isError && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={isFetching}
        />
      )}
    </main>
  )
}
