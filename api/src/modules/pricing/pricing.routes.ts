import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import {
  computeQuote,
  mockDistanceKm,
  quoteAllCategories,
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

export default router;
