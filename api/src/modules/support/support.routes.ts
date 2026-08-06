import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middleware/validate";
import { optionalAuth, requireAuth, requireRole } from "../../middleware/auth";
import * as support from "./support.service";

const router = Router();

const startSchema = z.object({
  text: z.string().min(1).max(2000),
  locale: z.enum(["fr", "en"]).optional(),
  guestName: z.string().max(120).optional(),
  guestEmail: z.string().email().optional(),
  bookingReference: z.string().max(40).optional(),
});

const messageSchema = z.object({ text: z.string().min(1).max(2000) });

// ---------- Customer (public / optional auth) ----------

// POST /api/v1/support/conversations — start a conversation
router.post(
  "/conversations",
  optionalAuth,
  validate({ body: startSchema }),
  asyncHandler(async (req, res) => {
    const conversation = await support.startConversation({
      ...req.body,
      customerId: req.user?.sub,
    });
    res.status(201).json({ conversation });
  }),
);

// GET /api/v1/support/conversations/:id — fetch a conversation (id acts as access key)
router.get(
  "/conversations/:id",
  asyncHandler(async (req, res) => {
    const conversation = await support.getConversation(req.params.id);
    res.json({ conversation });
  }),
);

// POST /api/v1/support/conversations/:id/messages — customer sends a message
router.post(
  "/conversations/:id/messages",
  validate({ body: messageSchema }),
  asyncHandler(async (req, res) => {
    const conversation = await support.postCustomerMessage(
      req.params.id,
      req.body.text,
    );
    res.status(201).json({ conversation });
  }),
);

// POST /api/v1/support/conversations/:id/handoff — request a human agent
router.post(
  "/conversations/:id/handoff",
  asyncHandler(async (req, res) => {
    const conversation = await support.requestHandoff(req.params.id);
    res.json({ conversation });
  }),
);

// ---------- Agent (ADMIN / AGENT) ----------

const statusEnum = z.enum(["BOT", "WAITING_AGENT", "WITH_AGENT", "RESOLVED"]);

// GET /api/v1/support/agent/conversations — list conversations
router.get(
  "/agent/conversations",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  validate({ query: z.object({ status: statusEnum.optional() }) }),
  asyncHandler(async (req, res) => {
    const conversations = await support.listConversations(
      req.query.status as never,
    );
    res.json({ conversations });
  }),
);

// POST /api/v1/support/agent/conversations/:id/claim
router.post(
  "/agent/conversations/:id/claim",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  asyncHandler(async (req, res) => {
    const conversation = await support.claimConversation(req.params.id, {
      id: req.user!.sub,
      name: req.user!.email,
    });
    res.json({ conversation });
  }),
);

// POST /api/v1/support/agent/conversations/:id/messages
router.post(
  "/agent/conversations/:id/messages",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  validate({ body: messageSchema }),
  asyncHandler(async (req, res) => {
    const conversation = await support.postAgentMessage(
      req.params.id,
      { id: req.user!.sub, name: req.user!.email },
      req.body.text,
    );
    res.json({ conversation });
  }),
);

// POST /api/v1/support/agent/conversations/:id/resolve
router.post(
  "/agent/conversations/:id/resolve",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  asyncHandler(async (req, res) => {
    const conversation = await support.resolveConversation(req.params.id);
    res.json({ conversation });
  }),
);

export default router;
