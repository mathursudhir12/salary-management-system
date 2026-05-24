/**
 * Global error handler middleware.
 *
 * Produces a consistent JSON error envelope for all thrown errors.
 * Must be registered as the LAST middleware in Express (after all routes).
 *
 * Envelope shape:
 *   { error: string, errors?: unknown[] }
 *
 * statusCode on the Error object is honoured; defaults to 500.
 */

import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  /** HTTP status code to send (default 500) */
  statusCode?: number;
  /** Structured validation errors or additional details */
  errors?: unknown[];
}

export function errorHandler(
  err: AppError,
  _req:  Request,
  res:   Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const message    = err.message    ?? 'Internal server error';

  console.error(err.stack);

  res.status(statusCode).json({
    error: message,
    ...(err.errors && { errors: err.errors }),
  });
}
