import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { requireSupplierKey } from "../../middleware/supplierAuth";
import * as supplierService from "./supplier.service";

const router = Router();

const categoryEnum = z.enum(["SEDAN", "SUV", "VAN", "LUXURY"]);
const sourceEnum = z.enum([
  "BOOKING_COM",
  "HOLIDAY_TAXIS",
  "VIATOR",
  "GET_YOUR_GUIDE",
  "EXPEDIA",
]);

const ingestSchema = z.object({
  source: sourceEnum,
  externalRef: z.string().min(1),
  originZone: z.string().min(1),
  destinationZone: z.string().min(1),
  category: categoryEnum,
  scheduledAt: z.string().datetime(),
  passengers: z.number().int().min(1).max(15),
  luggage: z.number().int().min(0).max(30).default(0),
  flightNumber: z.string().optional(),
  notes: z.string().max(1000).optional(),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(7),
  agreedPriceCents: z.number().int().positive(),
  currency: z.string().length(3),
  pickupAddress: z.string().min(1),
  dropoffAddress: z.string().min(1),
});

const cancelSchema = z.object({
  source: sourceEnum,
  reason: z.string().max(500).optional(),
});

// POST /api/v1/supplier/bookings — an OTA/consolidator creates a booking
// on your system. Price is validated against your published RouteRate,
// not recomputed — see supplier.service.ts for the reasoning.
router.post(
  "/bookings",
  requireSupplierKey,
  validate({ body: ingestSchema }),
  asyncHandler(async (req, res) => {
    const booking = await supplierService.ingestSupplierBooking(req.body);
    res.status(201).json({ booking });
  }),
);

// POST /api/v1/supplier/bookings/:externalRef/cancel — an OTA cancels a
// booking it previously created. `source` in the body disambiguates in the
// (unlikely) case two platforms reuse the same reference format.
router.post(
  "/bookings/:externalRef/cancel",
  requireSupplierKey,
  validate({ body: cancelSchema }),
  asyncHandler(async (req, res) => {
    const booking = await supplierService.cancelSupplierBooking({
      externalRef: req.params.externalRef,
      source: req.body.source,
      reason: req.body.reason,
    });
    res.json({ booking });
  }),
);

export default router;
