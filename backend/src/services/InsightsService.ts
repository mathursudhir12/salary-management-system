/**
 * TDD — GREEN phase
 *
 * Minimum implementation to pass all tests in insights.service.test.ts.
 * All aggregations use Sequelize fn/col as mandated by CLAUDE.md — no raw SQL.
 * Parameterised WHERE clauses only — no string interpolation.
 */

import 'reflect-metadata';
import { fn, col } from 'sequelize';
import { Employee } from '../models';

// ── Return-type interfaces (exported so routes can use them later) ─────────────

export interface CountryInsights {
  min:       number;
  max:       number;
  avg:       number;
  headcount: number;
}

export interface CountryHeadcount {
  country:   string;
  headcount: number;
}

export interface JobTitleAvgSalary {
  jobTitle:  string;
  avgSalary: number;
}

export interface DepartmentAvgSalary {
  department: string;
  avgSalary:  number;
}

// ── Helper — raw aggregation row type ────────────────────────────────────────
// Sequelize returns DECIMAL values as strings from the DB driver; Number() normalises.
type RawCountryInsights = { min: string; max: string; avg: string; headcount: string };

// ── 1. getInsightsByCountry ───────────────────────────────────────────────────
// Single-row aggregation: MIN, MAX, AVG, COUNT filtered by country.
// No GROUP BY needed — the WHERE clause already scopes to one country.

export async function getInsightsByCountry(country: string): Promise<CountryInsights> {
  const row = await Employee.findOne({
    attributes: [
      [fn('MIN', col('salary')),  'min'],
      [fn('MAX', col('salary')),  'max'],
      [fn('AVG', col('salary')),  'avg'],
      [fn('COUNT', col('id')),    'headcount'],
    ],
    where:  { country },
    raw:    true,
  }) as unknown as RawCountryInsights | null;

  return {
    min:       Number(row?.min       ?? 0),
    max:       Number(row?.max       ?? 0),
    avg:       Number(row?.avg       ?? 0),
    headcount: Number(row?.headcount ?? 0),
  };
}

// ── 2. getAvgSalaryByTitleAndCountry ─────────────────────────────────────────
// Single AVG filtered by two parameterised WHERE conditions.

export async function getAvgSalaryByTitleAndCountry(
  jobTitle: string,
  country:  string,
): Promise<number> {
  const row = await Employee.findOne({
    attributes: [[fn('AVG', col('salary')), 'avg']],
    where:      { jobTitle, country },
    raw:        true,
  }) as unknown as { avg: string } | null;

  return Number(row?.avg ?? 0);
}

// ── 3. getHeadcountByCountry ─────────────────────────────────────────────────
// GROUP BY country, COUNT(id) ordered descending.

export async function getHeadcountByCountry(): Promise<CountryHeadcount[]> {
  const rows = await Employee.findAll({
    attributes: [
      'country',
      [fn('COUNT', col('id')), 'headcount'],
    ],
    group: ['country'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    raw:   true,
  }) as unknown as { country: string; headcount: string }[];

  return rows.map(r => ({
    country:   r.country,
    headcount: Number(r.headcount),
  }));
}

// ── 4. getTopPaidJobTitles ────────────────────────────────────────────────────
// GROUP BY jobTitle, AVG(salary) DESC, LIMIT 5.
// No SELECT * — only the two needed columns are fetched.

export async function getTopPaidJobTitles(): Promise<JobTitleAvgSalary[]> {
  const rows = await Employee.findAll({
    attributes: [
      'jobTitle',
      [fn('AVG', col('salary')), 'avgSalary'],
    ],
    group: ['jobTitle'],
    order: [[fn('AVG', col('salary')), 'DESC']],
    limit: 5,
    raw:   true,
  }) as unknown as { jobTitle: string; avgSalary: string }[];

  return rows.map(r => ({
    jobTitle:  r.jobTitle,
    avgSalary: Number(r.avgSalary),
  }));
}

// ── 5. getAvgSalaryByTitleForCountry ─────────────────────────────────────────
// All job titles in a country with their AVG(salary), ordered descending.
// Used by the Insights page to render the per-country breakdown table.

export async function getAvgSalaryByTitleForCountry(
  country: string,
): Promise<JobTitleAvgSalary[]> {
  const rows = await Employee.findAll({
    attributes: [
      'jobTitle',
      [fn('AVG', col('salary')), 'avgSalary'],
    ],
    where: { country },
    group: ['jobTitle'],
    order: [[fn('AVG', col('salary')), 'DESC']],
    raw:   true,
  }) as unknown as { jobTitle: string; avgSalary: string }[];

  return rows.map(r => ({
    jobTitle:  r.jobTitle,
    avgSalary: Number(r.avgSalary),
  }));
}

// ── 6. getSalaryDistributionByDepartment ──────────────────────────────────────
// GROUP BY department, AVG(salary) DESC.

export async function getSalaryDistributionByDepartment(): Promise<DepartmentAvgSalary[]> {
  const rows = await Employee.findAll({
    attributes: [
      'department',
      [fn('AVG', col('salary')), 'avgSalary'],
    ],
    group: ['department'],
    order: [[fn('AVG', col('salary')), 'DESC']],
    raw:   true,
  }) as unknown as { department: string; avgSalary: string }[];

  return rows.map(r => ({
    department: r.department,
    avgSalary:  Number(r.avgSalary),
  }));
}
