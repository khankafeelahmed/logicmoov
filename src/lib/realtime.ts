"use client";

import { io, type Socket } from "socket.io-client";
import { API_ORIGIN } from "./api";

let socket: Socket | null = null;

/** Returns a shared Socket.IO connection to the API server. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_ORIGIN, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}
