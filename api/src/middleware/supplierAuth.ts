import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/httpError";

/**
 * Minimal placeholder auth for supplier-to-supplier traffic.
 *
 * OTAs call this endpoint as a machine, not as one of your logged-in users
 * — there's no User/Role behind the request, so your existing
 * requireAuth/requireRole (built around your own access-token scheme)
 * doesn't apply here.
 *
 * This checks a static per-partner key from an env var as a starting point.
 * Before going live with any real platform, replace this with whatever
 * their spec actually requires — most (Booking.com included) sign requests
 * with HMAC over the body + a shared secret, not a bare header key.
 */
export function requireSupplierKey(req: Request, _res: Response, next: NextFunction) {
  const key = req.header("x-supplier-key");
  const expected = process.env.SUPPLIER_API_KEY;

  if (!expected) {
    // Fail closed: if you haven't configured a key, refuse rather than
    // silently accepting unauthenticated supplier bookings.
    return next(HttpError.unauthorized("Supplier API is not configured"));
  }
  if (!key || key !== expected) {
    return next(HttpError.unauthorized("Invalid or missing supplier key"));
  }
  next();
}
