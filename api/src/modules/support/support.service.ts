import type { ConversationStatus, MessageSender } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { HttpError } from "../../lib/httpError";
import { emitToAgents, emitToConversation } from "../../realtime";
import { generateAssistantReply, type ChatTurn } from "./ai.service";

const conversationInclude = {
  messages: { orderBy: { createdAt: "asc" } as const },
  agent: { select: { id: true, fullName: true } },
} as const;

async function addMessage(
  conversationId: string,
  sender: MessageSender,
  body: string,
  senderName?: string,
) {
  const message = await prisma.message.create({
    data: { conversationId, sender, body, senderName },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: message.createdAt },
  });
  emitToConversation(conversationId, "message", message);
  return message;
}

async function setStatus(conversationId: string, status: ConversationStatus) {
  const conversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: { status },
    include: conversationInclude,
  });
  emitToConversation(conversationId, "conversation", {
    id: conversation.id,
    status: conversation.status,
    agent: conversation.agent,
  });
  return conversation;
}

async function runAssistant(conversationId: string, locale: string) {
  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  const turns: ChatTurn[] = history.map((m) => ({ sender: m.sender, body: m.body }));
  const lastCustomer = [...history].reverse().find((m) => m.sender === "CUSTOMER");

  const { reply } = await generateAssistantReply({
    locale,
    text: lastCustomer?.body ?? "",
    history: turns,
  });
  await addMessage(conversationId, "BOT", reply);
}

export async function startConversation(input: {
  locale?: string;
  text: string;
  guestName?: string;
  guestEmail?: string;
  bookingReference?: string;
  customerId?: string;
}) {
  const locale = input.locale === "en" ? "en" : "fr";
  const conversation = await prisma.conversation.create({
    data: {
      locale,
      status: "BOT",
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      bookingReference: input.bookingReference,
      customerId: input.customerId ?? null,
    },
  });

  await addMessage(conversation.id, "CUSTOMER", input.text, input.guestName);
  await runAssistant(conversation.id, locale);

  emitToAgents("queue:new", {
    id: conversation.id,
    status: "BOT",
    guestName: input.guestName ?? null,
  });

  return getConversation(conversation.id);
}

export async function getConversation(id: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: conversationInclude,
  });
  if (!conversation) throw HttpError.notFound("Conversation not found");
  return conversation;
}

export async function postCustomerMessage(id: string, text: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) throw HttpError.notFound("Conversation not found");
  if (conversation.status === "RESOLVED") {
    throw HttpError.badRequest("This conversation is resolved");
  }

  await addMessage(id, "CUSTOMER", text, conversation.guestName ?? undefined);

  // The bot only replies while it owns the conversation.
  if (conversation.status === "BOT") {
    await runAssistant(id, conversation.locale);
  } else {
    // Notify agents that a customer replied in a queued/active thread.
    emitToAgents("queue:update", { id, status: conversation.status });
  }

  return getConversation(id);
}

export async function requestHandoff(id: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) throw HttpError.notFound("Conversation not found");
  if (conversation.status === "WITH_AGENT") return getConversation(id);

  const systemMsg =
    conversation.locale === "en"
      ? "You're being connected to a human agent. Please hold on."
      : "Vous allez être mis en relation avec un agent. Un instant s'il vous plaît.";
  await addMessage(id, "SYSTEM", systemMsg);
  await setStatus(id, "WAITING_AGENT");
  emitToAgents("queue:waiting", { id, status: "WAITING_AGENT" });

  return getConversation(id);
}

// ---------- Agent-facing ----------

export async function listConversations(status?: ConversationStatus) {
  return prisma.conversation.findMany({
    where: status ? { status } : {},
    include: {
      agent: { select: { id: true, fullName: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });
}

export async function claimConversation(
  id: string,
  agent: { id: string; name: string },
) {
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) throw HttpError.notFound("Conversation not found");

  await prisma.conversation.update({
    where: { id },
    data: { agentId: agent.id, status: "WITH_AGENT" },
  });

  const msg =
    conversation.locale === "en"
      ? `${agent.name} has joined the chat.`
      : `${agent.name} a rejoint la conversation.`;
  await addMessage(id, "SYSTEM", msg);
  await setStatus(id, "WITH_AGENT");
  emitToAgents("queue:update", { id, status: "WITH_AGENT", agentId: agent.id });

  return getConversation(id);
}

export async function postAgentMessage(
  id: string,
  agent: { id: string; name: string },
  text: string,
) {
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) throw HttpError.notFound("Conversation not found");
  await addMessage(id, "AGENT", text, agent.name);
  return getConversation(id);
}

export async function resolveConversation(id: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) throw HttpError.notFound("Conversation not found");

  const msg =
    conversation.locale === "en"
      ? "This conversation has been marked as resolved."
      : "Cette conversation a été marquée comme résolue.";
  await addMessage(id, "SYSTEM", msg);
  await setStatus(id, "RESOLVED");
  emitToAgents("queue:update", { id, status: "RESOLVED" });

  return getConversation(id);
}
