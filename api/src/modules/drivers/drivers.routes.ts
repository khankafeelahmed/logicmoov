import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { requireAuth, requireRole } from "../../middleware/auth";
import { prisma } from "../../db/prisma";

const router = Router();

// GET /api/v1/drivers — admin
router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validate({
    query: z.object({
      status: z.enum(["OFFLINE", "AVAILABLE", "BUSY"]).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const drivers = await prisma.driverProfile.findMany({
      where: req.query.status ? { status: req.query.status as never } : {},
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        vehicle: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ drivers });
  }),
);

// POST /api/v1/drivers — admin creates a driver profile for an existing user
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validate({
    body: z.object({
      userId: z.string().min(1),
      licenseNumber: z.string().min(3),
    }),
  }),
  asyncHandler(async (req, res) => {
    const profile = await prisma.driverProfile.create({
      data: {
        userId: req.body.userId,
        licenseNumber: req.body.licenseNumber,
      },
    });
    await prisma.user.update({
      where: { id: req.body.userId },
      data: { role: "DRIVER" },
    });
    res.status(201).json({ driver: profile });
  }),
);

// PATCH /api/v1/drivers/:id/status — driver/admin sets availability
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("DRIVER", "ADMIN"),
  validate({ body: z.object({ status: z.enum(["OFFLINE", "AVAILABLE", "BUSY"]) }) }),
  asyncHandler(async (req, res) => {
    const driver = await prisma.driverProfile.update({
      where: { id: req.params.id },
      data: { status: req.body.status, lastSeenAt: new Date() },
    });
    res.json({ driver });
  }),
);

// PATCH /api/v1/drivers/:id/location — driver pushes GPS position
router.patch(
  "/:id/location",
  requireAuth,
  requireRole("DRIVER", "ADMIN"),
  validate({
    body: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  }),
  asyncHandler(async (req, res) => {
    const driver = await prisma.driverProfile.update({
      where: { id: req.params.id },
      data: {
        currentLat: req.body.lat,
        currentLng: req.body.lng,
        lastSeenAt: new Date(),
      },
    });
    res.json({ driver });
  }),
);

export default router;
