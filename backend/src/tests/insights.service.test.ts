/**
 * TDD — RED phase
 *
 * Tests for InsightsService are written before the implementation exists.
 * All 5 tests will fail with "Cannot find module '../services/InsightsService'"
 * until the GREEN phase creates the implementation.
 *
 * Seed dataset (deterministic integers — no floating-point rounding needed):
 *
 *   Alice   | Software Engineer | India | Engineering | 60,000
 *   Bob     | Software Engineer | India | Engineering | 90,000
 *   Charlie | Product Manager   | India | Product     | 75,000
 *   Dave    | Software Engineer | USA   | Engineering | 120,000
 *   Eve     | Data Scientist    | USA   | Data        | 110,000
 *
 * Derived expectations:
 *   India → min=60k  max=90k  avg=75k  headcount=3
 *   USA   → headcount=2
 *   SE + India avg  = (60k+90k)/2           = 75,000
 *   Engineering avg = (60k+90k+120k)/3      = 90,000
 *   Product avg     = 75k/1                 = 75,000
 *   Data avg        = 110k/1                = 110,000
 *   Top paid order  → Data Scientist(110k) > Software Engineer(90k) > Product Manager(75k)
 */

import 'reflect-metadata';
import { randomUUID } from 'crypto';
import sequelize from '../config/database';
import { Employee, EmploymentType } from '../models';
import { up } from '../migrations/20260524000001-create-employees';

// ── RED driver — InsightsService does not exist yet ───────────────────────────
import {
  getInsightsByCountry,
  getAvgSalaryByTitleAndCountry,
  getHeadcountByCountry,
  getTopPaidJobTitles,
  getSalaryDistributionByDepartment,
} from '../services/InsightsService';

// ── Seed records ──────────────────────────────────────────────────────────────
const BASE = {
  currency:       'USD',
  employmentType: EmploymentType.FULL_TIME,
  joinDate:       '2024-01-15',
};

// Explicit UUIDs ensure bulkCreate works regardless of how Sequelize handles
// function-based defaultValues across different versions.
const SEED = [
  { id: randomUUID(), ...BASE, fullName: 'Alice',   jobTitle: 'Software Engineer', country: 'India', department: 'Engineering', salary: 60_000 },
  { id: randomUUID(), ...BASE, fullName: 'Bob',     jobTitle: 'Software Engineer', country: 'India', department: 'Engineering', salary: 90_000 },
  { id: randomUUID(), ...BASE, fullName: 'Charlie', jobTitle: 'Product Manager',   country: 'India', department: 'Product',     salary: 75_000 },
  { id: randomUUID(), ...BASE, fullName: 'Dave',    jobTitle: 'Software Engineer', country: 'USA',   department: 'Engineering', salary: 120_000 },
  { id: randomUUID(), ...BASE, fullName: 'Eve',     jobTitle: 'Data Scientist',    country: 'USA',   department: 'Data',        salary: 110_000 },
];

// ── Test suite ────────────────────────────────────────────────────────────────
describe('InsightsService', () => {

  // Seed once for all read-only insight queries — no afterEach wipe needed.
  beforeAll(async () => {
    sequelize.addModels([Employee]);
    await up(sequelize.getQueryInterface());
    await Employee.bulkCreate(SEED as unknown as Parameters<typeof Employee.bulkCreate>[0], {
      ignoreDuplicates: true,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── 1. getInsightsByCountry ───────────────────────────────────────────────
  describe('getInsightsByCountry()', () => {
    it('returns min, max, avg and headcount for a given country', async () => {
      const result = await getInsightsByCountry('India');

      expect(Number(result.min)).toBe(60_000);
      expect(Number(result.max)).toBe(90_000);
      expect(Number(result.avg)).toBe(75_000);   // (60k + 90k + 75k) / 3 = 75k
      expect(Number(result.headcount)).toBe(3);
    });
  });

  // ── 2. getAvgSalaryByTitleAndCountry ─────────────────────────────────────
  describe('getAvgSalaryByTitleAndCountry()', () => {
    it('returns average salary for a job title in a specific country', async () => {
      const avg = await getAvgSalaryByTitleAndCountry('Software Engineer', 'India');

      // Alice(60k) + Bob(90k) → avg = 75,000
      expect(Number(avg)).toBe(75_000);
    });
  });

  // ── 3. getHeadcountByCountry ──────────────────────────────────────────────
  describe('getHeadcountByCountry()', () => {
    it('returns employee count per country', async () => {
      const result = await getHeadcountByCountry();

      const india = result.find(r => r.country === 'India');
      const usa   = result.find(r => r.country === 'USA');

      expect(india).toBeDefined();
      expect(Number(india!.headcount)).toBe(3);
      expect(usa).toBeDefined();
      expect(Number(usa!.headcount)).toBe(2);
    });
  });

  // ── 4. getTopPaidJobTitles ────────────────────────────────────────────────
  describe('getTopPaidJobTitles()', () => {
    it('returns at most 5 job titles ordered by avg salary descending', async () => {
      const result = await getTopPaidJobTitles();

      expect(result.length).toBeLessThanOrEqual(5);

      // Data Scientist has the highest avg (110k) — must come first
      expect(result[0].jobTitle).toBe('Data Scientist');
      expect(Number(result[0].avgSalary)).toBe(110_000);

      // Every subsequent entry must be ≤ the previous (desc order enforced)
      for (let i = 1; i < result.length; i++) {
        expect(Number(result[i].avgSalary))
          .toBeLessThanOrEqual(Number(result[i - 1].avgSalary));
      }
    });
  });

  // ── 5. getSalaryDistributionByDepartment ──────────────────────────────────
  describe('getSalaryDistributionByDepartment()', () => {
    it('returns average salary per department', async () => {
      const result = await getSalaryDistributionByDepartment();

      const engineering = result.find(r => r.department === 'Engineering');
      const product     = result.find(r => r.department === 'Product');
      const data        = result.find(r => r.department === 'Data');

      expect(Number(engineering!.avgSalary)).toBe(90_000);  // (60k+90k+120k)/3
      expect(Number(product!.avgSalary)).toBe(75_000);       // 75k
      expect(Number(data!.avgSalary)).toBe(110_000);          // 110k
    });
  });

});
