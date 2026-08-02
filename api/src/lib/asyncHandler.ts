import type { NextFunction, Request, Response } from "express";

/**
 * Wraps an async route handler and forwards rejected promises to Express's
 * error middleware, avoiding repetitive try/catch blocks.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
