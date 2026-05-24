/**
 * TDD — RED phase
 *
 * Integration tests for Employee REST API routes.
 * All tests fail until routes, middleware, and service methods are implemented.
 *
 * Transport: Supertest (in-process HTTP, no real port bound)
 * Database:  SQLite in-memory (NODE_ENV=test)
 */

import 'reflect-metadata';
import request from 'supertest';
import sequelize from '../config/database';
import { Employee, EmploymentType } from '../models';
import { up } from '../migrations/20260524000001-create-employees';
import app from '../index';

// ── Shared valid payload ──────────────────────────────────────────────────────
const validEmployee = {
  fullName:       'John Doe',
  jobTitle:       'Software Engineer',
  country:        'India',
  department:     'Engineering',
  salary:         80_000,
  currency:       'USD',
  employmentType: 'FULL_TIME',
  joinDate:       '2024-01-15',
};

// ── Helper — seed directly via model (bypasses HTTP for setup speed) ──────────
async function seedEmployee(overrides: Partial<typeof validEmployee> = {}) {
  return Employee.create({
    fullName:       'Seed Employee',
    jobTitle:       'Analyst',
    country:        'USA',
    department:     'Finance',
    salary:         70_000,
    currency:       'USD',
    employmentType: EmploymentType.FULL_TIME,
    joinDate:       '2023-06-01',
    ...overrides,
  } as unknown as Parameters<typeof Employee.create>[0]);
}

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('Employee Routes', () => {

  beforeAll(async () => {
    sequelize.addModels([Employee]);
    await up(sequelize.getQueryInterface());
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // Wipe all rows between tests for isolation
  afterEach(async () => {
    await Employee.destroy({ where: {}, truncate: false });
  });

  // ── POST /api/employees ────────────────────────────────────────────────────
  describe('POST /api/employees', () => {

    it('creates an employee with valid data → 201 with { data }', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send(validEmployee);

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.fullName).toBe('John Doe');
      expect(res.body.data.jobTitle).toBe('Software Engineer');
      expect(res.body.data.country).toBe('India');
      expect(Number(res.body.data.salary)).toBe(80_000);
    });

    it('defaults currency to USD if not provided', async () => {
      const { currency: _omit, ...withoutCurrency } = validEmployee;
      const res = await request(app)
        .post('/api/employees')
        .send(withoutCurrency);

      expect(res.status).toBe(201);
      expect(res.body.data.currency).toBe('USD');
    });

    it('returns 400 + { errors } when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ fullName: 'Only Name' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('returns 400 when salary is zero', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ ...validEmployee, salary: 0 });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('returns 400 when salary is negative', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ ...validEmployee, salary: -500 });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('returns 400 when employmentType is invalid', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ ...validEmployee, employmentType: 'INVALID_TYPE' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('returns 400 when joinDate is not a valid date', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ ...validEmployee, joinDate: 'not-a-date' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

  });

  // ── GET /api/employees ─────────────────────────────────────────────────────
  describe('GET /api/employees', () => {

    beforeEach(async () => {
      for (let i = 1; i <= 5; i++) {
        await seedEmployee({ fullName: `Employee ${i}` });
      }
    });

    it('returns paginated list with correct metadata', async () => {
      const res = await request(app).get('/api/employees?page=1&limit=3');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.total).toBe(5);
      expect(res.body.totalPages).toBe(2);
      expect(res.body.page).toBe(1);
    });

    it('returns second page correctly', async () => {
      const res = await request(app).get('/api/employees?page=2&limit=3');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.page).toBe(2);
    });

    it('uses page=1, limit=20 defaults when query params are absent', async () => {
      const res = await request(app).get('/api/employees');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(5);   // 5 seeded, limit defaults to 20
      expect(res.body.page).toBe(1);
    });

  });

  // ── GET /api/employees/:id ─────────────────────────────────────────────────
  describe('GET /api/employees/:id', () => {

    it('returns the employee by id → 200 with { data }', async () => {
      const employee = await seedEmployee({ fullName: 'Jane Smith' });

      const res = await request(app).get(`/api/employees/${employee.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(employee.id);
      expect(res.body.data.fullName).toBe('Jane Smith');
    });

    it('returns 404 when id does not exist', async () => {
      const res = await request(app).get('/api/employees/nonexistent-uuid');

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

  });

  // ── PUT /api/employees/:id ─────────────────────────────────────────────────
  describe('PUT /api/employees/:id', () => {

    it('updates salary and returns updated employee → 200', async () => {
      const employee = await seedEmployee({ salary: 70_000 });

      const res = await request(app)
        .put(`/api/employees/${employee.id}`)
        .send({ salary: 95_000 });

      expect(res.status).toBe(200);
      expect(Number(res.body.data.salary)).toBe(95_000);
    });

    it('updates multiple fields at once', async () => {
      const employee = await seedEmployee({ jobTitle: 'Junior Engineer' });

      const res = await request(app)
        .put(`/api/employees/${employee.id}`)
        .send({ jobTitle: 'Senior Engineer', department: 'Platform' });

      expect(res.status).toBe(200);
      expect(res.body.data.jobTitle).toBe('Senior Engineer');
      expect(res.body.data.department).toBe('Platform');
    });

    it('returns 404 when employee does not exist', async () => {
      const res = await request(app)
        .put('/api/employees/nonexistent-uuid')
        .send({ salary: 95_000 });

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 when salary is updated to a negative value', async () => {
      const employee = await seedEmployee();

      const res = await request(app)
        .put(`/api/employees/${employee.id}`)
        .send({ salary: -500 });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('returns 400 when employmentType update uses an invalid value', async () => {
      const employee = await seedEmployee();

      const res = await request(app)
        .put(`/api/employees/${employee.id}`)
        .send({ employmentType: 'BOGUS' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

  });

  // ── DELETE /api/employees/:id ──────────────────────────────────────────────
  describe('DELETE /api/employees/:id', () => {

    it('deletes an employee → 200 with success message', async () => {
      const employee = await seedEmployee();

      const res = await request(app).delete(`/api/employees/${employee.id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();

      // Verify removal
      const getRes = await request(app).get(`/api/employees/${employee.id}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 when employee does not exist', async () => {
      const res = await request(app).delete('/api/employees/nonexistent-uuid');

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

  });

});
