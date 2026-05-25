/**
 * TDD — RED phase
 *
 * Integration tests for GET /api/insights route.
 * Tests fail until InsightsRouter is implemented and wired in index.ts.
 *
 * Seed data mirrors insights.service.test.ts for predictable expectations.
 *
 *   Alice   | Software Engineer | India | Engineering | 60,000
 *   Bob     | Software Engineer | India | Engineering | 90,000
 *   Charlie | Product Manager   | India | Product     | 75,000
 *   Dave    | Software Engineer | USA   | Engineering | 120,000
 *   Eve     | Data Scientist    | USA   | Data        | 110,000
 *
 * Derived expectations:
 *   India → min=60k  max=90k  avg=75k  headcount=3
 *   SE + India avg = (60k+90k)/2 = 75,000
 *   Data Scientist (USA only) → top-paid first → avgSalary=110,000
 *   Engineering avg = (60k+90k+120k)/3 = 90,000
 */

import 'reflect-metadata';
import { randomUUID } from 'crypto';
import request from 'supertest';
import sequelize from '../config/database';
import { Employee, EmploymentType } from '../models';
import { up } from '../migrations/20260524000001-create-employees';
import app from '../index';

// ── Seed data ─────────────────────────────────────────────────────────────────
const BASE = {
  currency:       'USD',
  employmentType: EmploymentType.FULL_TIME,
  joinDate:       '2024-01-15',
};

const SEED = [
  { id: randomUUID(), ...BASE, fullName: 'Alice',   jobTitle: 'Software Engineer', country: 'India', department: 'Engineering', salary: 60_000 },
  { id: randomUUID(), ...BASE, fullName: 'Bob',     jobTitle: 'Software Engineer', country: 'India', department: 'Engineering', salary: 90_000 },
  { id: randomUUID(), ...BASE, fullName: 'Charlie', jobTitle: 'Product Manager',   country: 'India', department: 'Product',     salary: 75_000 },
  { id: randomUUID(), ...BASE, fullName: 'Dave',    jobTitle: 'Software Engineer', country: 'USA',   department: 'Engineering', salary: 120_000 },
  { id: randomUUID(), ...BASE, fullName: 'Eve',     jobTitle: 'Data Scientist',    country: 'USA',   department: 'Data',        salary: 110_000 },
];

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('Insights Routes', () => {

  beforeAll(async () => {
    sequelize.addModels([Employee]);
    await up(sequelize.getQueryInterface());
    await Employee.bulkCreate(
      SEED as unknown as Parameters<typeof Employee.bulkCreate>[0],
      { ignoreDuplicates: true },
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── GET /api/insights (no query params) ────────────────────────────────────
  describe('GET /api/insights — no query params', () => {

    it('returns 200 with headcountByCountry, topPaidJobTitles, salaryByDepartment', async () => {
      const res = await request(app).get('/api/insights');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.headcountByCountry)).toBe(true);
      expect(Array.isArray(res.body.data.topPaidJobTitles)).toBe(true);
      expect(Array.isArray(res.body.data.salaryByDepartment)).toBe(true);
    });

    it('headcountByCountry reflects correct counts', async () => {
      const res = await request(app).get('/api/insights');

      const hc: { country: string; headcount: number }[] = res.body.data.headcountByCountry;
      const india = hc.find(r => r.country === 'India');
      const usa   = hc.find(r => r.country === 'USA');

      expect(india).toBeDefined();
      expect(Number(india!.headcount)).toBe(3);
      expect(usa).toBeDefined();
      expect(Number(usa!.headcount)).toBe(2);
    });

    it('topPaidJobTitles has Data Scientist first with avgSalary=110,000', async () => {
      const res = await request(app).get('/api/insights');

      const top: { jobTitle: string; avgSalary: number }[] = res.body.data.topPaidJobTitles;
      expect(top[0].jobTitle).toBe('Data Scientist');
      expect(Number(top[0].avgSalary)).toBe(110_000);
      // List must be in descending order
      for (let i = 1; i < top.length; i++) {
        expect(Number(top[i].avgSalary)).toBeLessThanOrEqual(Number(top[i - 1].avgSalary));
      }
    });

    it('salaryByDepartment Engineering avg = 90,000', async () => {
      const res = await request(app).get('/api/insights');

      const dept: { department: string; avgSalary: number }[] = res.body.data.salaryByDepartment;
      const eng = dept.find(d => d.department === 'Engineering');

      expect(eng).toBeDefined();
      expect(Number(eng!.avgSalary)).toBe(90_000);
    });

    it('does NOT include countryInsights when country param is absent', async () => {
      const res = await request(app).get('/api/insights');

      expect(res.body.data.countryInsights).toBeUndefined();
      expect(res.body.data.avgSalaryForTitle).toBeUndefined();
    });

  });

  // ── GET /api/insights?country=India ───────────────────────────────────────
  describe('GET /api/insights?country=India', () => {

    it('includes avgSalaryByTitle — array of {jobTitle, avgSalary} for India', async () => {
      const res = await request(app).get('/api/insights?country=India');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.avgSalaryByTitle)).toBe(true);

      const se = (res.body.data.avgSalaryByTitle as { jobTitle: string; avgSalary: number }[])
        .find(r => r.jobTitle === 'Software Engineer');

      expect(se).toBeDefined();
      expect(Number(se!.avgSalary)).toBe(75_000);  // Alice(60k)+Bob(90k) / 2
    });

    it('does NOT include avgSalaryByTitle when country param is absent', async () => {
      const res = await request(app).get('/api/insights');
      expect(res.body.data.avgSalaryByTitle).toBeUndefined();
    });

    it('includes countryInsights with correct min/max/avg/headcount', async () => {
      const res = await request(app).get('/api/insights?country=India');

      expect(res.status).toBe(200);
      const ci = res.body.data.countryInsights;
      expect(ci).toBeDefined();
      expect(Number(ci.min)).toBe(60_000);
      expect(Number(ci.max)).toBe(90_000);
      expect(Number(ci.avg)).toBe(75_000);   // (60k+90k+75k)/3 = 75k
      expect(Number(ci.headcount)).toBe(3);
    });

    it('does NOT include avgSalaryForTitle when jobTitle is absent', async () => {
      const res = await request(app).get('/api/insights?country=India');

      expect(res.body.data.avgSalaryForTitle).toBeUndefined();
    });

  });

  // ── GET /api/insights?country=India&jobTitle=Software Engineer ─────────────
  describe('GET /api/insights?country=India&jobTitle=Software Engineer', () => {

    it('includes avgSalaryForTitle = 75,000 (Alice+Bob average)', async () => {
      const res = await request(app).get(
        '/api/insights?country=India&jobTitle=Software%20Engineer',
      );

      expect(res.status).toBe(200);
      expect(res.body.data.avgSalaryForTitle).toBeDefined();
      expect(Number(res.body.data.avgSalaryForTitle)).toBe(75_000);
    });

    it('also includes countryInsights for India', async () => {
      const res = await request(app).get(
        '/api/insights?country=India&jobTitle=Software%20Engineer',
      );

      expect(res.body.data.countryInsights).toBeDefined();
      expect(Number(res.body.data.countryInsights.headcount)).toBe(3);
    });

  });

});
