import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import * as ratesService from "./rates.service";

const router = Router();

const categoryEnum = z.enum(["SEDAN", "SUV", "VAN", "LUXURY"]);

const upsertSchema = z.object({
  originZone: z.string().min(1),
  destinationZone: z.string().min(1),
  category: categoryEnum,
  priceCents: z.number().int().positive(),
  currency: z.string().length(3).optional(),
  meetAndGreetFeeCents: z.number().int().nonnegative().optional(),
  includedWaitMin: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

// GET /api/v1/rates — admin: list the published rate card (optionally by origin zone)
router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validate({
    query: z.object({
      originZone: z.string().optional(),
      take: z.coerce.number().int().min(1).max(200).default(50),
      skip: z.coerce.number().int().min(0).default(0),
    }),
  }),
  asyncHandler(async (req, res) => {
    const result = await ratesService.listRates({
      originZone: req.query.originZone as string | undefined,
      take: Number(req.query.take),
      skip: Number(req.query.skip),
    });
    res.json(result);
  }),
);

// PUT /api/v1/rates — admin: create or update the rate for a route/category
router.put(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validate({ body: upsertSchema }),
  asyncHandler(async (req, res) => {
    const rate = await ratesService.upsertRate(req.body);
    res.status(200).json({ rate });
  }),
);

// DELETE /api/v1/rates/:id — admin: remove a published rate
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    await ratesService.deleteRate(req.params.id);
    res.status(204).send();
  }),
);

export default router;
