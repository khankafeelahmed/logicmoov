/**
 * Thin client for the TxIGOLD backend API.
 * Base URL is configurable via NEXT_PUBLIC_API_URL.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** Origin of the API server (without the /api/v1 path) — used for Socket.IO. */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message =
      (data && (data.error as string)) || `Request failed (${res.status})`;
    throw new ApiError(res.status, message, data?.details);
  }
  return data as T;
}

// ---------- Types ----------

export type VehicleCategory = "SEDAN" | "SUV" | "VAN" | "LUXURY";
export type TripType = "ONE_WAY" | "ROUND_TRIP";
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ASSIGNED"
  | "EN_ROUTE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface CreateBookingPayload {
  category: VehicleCategory;
  tripType: TripType;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: string;
  passengers?: number;
  luggage?: number;
  notes?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  distanceKm?: number;
}

export interface Booking {
  id: string;
  reference: string;
  status: BookingStatus;
  tripType: TripType;
  category: VehicleCategory;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: string;
  passengers: number;
  distanceKm: number;
  priceCents: number;
  currency: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  payment?: Payment | null;
}

export interface Payment {
  id: string;
  bookingId: string;
  amountCents: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  method: "CARD" | "CASH" | "CORPORATE";
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: "CUSTOMER" | "DRIVER" | "ADMIN" | "AGENT";
    phone: string | null;
    locale: string;
  };
  accessToken: string;
  refreshToken: string;
}

// ---------- Endpoints ----------

export const api = {
  createBooking(payload: CreateBookingPayload) {
    return request<{ booking: Booking }>("/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  payBooking(reference: string, method: Payment["method"] = "CARD") {
    return request<{ payment: Payment }>(
      `/payments/${encodeURIComponent(reference)}/pay`,
      { method: "POST", body: JSON.stringify({ method }) },
    );
  },

  getBooking(reference: string) {
    return request<{ booking: Booking }>(
      `/bookings/${encodeURIComponent(reference)}`,
    );
  },

  login(email: string, password: string) {
    return request<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  listBookings(
    token: string,
    params: { status?: BookingStatus; take?: number; skip?: number } = {},
  ) {
    const q = new URLSearchParams();
    if (params.status) q.set("status", params.status);
    if (params.take) q.set("take", String(params.take));
    if (params.skip) q.set("skip", String(params.skip));
    const qs = q.toString();
    return request<{
      items: Booking[];
      total: number;
      take: number;
      skip: number;
    }>(`/bookings${qs ? `?${qs}` : ""}`, { token });
  },

  updateBookingStatus(token: string, id: string, status: BookingStatus) {
    return request<{ booking: Booking }>(`/bookings/${id}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
    });
  },

  listDrivers(token: string) {
    return request<{ drivers: Driver[] }>("/drivers", { token });
  },

  listPricingRules() {
    return request<{ rules: PricingRule[] }>("/pricing/rules");
  },

  // ---- Support / chat ----
  startConversation(payload: {
    text: string;
    locale?: string;
    guestName?: string;
    guestEmail?: string;
    bookingReference?: string;
  }) {
    return request<{ conversation: Conversation }>("/support/conversations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getConversation(id: string) {
    return request<{ conversation: Conversation }>(
      `/support/conversations/${id}`,
    );
  },

  sendCustomerMessage(id: string, text: string) {
    return request<{ conversation: Conversation }>(
      `/support/conversations/${id}/messages`,
      { method: "POST", body: JSON.stringify({ text }) },
    );
  },

  requestHandoff(id: string) {
    return request<{ conversation: Conversation }>(
      `/support/conversations/${id}/handoff`,
      { method: "POST", body: JSON.stringify({}) },
    );
  },

  listAgentConversations(token: string, status?: ConversationStatus) {
    const qs = status ? `?status=${status}` : "";
    return request<{ conversations: AgentConversation[] }>(
      `/support/agent/conversations${qs}`,
      { token },
    );
  },

  claimConversation(token: string, id: string) {
    return request<{ conversation: Conversation }>(
      `/support/agent/conversations/${id}/claim`,
      { method: "POST", token, body: JSON.stringify({}) },
    );
  },

  sendAgentMessage(token: string, id: string, text: string) {
    return request<{ conversation: Conversation }>(
      `/support/agent/conversations/${id}/messages`,
      { method: "POST", token, body: JSON.stringify({ text }) },
    );
  },

  resolveConversation(token: string, id: string) {
    return request<{ conversation: Conversation }>(
      `/support/agent/conversations/${id}/resolve`,
      { method: "POST", token, body: JSON.stringify({}) },
    );
  },
};

export interface Driver {
  id: string;
  status: "OFFLINE" | "AVAILABLE" | "BUSY";
  rating: number;
  licenseNumber: string;
  user: { id: string; fullName: string; email: string; phone: string | null };
  vehicle?: {
    category: VehicleCategory;
    make: string;
    model: string;
    plate: string;
  } | null;
}

export interface PricingRule {
  id: string;
  category: VehicleCategory;
  baseFareCents: number;
  perKmCents: number;
  multiplier: number;
  currency: string;
  active: boolean;
}

export type MessageSender = "CUSTOMER" | "BOT" | "AGENT" | "SYSTEM";
export type ConversationStatus =
  | "BOT"
  | "WAITING_AGENT"
  | "WITH_AGENT"
  | "RESOLVED";

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: MessageSender;
  senderName?: string | null;
  body: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  status: ConversationStatus;
  locale: string;
  guestName?: string | null;
  guestEmail?: string | null;
  bookingReference?: string | null;
  agent?: { id: string; fullName: string } | null;
  messages: ChatMessage[];
  lastMessageAt: string;
  createdAt: string;
}

export interface AgentConversation {
  id: string;
  status: ConversationStatus;
  locale: string;
  guestName?: string | null;
  guestEmail?: string | null;
  bookingReference?: string | null;
  agent?: { id: string; fullName: string } | null;
  messages: ChatMessage[];
  lastMessageAt: string;
  _count: { messages: number };
}

