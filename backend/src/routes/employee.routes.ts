/**
 * Employee CRUD routes.
 *
 * POST   /api/employees          — create
 * GET    /api/employees          — list (paginated)
 * GET    /api/employees/:id      — single
 * PUT    /api/employees/:id      — update (partial)
 * DELETE /api/employees/:id      — delete
 *
 * Validation is performed via express-validator chains; the shared `validate`
 * middleware reads the result and returns 400 + { errors } on failure.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from '../services/EmployeeService';
import { EmploymentType } from '../models';

const router = Router();

// ── Validation chains ─────────────────────────────────────────────────────────

const VALID_EMPLOYMENT_TYPES = Object.values(EmploymentType);

// Rules applied when creating — all fields required
const createRules = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('fullName is required'),

  body('jobTitle')
    .trim()
    .notEmpty()
    .withMessage('jobTitle is required'),

  body('country')
    .trim()
    .notEmpty()
    .withMessage('country is required'),

  body('department')
    .trim()
    .notEmpty()
    .withMessage('department is required'),

  body('salary')
    .notEmpty().withMessage('salary is required')
    .isFloat({ min: 0.01 })
    .withMessage('salary must be greater than 0'),

  body('employmentType')
    .notEmpty().withMessage('employmentType is required')
    .isIn(VALID_EMPLOYMENT_TYPES)
    .withMessage(
      `employmentType must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}`,
    ),

  body('joinDate')
    .notEmpty().withMessage('joinDate is required')
    .isDate()
    .withMessage('joinDate must be a valid date (YYYY-MM-DD)'),
];

// Rules applied when updating — all fields optional but validated if present
const updateRules = [
  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('fullName must not be empty'),

  body('jobTitle')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('jobTitle must not be empty'),

  body('country')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('country must not be empty'),

  body('department')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('department must not be empty'),

  body('salary')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('salary must be greater than 0'),

  body('employmentType')
    .optional()
    .isIn(VALID_EMPLOYMENT_TYPES)
    .withMessage(
      `employmentType must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}`,
    ),

  body('joinDate')
    .optional()
    .isDate()
    .withMessage('joinDate must be a valid date (YYYY-MM-DD)'),
];

// ── POST /api/employees ───────────────────────────────────────────────────────

router.post(
  '/',
  createRules,
  validate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employee = await createEmployee(req.body);
      res.status(201).json({ data: employee });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/employees?page=1&limit=20 ────────────────────────────────────────

router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page  = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20),
      );

      const result = await getAllEmployees({ page, limit });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/employees/:id ────────────────────────────────────────────────────

router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employee = await getEmployeeById(String(req.params.id));

      if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }

      res.json({ data: employee });
    } catch (err) {
      next(err);
    }
  },
);

// ── PUT /api/employees/:id ────────────────────────────────────────────────────

router.put(
  '/:id',
  updateRules,
  validate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employee = await updateEmployee(String(req.params.id), req.body);

      if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }

      res.json({ data: employee });
    } catch (err) {
      next(err);
    }
  },
);

// ── DELETE /api/employees/:id ─────────────────────────────────────────────────

router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await deleteEmployee(String(req.params.id));

      if (!deleted) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }

      res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
