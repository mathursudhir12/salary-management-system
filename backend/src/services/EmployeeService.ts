/**
 * TDD — GREEN phase
 *
 * Minimum implementation to pass all tests in employee.service.test.ts.
 * Validation is intentionally delegated to the Employee model's @Column validate
 * options — no duplicate logic here.
 */

import 'reflect-metadata';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { Employee, EmploymentType } from '../models';

// ── Input / output types ──────────────────────────────────────────────────────

export interface CreateEmployeeDto {
  fullName: string;
  jobTitle: string;
  country: string;
  department: string;
  salary: number;
  currency?: string;
  employmentType: EmploymentType;
  joinDate: string;
}

export interface PaginatedResult {
  data: Employee[];
  total: number;
  page: number;
  totalPages: number;
}

// ── createEmployee ────────────────────────────────────────────────────────────
// Delegates validation to the model layer (notEmpty, min salary validators).
// Throws SequelizeValidationError on invalid input — callers handle the error.

export async function createEmployee(data: CreateEmployeeDto): Promise<Employee> {
  // Double-cast: CreateEmployeeDto is structurally compatible with Sequelize's
  // creation attributes, but the index-signature mismatch requires unknown first.
  return Employee.create(data as unknown as Parameters<typeof Employee.create>[0]);
}

// ── getAllEmployees ───────────────────────────────────────────────────────────
// Never returns all rows — always paginated via findAndCountAll.
// offset = (page - 1) * limit follows standard 1-based page numbering.

export async function getAllEmployees({
  page,
  limit,
  search,
}: {
  page:    number;
  limit:   number;
  search?: string;
}): Promise<PaginatedResult> {
  const offset  = (page - 1) * limit;
  const trimmed = search?.trim();

  // Use ILIKE on PostgreSQL (case-insensitive); SQLite LIKE is ASCII-case-insensitive
  // by default, so Op.like is sufficient there.
  const likeOp = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;

  const where = trimmed
    ? {
        [Op.or]: [
          { fullName: { [likeOp]: `%${trimmed}%` } },
          { country:  { [likeOp]: `%${trimmed}%` } },
        ],
      }
    : {};

  const { rows, count } = await Employee.findAndCountAll({
    attributes: [
      'id', 'fullName', 'jobTitle', 'country', 'department',
      'salary', 'currency', 'employmentType', 'joinDate',
      'createdAt', 'updatedAt',
    ],
    where,
    limit,
    offset,
    order: [['createdAt', 'ASC']],
  });

  return {
    data: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}

// ── getEmployeeById ───────────────────────────────────────────────────────────
// Returns a single employee by primary key, or null if not found.
// Explicit attribute list — no SELECT *.

export async function getEmployeeById(id: string): Promise<Employee | null> {
  return Employee.findByPk(id, {
    attributes: [
      'id', 'fullName', 'jobTitle', 'country', 'department',
      'salary', 'currency', 'employmentType', 'joinDate',
      'createdAt', 'updatedAt',
    ],
  });
}

// ── updateEmployee ────────────────────────────────────────────────────────────
// Finds by PK, applies partial update, returns updated instance.
// Returns null if the employee does not exist.

export async function updateEmployee(
  id:   string,
  data: Partial<CreateEmployeeDto>,
): Promise<Employee | null> {
  const employee = await Employee.findByPk(id);
  if (!employee) return null;

  // Double-cast: same reason as createEmployee — index-signature mismatch.
  return employee.update(data as unknown as Parameters<typeof employee.update>[0]);
}

// ── deleteEmployee ────────────────────────────────────────────────────────────
// Destroys the row. Returns true if deleted, false if not found.

export async function deleteEmployee(id: string): Promise<boolean> {
  const employee = await Employee.findByPk(id);
  if (!employee) return false;

  await employee.destroy();
  return true;
}
