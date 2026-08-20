import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { quoteFare } from "./fare.service";

const router = Router();

const quoteSchema = z.object({
  pickup: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  dropoff: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  passengers: z.object({
    adults: z.number().int().min(0).max(8),
    children: z.number().int().min(0).max(8),
    infants: z.number().int().min(0).max(8),
  }),
});

router.post(
  "/quote",
  validate({ body: quoteSchema }),
  asyncHandler(async (req, res) => {
    const payload = req.body as z.infer<typeof quoteSchema>;
    const total =
      payload.passengers.adults +
      payload.passengers.children +
      payload.passengers.infants;
    if (payload.passengers.adults < 1 || total < 1) {
      return res.status(400).json({
        error: "At least one adult passenger is required.",
      });
    }

    const quote = await quoteFare(payload);
    res.json({
      vehicle: quote.vehicle,
      distance: `${quote.distanceKm.toFixed(1)} km`,
      duration: `${quote.durationMinutes} minutes`,
      fare: `$${quote.fareCad.toFixed(2)} ${quote.currency}`,
    });
  }),
);

export default router;
