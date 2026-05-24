/**
 * TDD — RED phase
 *
 * These tests are written BEFORE the EmployeeService implementation exists.
 * They will ALL fail with "Cannot find module '../services/EmployeeService'"
 * until the GREEN phase creates the implementation.
 *
 * Database: SQLite in-memory (NODE_ENV=test, configured in database.ts)
 * Migration: the actual 20260524000001-create-employees migration is run in
 *            beforeAll so tests exercise the real schema, not a shortcut sync().
 */

import 'reflect-metadata';
import sequelize from '../config/database';
import { Employee, EmploymentType } from '../models';
import { up } from '../migrations/20260524000001-create-employees';

// ── This import is the RED driver — EmployeeService does not exist yet ─────────
import { createEmployee, getAllEmployees } from '../services/EmployeeService';

// ── Shared fixture ────────────────────────────────────────────────────────────
const validPayload = {
  fullName:       'Priya Sharma',
  jobTitle:       'Software Engineer',
  country:        'India',
  department:     'Engineering',
  salary:         85_000,
  currency:       'USD',
  employmentType: EmploymentType.FULL_TIME,
  joinDate:       '2024-03-01',
};

// ── Test suite ────────────────────────────────────────────────────────────────
describe('EmployeeService', () => {

  // Run the real migration on the in-memory SQLite DB once before all tests.
  // Using the actual migration (not sync()) ensures tests validate the real schema.
  beforeAll(async () => {
    sequelize.addModels([Employee]); // explicit registration — safe with path-based discovery
    await up(sequelize.getQueryInterface());
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // Wipe every row between tests — each test starts from a clean slate.
  afterEach(async () => {
    await Employee.destroy({ where: {}, truncate: false });
  });

  // ── createEmployee() ────────────────────────────────────────────────────────
  describe('createEmployee()', () => {

    it('should save an employee with valid data', async () => {
      const employee = await createEmployee(validPayload);

      expect(employee.id).toBeDefined();
      expect(employee.fullName).toBe('Priya Sharma');
      expect(employee.jobTitle).toBe('Software Engineer');
      expect(employee.country).toBe('India');
      expect(employee.department).toBe('Engineering');
      // DECIMAL columns can return as string from the DB driver — normalise with Number()
      expect(Number(employee.salary)).toBe(85_000);
      expect(employee.currency).toBe('USD');
      expect(employee.employmentType).toBe(EmploymentType.FULL_TIME);
      expect(employee.joinDate).toBe('2024-03-01');
      expect(employee.createdAt).toBeInstanceOf(Date);
      expect(employee.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw an error if salary is 0 or negative', async () => {
      await expect(
        createEmployee({ ...validPayload, salary: 0 })
      ).rejects.toThrow();

      await expect(
        createEmployee({ ...validPayload, salary: -500 })
      ).rejects.toThrow();
    });

    it('should throw an error if fullName is empty', async () => {
      await expect(
        createEmployee({ ...validPayload, fullName: '' })
      ).rejects.toThrow();
    });

    it('should throw an error if country is empty', async () => {
      await expect(
        createEmployee({ ...validPayload, country: '' })
      ).rejects.toThrow();
    });

  });

  // ── getAllEmployees() ───────────────────────────────────────────────────────
  describe('getAllEmployees()', () => {

    it('should return paginated results with correct metadata', async () => {
      // Seed 5 employees sequentially (runInBand keeps SQLite happy)
      for (let i = 1; i <= 5; i++) {
        await createEmployee({ ...validPayload, fullName: `Employee ${i}` });
      }

      const result = await getAllEmployees({ page: 1, limit: 3 });

      expect(result.data).toHaveLength(3);          // page size respected
      expect(result.total).toBe(5);                 // correct total count
      expect(result.page).toBe(1);                  // page number echoed back
      expect(result.totalPages).toBe(2);            // Math.ceil(5/3) = 2
    });

  });

});
