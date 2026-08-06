import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { optionalAuth, requireAuth, requireRole } from "../../middleware/auth";
import { HttpError } from "../../lib/httpError";
import * as bookingsService from "./bookings.service";

const router = Router();

const categoryEnum = z.enum(["SEDAN", "SUV", "VAN", "LUXURY"]);
const statusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "ASSIGNED",
  "EN_ROUTE",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

const createSchema = z.object({
  tripType: z.enum(["ONE_WAY", "ROUND_TRIP"]).default("ONE_WAY"),
  category: categoryEnum,
  pickupAddress: z.string().min(1),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffAddress: z.string().min(1),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  scheduledAt: z.string().datetime(),
  passengers: z.number().int().min(1).max(8).optional(),
  passengerCounts: z
    .object({
      adults: z.number().int().min(0).max(8),
      children: z.number().int().min(0).max(8),
      infants: z.number().int().min(0).max(8),
    })
    .optional(),
  childSeatOptions: z
    .object({
      infantSeatQty: z.number().int().min(0).max(8).optional(),
      childSeatQty: z.number().int().min(0).max(8).optional(),
      boosterSeatQty: z.number().int().min(0).max(8).optional(),
    })
    .optional(),
  luggage: z.number().int().min(0).max(20).optional(),
  notes: z.string().max(1000).optional(),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(7),
  distanceKm: z.number().positive().optional(),
}).superRefine((value, ctx) => {
  if (!value.passengerCounts) return;
  const total =
    value.passengerCounts.adults +
    value.passengerCounts.children +
    value.passengerCounts.infants;
  if (value.passengerCounts.adults < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["passengerCounts", "adults"],
      message: "At least one adult is required",
    });
  }
  if (total < 1 || total > 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["passengerCounts"],
      message: "Passenger count must be between 1 and 8",
    });
  }
});

// POST /api/v1/bookings — public (guest) or authenticated
router.post(
  "/",
  optionalAuth,
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    const booking = await bookingsService.createBooking(req.body, req.user?.sub);
    res.status(201).json({ booking });
  }),
);

// GET /api/v1/bookings — authenticated (own bookings; admin sees all)
router.get(
  "/",
  requireAuth,
  validate({
    query: z.object({
      status: statusEnum.optional(),
      take: z.coerce.number().int().min(1).max(100).default(20),
      skip: z.coerce.number().int().min(0).default(0),
    }),
  }),
  asyncHandler(async (req, res) => {
    const isAdmin = req.user!.role === "ADMIN";
    const result = await bookingsService.listBookings({
      customerId: isAdmin ? undefined : req.user!.sub,
      status: req.query.status as never,
      take: Number(req.query.take),
      skip: Number(req.query.skip),
    });
    res.json(result);
  }),
);

// GET /api/v1/bookings/:reference — public lookup by reference
router.get(
  "/:reference",
  asyncHandler(async (req, res) => {
    const booking = await bookingsService.getByReference(req.params.reference);
    res.json({ booking });
  }),
);

// PATCH /api/v1/bookings/:id/status — admin or driver
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN", "DRIVER"),
  validate({ body: z.object({ status: statusEnum, driverId: z.string().optional() }) }),
  asyncHandler(async (req, res) => {
    if (req.user!.role === "DRIVER" && !req.body.driverId) {
      throw HttpError.badRequest("driverId is required for driver updates");
    }
    const booking = await bookingsService.updateStatus(
      req.params.id,
      req.body.status,
      req.body.driverId,
    );
    res.json({ booking });
  }),
);

export default router;
