/**
 * InsightsPage — salary analytics dashboard.
 *
 * Layout:
 *  1. Header + Country filter dropdown
 *     (countries sourced dynamically from headcountByCountry)
 *
 *  2. Stat cards  ← only when a country is selected
 *     Min Salary · Max Salary · Avg Salary · Headcount
 *
 *  3. "Average Salary by Job Title" table  ← only when a country is selected
 *
 *  4. "Top 5 Highest Paid Job Titles" table  ← always
 *
 *  5. "Salary Distribution by Department" table  ← always
 *
 * Data source: GET /api/insights  (via useInsights react-query hook)
 * Salary values are raw numbers — aggregates across multiple currencies, so
 * we display plain comma-formatted numbers without a currency symbol.
 *
 * Performance:
 *  - All sub-components wrapped in memo.
 *  - Event handlers stabilised with useCallback.
 *  - All 5 derived insight values memoised with useMemo.
 *  - All data fetching goes through useInsights — no axios calls in this file.
 */

import { useState, useCallback, useMemo, memo } from 'react'
import { useInsights } from '@/hooks/useInsights'
import { Skeleton }    from '@/components/ui/skeleton'
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Comma-separated integer — no currency symbol (values mix currencies) */
function fmt(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** One metric card used in the 4-up country stats row */
const StatCard = memo(function StatCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
})

/**
 * Reusable two-column table: label | formatted salary.
 * Generic so TypeScript can narrow the row type without unsafe casts.
 *
 * React.memo is applied via the two-step pattern required for generic
 * components: define the inner function first, then wrap with memo and
 * cast back to preserve the type parameter.
 */
function SalaryTableInner<T extends { avgSalary: number }>({
  rows,
  labelHeader,
  getLabel,
}: {
  rows:        T[]
  labelHeader: string
  getLabel:    (row: T) => string
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{labelHeader}</TableHead>
          <TableHead className="text-right">Avg Salary</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={getLabel(row)}>
            <TableCell>{getLabel(row)}</TableCell>
            <TableCell className="text-right font-mono">
              {fmt(row.avgSalary)}
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
              No data available.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
// Cast back to the generic signature so call sites retain full type-checking
const SalaryTable = memo(SalaryTableInner) as typeof SalaryTableInner

/** Skeleton placeholder shown while the API call is in flight */
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading">
      <p className="text-sm text-muted-foreground">Loading…</p>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  )
})

// Shared select styling (matches shadcn Input)
const SELECT_CLS = [
  'flex h-10 rounded-md border border-input bg-background',
  'px-3 py-2 text-sm ring-offset-background',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-ring focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'min-w-[200px]',
].join(' ')

// ── Page ──────────────────────────────────────────────────────────────────────

const InsightsPage = memo(function InsightsPage() {
  const [country, setCountry] = useState('')

  // All data fetching via the custom hook — no axios calls here
  const { data, isLoading, isError } = useInsights(country || undefined)

  // ── Derived data (memoised) ─────────────────────────────────────────────────
  const insights = useMemo(() => data?.data, [data])

  const countries = useMemo(
    () => insights?.headcountByCountry.map(h => h.country) ?? [],
    [insights],
  )
  const topPaidJobTitles = useMemo(
    () => insights?.topPaidJobTitles   ?? [],
    [insights],
  )
  const salaryByDept = useMemo(
    () => insights?.salaryByDepartment ?? [],
    [insights],
  )
  const countryInsights = useMemo(
    () => insights?.countryInsights,
    [insights],
  )
  const avgSalaryByTitle = useMemo(
    () => insights?.avgSalaryByTitle ?? [],
    [insights],
  )

  // ── Stable handlers ─────────────────────────────────────────────────────────
  const handleCountryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => setCountry(e.target.value),
    [],
  )
  const handleClearCountry = useCallback(() => setCountry(''), [])

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Salary analytics across your organisation
        </p>
      </div>

      {/* ── Country filter ── */}
      <div className="flex items-center gap-3">
        <label htmlFor="country-filter" className="text-sm font-medium whitespace-nowrap">
          Filter by Country
        </label>
        <select
          id="country-filter"
          value={country}
          onChange={handleCountryChange}
          className={SELECT_CLS}
          disabled={isLoading}
        >
          <option value="">All Countries</option>
          {countries.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {country && (
          <button
            type="button"
            onClick={handleClearCountry}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Loading ── */}
      {isLoading && <LoadingSkeleton />}

      {/* ── Error ── */}
      {isError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load insights. Make sure the backend is running on port 5000.
        </div>
      )}

      {/* ── Content ── */}
      {!isLoading && !isError && (
        <div className="space-y-8">

          {/* ── Country stat cards (only when a country is selected) ── */}
          {countryInsights && (
            <section aria-label={`Statistics for ${country}`}>
              <h2 className="mb-4 text-xl font-semibold">
                Statistics for {country}
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Min Salary"  value={fmt(countryInsights.min)}       />
                <StatCard label="Max Salary"  value={fmt(countryInsights.max)}       />
                <StatCard label="Avg Salary"  value={fmt(countryInsights.avg)}       />
                <StatCard label="Headcount"   value={countryInsights.headcount.toLocaleString()} />
              </div>
            </section>
          )}

          {/* ── Avg salary by job title for selected country ── */}
          {country && avgSalaryByTitle.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">
                Average Salary by Job Title — {country}
              </h2>
              <div className="rounded-md border">
                <SalaryTable
                  rows={avgSalaryByTitle}
                  labelHeader="Job Title"
                  getLabel={(r) => r.jobTitle}
                />
              </div>
            </section>
          )}

          {/* ── Top 5 highest paid job titles (global) ── */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">
              Top 5 Highest Paid Job Titles
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (global average)
              </span>
            </h2>
            <div className="rounded-md border">
              <SalaryTable
                rows={topPaidJobTitles}
                labelHeader="Job Title"
                getLabel={(r) => r.jobTitle}
              />
            </div>
          </section>

          {/* ── Salary distribution by department ── */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">
              Salary Distribution by Department
            </h2>
            <div className="rounded-md border">
              <SalaryTable
                rows={salaryByDept}
                labelHeader="Department"
                getLabel={(r) => r.department}
              />
            </div>
          </section>

        </div>
      )}
    </main>
  )
})

export default InsightsPage
