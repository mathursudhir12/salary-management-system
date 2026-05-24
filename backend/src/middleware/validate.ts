/**
 * express-validator result handler.
 *
 * Use after a chain of `body()`/`param()`/`query()` validators.
 * If any validation rule failed, returns 400 with { errors: [...] }.
 * If all rules passed, calls next() to continue to the route handler.
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  next();
}
