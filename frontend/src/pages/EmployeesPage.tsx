/**
 * Employees list page.
 *
 * Features:
 *  - Fetch paginated employees from GET /api/employees via react-query
 *  - Search bar (debounced 300 ms) — filters by fullName or country on the backend
 *  - shadcn/ui Table with skeleton rows while loading
 *  - Ellipsis-style pagination (Previous / page numbers / Next)
 */

import { useState, useEffect } from 'react'
import { useEmployees }  from '@/hooks/useEmployees'
import { useDebounce }   from '@/hooks/useDebounce'
import { Button }        from '@/components/ui/button'
import { Input }         from '@/components/ui/input'
import { Badge }         from '@/components/ui/badge'
import { Skeleton }      from '@/components/ui/skeleton'
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

const PAGE_LIMIT = 20
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
    // Fallback for unexpected/unsupported currency codes
    return `${currency} ${amount.toLocaleString()}`
  }
}

/** Human-readable label + Tailwind classes for each employment type */
const EMPLOYMENT_TYPE_META: Record<
  string,
  { label: string; className: string }
> = {
  FULL_TIME: {
    label:     'Full Time',
    className: 'border-green-200  bg-green-50  text-green-800',
  },
  PART_TIME: {
    label:     'Part Time',
    className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  },
  CONTRACT: {
    label:     'Contract',
    className: 'border-blue-200   bg-blue-50   text-blue-800',
  },
}

/** Build the array of page numbers / ellipses to render in the pagination bar */
function buildPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '…')[] = [1]

  if (current > 3) pages.push('…')

  const windowStart = Math.max(2, current - 1)
  const windowEnd   = Math.min(total - 1, current + 1)
  for (let p = windowStart; p <= windowEnd; p++) pages.push(p)

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
      <TableCell className="text-muted-foreground">—</TableCell>
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
      {/* Info */}
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages.toLocaleString()}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page === 1}
          aria-label="Previous page"
        >
          ← Prev
        </Button>

        {/* Page numbers */}
        {pageRange.map((p, idx) =>
          p === '…' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 text-muted-foreground"
            >
              …
            </span>
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

        {/* Next */}
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

  // Debounce: wait 300 ms after the user stops typing before firing the query
  const debouncedSearch = useDebounce(searchInput, 300)

  // When the search term changes, jump back to page 1 so results start from top
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data, isLoading, isError, isFetching } = useEmployees({
    page,
    limit:  PAGE_LIMIT,
    search: debouncedSearch,
  })

  const employees  = data?.data       ?? []
  const total      = data?.total      ?? 0
  const totalPages = data?.totalPages ?? 0

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="container mx-auto px-4 py-8">

      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-foreground">Employees</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? 'Loading…'
            : `${total.toLocaleString()} employee${total !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* ── Search bar ── */}
      <div className="mb-4 max-w-sm">
        <label htmlFor="employee-search" className="sr-only">
          Search employees
        </label>
        <div className="relative">
          {/* Simple SVG magnifying-glass icon — no icon library needed */}
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
        <div
          className={
            isFetching && !isLoading ? 'opacity-60 transition-opacity' : ''
          }
        >
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
              {/* Loading skeleton */}
              {isLoading &&
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {/* Data rows */}
              {!isLoading &&
                employees.map((emp) => (
                  <EmployeeRow key={emp.id} emp={emp} />
                ))}

              {/* Empty state */}
              {!isLoading && employees.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-16 text-center text-muted-foreground"
                  >
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
