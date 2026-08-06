import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import { prisma } from "../../db/prisma";

const router = Router();

const categoryEnum = z.enum(["SEDAN", "SUV", "VAN", "LUXURY"]);

// GET /api/v1/vehicles — public list of active vehicle types
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const vehicles = await prisma.vehicle.findMany({
      where: { active: true },
      orderBy: { category: "asc" },
    });
    res.json({ vehicles });
  }),
);

// POST /api/v1/vehicles — admin adds a vehicle
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validate({
    body: z.object({
      category: categoryEnum,
      make: z.string().min(1),
      model: z.string().min(1),
      year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
      plate: z.string().min(2),
      seats: z.number().int().min(1).max(15).default(4),
      driverId: z.string().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const vehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json({ vehicle });
  }),
);

export default router;
