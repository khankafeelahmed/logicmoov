import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { prisma } from "../../db/prisma";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  computeCityFareQuote,
  computeQuote,
  deleteFareRule,
  listFareRules,
  mockDistanceKm,
  quoteAllCategories,
  setFareRuleActive,
  upsertFareRule,
} from "./pricing.service";

const router = Router();

const categoryEnum = z.enum(["SEDAN", "SUV", "VAN", "LUXURY"]);

const quoteSchema = z
  .object({
    pickup: z.string().min(1).optional(),
    dropoff: z.string().min(1).optional(),
    distanceKm: z.number().positive().optional(),
    category: categoryEnum.optional(),
    durationMinutes: z.number().int().min(0).optional(),
    waitingMinutes: z.number().int().min(0).optional(),
  })
  .refine((v) => v.distanceKm !== undefined || (v.pickup && v.dropoff), {
    message: "Provide either distanceKm or both pickup and dropoff",
  });

const cityFareQuoteSchema = z.object({
  serviceType: z.string().min(1).default("CITY_TAXI"),
  city: z.string().min(1).default("Montreal"),
  distanceKm: z.number().positive(),
  waitingMinutes: z.number().min(0).default(0),
  extraCharges: z.number().min(0).default(0),
  estimatedTimeMinutes: z.number().int().min(0).optional(),
});

const upsertFareRuleSchema = z.object({
  serviceType: z.string().min(1),
  city: z.string().min(1),
  baseFare: z.number().positive(),
  pricePerKm: z.number().positive(),
  pricePerMinute: z.number().nonnegative(),
  bookingFee: z.number().nonnegative(),
  additionalStopFeeMin: z.number().nonnegative().optional(),
  additionalStopFeeMax: z.number().nonnegative().optional(),
  airportPickupPricingNote: z.string().min(1).optional(),
  currency: z.string().length(3).optional(),
  active: z.boolean().optional(),
});

const updateFareRuleStatusSchema = z.object({
  active: z.boolean(),
});

// POST /api/v1/pricing/quote
router.post(
  "/quote",
  validate({ body: quoteSchema }),
  asyncHandler(async (req, res) => {
    const { pickup, dropoff, distanceKm, category, durationMinutes, waitingMinutes } =
      req.body as z.infer<typeof quoteSchema>;

    const km = distanceKm ?? mockDistanceKm(pickup ?? "", dropoff ?? "");

    if (category) {
      const quote = await computeQuote(category, km, durationMinutes, waitingMinutes ?? 0);
      return res.json({ distanceKm: km, quote });
    }

    const quotes = await quoteAllCategories(km, durationMinutes, waitingMinutes ?? 0);
    res.json({ distanceKm: km, quotes });
  }),
);

// GET /api/v1/pricing/rules
router.get(
  "/rules",
  asyncHandler(async (_req, res) => {
    const rules = await prisma.pricingRule.findMany({ orderBy: { category: "asc" } });
    res.json({ rules });
  }),
);

// GET /api/v1/pricing/fare-rules
router.get(
  "/fare-rules",
  validate({
    query: z.object({
      includeInactive: z.coerce.boolean().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const includeInactive = String(req.query.includeInactive).toLowerCase() === "true";
    const fareRules = await listFareRules(includeInactive);
    res.json({ fareRules });
  }),
);

// PUT /api/v1/pricing/fare-rules
router.put(
  "/fare-rules",
  requireAuth,
  requireRole("ADMIN"),
  validate({ body: upsertFareRuleSchema }),
  asyncHandler(async (req, res) => {
    const fareRule = await upsertFareRule(req.body as z.infer<typeof upsertFareRuleSchema>);
    res.status(200).json({ fareRule });
  }),
);

// PATCH /api/v1/pricing/fare-rules/:id/active
router.patch(
  "/fare-rules/:id/active",
  requireAuth,
  requireRole("ADMIN"),
  validate({ body: updateFareRuleStatusSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.body as z.infer<typeof updateFareRuleStatusSchema>;
    const fareRule = await setFareRuleActive(req.params.id, payload.active);
    res.status(200).json({ fareRule });
  }),
);

// DELETE /api/v1/pricing/fare-rules/:id
router.delete(
  "/fare-rules/:id",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await deleteFareRule(req.params.id);
    res.status(204).send();
  }),
);

// POST /api/v1/pricing/city-quote
router.post(
  "/city-quote",
  validate({ body: cityFareQuoteSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.body as z.infer<typeof cityFareQuoteSchema>;
    const quote = await computeCityFareQuote(payload);
    res.json({
      service: "City Taxi",
      city: quote.city,
      distance: `${quote.distanceKm} km`,
      estimated_time:
        payload.estimatedTimeMinutes !== undefined
          ? `${payload.estimatedTimeMinutes} minutes`
          : undefined,
      fare: `$${quote.estimatedFare.toFixed(2)} ${quote.currency}`,
      breakdown: quote.breakdown,
      pricing_config: quote.pricingConfig,
    });
  }),
);

export default router;
