import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { searchLocations } from "./location.service";

const router = Router();

router.get(
  "/search",
  validate({
    query: z.object({
      q: z.string().min(2),
    }),
  }),
  asyncHandler(async (req, res) => {
    const q = String(req.query.q);
    const locations = await searchLocations(q);
    res.json(locations);
  }),
);

export default router;
