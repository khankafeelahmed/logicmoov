import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { optionalAuth } from "../../middleware/auth";
import { prisma } from "../../db/prisma";
import { HttpError } from "../../lib/httpError";

const router = Router();

/**
 * POST /api/v1/payments/:bookingReference/pay
 * Mock payment processor. In production this would create a Stripe
 * PaymentIntent and confirm via webhook. Here we mark the payment PAID.
 */
router.post(
  "/:reference/pay",
  optionalAuth,
  validate({
    body: z.object({
      method: z.enum(["CARD", "CASH", "CORPORATE"]).default("CARD"),
    }),
  }),
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({
      where: { reference: req.params.reference },
      include: { payment: true },
    });
    if (!booking) throw HttpError.notFound("Booking not found");
    if (!booking.payment) throw HttpError.notFound("Payment not found for booking");
    if (booking.payment.status === "PAID") {
      throw HttpError.conflict("Booking is already paid");
    }

    const payment = await prisma.payment.update({
      where: { bookingId: booking.id },
      data: {
        status: "PAID",
        method: req.body.method,
        provider: "mock",
        providerRef: `mock_${crypto.randomBytes(6).toString("hex")}`,
      },
    });

    // Auto-confirm the booking once payment succeeds.
    if (booking.status === "PENDING") {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CONFIRMED" },
      });
    }

    res.json({ payment });
  }),
);

// GET /api/v1/payments/:reference — payment status for a booking
router.get(
  "/:reference",
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({
      where: { reference: req.params.reference },
      include: { payment: true },
    });
    if (!booking?.payment) throw HttpError.notFound("Payment not found");
    res.json({ payment: booking.payment });
  }),
);

export default router;
