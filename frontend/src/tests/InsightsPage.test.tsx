/**
 * Tests for InsightsPage — salary analytics dashboard.
 *
 * TDD Red phase: InsightsPage imports useInsights and components that
 * don't yet exist, so all tests fail on import.
 *
 * Strategy:
 *  - Mock useInsights so tests never hit the network.
 *  - Base mock returns the always-present data (headcount, top-5, department).
 *  - Override per-test to simulate country selection returning countryInsights
 *    and avgSalaryByTitle.
 */
import { render, screen } from '@testing-library/react'
import userEvent             from '@testing-library/user-event'
import { vi, describe, it, beforeEach, expect } from 'vitest'

// ── Mock the data hook ────────────────────────────────────────────────────────

vi.mock('@/hooks/useInsights')

import { useInsights } from '@/hooks/useInsights'
import InsightsPage    from '@/pages/InsightsPage'
import type { InsightsApiResponse } from '@/types/insights'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockBaseResponse: InsightsApiResponse = {
  data: {
    headcountByCountry: [
      { country: 'India', headcount: 1200 },
      { country: 'USA',   headcount: 800  },
    ],
    topPaidJobTitles: [
      { jobTitle: 'Staff Engineer',      avgSalary: 185_000 },
      { jobTitle: 'Engineering Manager', avgSalary: 175_000 },
      { jobTitle: 'Principal Engineer',  avgSalary: 165_000 },
    ],
    salaryByDepartment: [
      { department: 'Engineering', avgSalary: 120_000 },
      { department: 'Finance',     avgSalary:  95_000 },
    ],
  },
}

const mockCountryResponse: InsightsApiResponse = {
  data: {
    ...mockBaseResponse.data,
    countryInsights: {
      min:       20_000,
      max:      200_000,
      avg:      105_000,
      headcount: 1200,
    },
    avgSalaryByTitle: [
      { jobTitle: 'Software Engineer', avgSalary: 95_000 },
      { jobTitle: 'Product Manager',   avgSalary: 88_000 },
    ],
  },
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Default: no country selected → base data only
  vi.mocked(useInsights).mockReturnValue({
    data:      mockBaseResponse,
    isLoading: false,
    isError:   false,
  } as ReturnType<typeof useInsights>)
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InsightsPage', () => {

  // ── Page structure ──────────────────────────────────────────────────────────

  it('renders the "Insights" page heading', () => {
    render(<InsightsPage />)
    expect(screen.getByRole('heading', { name: /insights/i })).toBeInTheDocument()
  })

  it('renders a country selector labelled "Filter by Country"', () => {
    render(<InsightsPage />)
    expect(screen.getByLabelText(/filter by country/i)).toBeInTheDocument()
  })

  it('country selector includes an "All Countries" default option', () => {
    render(<InsightsPage />)
    expect(
      screen.getByRole('option', { name: /all countries/i }),
    ).toBeInTheDocument()
  })

  it('country selector is populated with countries from headcountByCountry', () => {
    render(<InsightsPage />)
    expect(screen.getByRole('option', { name: 'India' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'USA'   })).toBeInTheDocument()
  })

  // ── Global tables (always visible) ─────────────────────────────────────────

  it('shows the "Top 5 Highest Paid Job Titles" section', () => {
    render(<InsightsPage />)
    expect(screen.getByText(/top 5 highest paid job titles/i)).toBeInTheDocument()
  })

  it('renders job-title rows in the Top 5 table', () => {
    render(<InsightsPage />)
    expect(screen.getByText('Staff Engineer')).toBeInTheDocument()
    expect(screen.getByText('Engineering Manager')).toBeInTheDocument()
  })

  it('shows the "Salary Distribution by Department" section', () => {
    render(<InsightsPage />)
    expect(screen.getByText(/salary distribution by department/i)).toBeInTheDocument()
  })

  it('renders department rows in the salary-by-department table', () => {
    render(<InsightsPage />)
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()
  })

  // ── Country-specific cards (only when a country is selected) ────────────────

  it('does NOT show country stat cards when no country is selected', () => {
    render(<InsightsPage />)
    expect(screen.queryByText(/min salary/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/max salary/i)).not.toBeInTheDocument()
  })

  it('shows Min / Max / Avg Salary and Headcount cards after selecting a country', async () => {
    const user = userEvent.setup()

    // Return country-specific data when country === 'India'
    vi.mocked(useInsights).mockImplementation((country) =>
      country === 'India'
        ? ({ data: mockCountryResponse, isLoading: false, isError: false } as ReturnType<typeof useInsights>)
        : ({ data: mockBaseResponse,    isLoading: false, isError: false } as ReturnType<typeof useInsights>),
    )

    render(<InsightsPage />)

    await user.selectOptions(screen.getByLabelText(/filter by country/i), 'India')

    // Use { selector: 'p' } to target only the CardDescription <p> elements,
    // not the "Avg Salary" <th> column headers that also match the pattern.
    expect(screen.getByText(/min salary/i, { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText(/max salary/i, { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText(/avg salary/i, { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText(/headcount/i,  { selector: 'p' })).toBeInTheDocument()
  })

  it('shows the formatted min / max values in the stat cards', async () => {
    const user = userEvent.setup()

    vi.mocked(useInsights).mockImplementation((country) =>
      country === 'India'
        ? ({ data: mockCountryResponse, isLoading: false, isError: false } as ReturnType<typeof useInsights>)
        : ({ data: mockBaseResponse,    isLoading: false, isError: false } as ReturnType<typeof useInsights>),
    )

    render(<InsightsPage />)
    await user.selectOptions(screen.getByLabelText(/filter by country/i), 'India')

    // 20000 → "20,000"  |  200000 → "200,000"
    expect(screen.getByText('20,000')).toBeInTheDocument()
    expect(screen.getByText('200,000')).toBeInTheDocument()
  })

  // ── Country job-title breakdown table ──────────────────────────────────────

  it('does NOT show the per-country job-title table when no country is selected', () => {
    render(<InsightsPage />)
    expect(
      screen.queryByText(/average salary by job title/i),
    ).not.toBeInTheDocument()
  })

  it('shows the "Average Salary by Job Title" table after selecting a country', async () => {
    const user = userEvent.setup()

    vi.mocked(useInsights).mockImplementation((country) =>
      country === 'India'
        ? ({ data: mockCountryResponse, isLoading: false, isError: false } as ReturnType<typeof useInsights>)
        : ({ data: mockBaseResponse,    isLoading: false, isError: false } as ReturnType<typeof useInsights>),
    )

    render(<InsightsPage />)
    await user.selectOptions(screen.getByLabelText(/filter by country/i), 'India')

    expect(screen.getByText(/average salary by job title/i)).toBeInTheDocument()
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Product Manager')).toBeInTheDocument()
  })

  // ── Loading & error states ──────────────────────────────────────────────────

  it('shows a loading indicator while data is being fetched', () => {
    vi.mocked(useInsights).mockReturnValue({
      data:      undefined,
      isLoading: true,
      isError:   false,
    } as ReturnType<typeof useInsights>)

    render(<InsightsPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error message when the API request fails', () => {
    vi.mocked(useInsights).mockReturnValue({
      data:      undefined,
      isLoading: false,
      isError:   true,
    } as ReturnType<typeof useInsights>)

    render(<InsightsPage />)
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
  })
})
