import type { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { env } from "./config/env";
import { logger } from "./lib/logger";

let io: SocketServer | null = null;

/**
 * Initializes the Socket.IO gateway on the given HTTP server.
 * Clients join per-conversation rooms; agents join a shared "agents" room
 * to receive queue notifications.
 */
export function initRealtime(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: { origin: env.corsOrigins, credentials: true },
  });

  io.on("connection", (socket) => {
    // Customer widget joins its conversation room.
    socket.on("conversation:join", (conversationId: string) => {
      if (typeof conversationId === "string" && conversationId) {
        socket.join(roomFor(conversationId));
      }
    });

    socket.on("conversation:leave", (conversationId: string) => {
      if (typeof conversationId === "string" && conversationId) {
        socket.leave(roomFor(conversationId));
      }
    });

    // Agent console joins the shared queue room.
    socket.on("agents:join", () => {
      socket.join("agents");
    });
  });

  logger.info("Realtime (Socket.IO) gateway initialized");
  return io;
}

function roomFor(conversationId: string): string {
  return `conv:${conversationId}`;
}

/** Emits an event to everyone watching a conversation. */
export function emitToConversation(
  conversationId: string,
  event: string,
  payload: unknown,
): void {
  io?.to(roomFor(conversationId)).emit(event, payload);
}

/** Emits an event to all connected support agents. */
export function emitToAgents(event: string, payload: unknown): void {
  io?.to("agents").emit(event, payload);
}
