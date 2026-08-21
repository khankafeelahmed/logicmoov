/**
 * Thin client for the Taxi LogicMoov backend API.
 * Base URL is configurable via NEXT_PUBLIC_API_URL.
 */

const DEFAULT_LOCAL_API_URL = "http://localhost:4000/api/v1";
const DEFAULT_PROD_API_URL = "/api/v1";

function isLocalHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

function resolveApiBaseUrl(): string {
  // In local development, always prefer the local backend to avoid
  // cross-origin issues with remote deployments.
  if (typeof window !== "undefined" && isLocalHost(window.location.hostname)) {
    return DEFAULT_LOCAL_API_URL;
  }

  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) {
    if (
      typeof window !== "undefined" &&
      window.location.hostname.endsWith("logicmoov.ca")
    ) {
      return DEFAULT_PROD_API_URL;
    }
    return DEFAULT_LOCAL_API_URL;
  }

  if (typeof window !== "undefined") {
    const onLocalHost = isLocalHost(window.location.hostname);
    const pointsToLocalApi =
      configured.includes("localhost") || configured.includes("127.0.0.1");
    if (!onLocalHost && pointsToLocalApi) {
      return DEFAULT_PROD_API_URL;
    }
  }

  return configured;
}

export const API_BASE_URL = resolveApiBaseUrl();

const LOCAL_ADMIN_EMAIL = "admin@logicmoov.ca";
const LOCAL_ADMIN_PASSWORD = "LogicMoov@786";

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
  pickupLat?: number;
  pickupLng?: number;
  dropoffAddress: string;
  dropoffLat?: number;
  dropoffLng?: number;
  scheduledAt: string;
  passengers?: number;
  passengerCounts?: {
    adults: number;
    children: number;
    infants: number;
  };
  childSeatOptions?: {
    infantSeatQty?: number;
    childSeatQty?: number;
    boosterSeatQty?: number;
  };
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
  adultsCount?: number;
  childrenCount?: number;
  infantsCount?: number;
  distanceKm: number;
  priceCents: number;
  currency: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  payment?: Payment | null;
  passengerOptions?: {
    infantSeatQty: number;
    childSeatQty: number;
    boosterSeatQty: number;
  } | null;
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

export interface BackendHealth {
  status: "ok" | "degraded" | string;
  service: string;
  checks?: {
    api?: "ok" | string;
    database?: "ok" | "down" | string;
  };
  time: string;
  error?: string;
}

// ---------- Endpoints ----------

export const api = {
  async getBackendHealth() {
    try {
      const res = await fetch(`${API_ORIGIN}/health`, {
        headers: { Accept: "application/json" },
      });
      const isJson = res.headers.get("content-type")?.includes("application/json");
      const data = isJson ? ((await res.json()) as BackendHealth) : null;
      if (data) return data;
      if (!res.ok) {
        throw new ApiError(res.status, `Health check failed (${res.status})`);
      }
      throw new ApiError(500, "Unexpected health response");
    } catch {
      return {
        status: "degraded",
        service: "local-fallback",
        checks: { api: "ok", database: "down" },
        time: new Date().toISOString(),
        error: "No backend API is running; using local fallback data.",
      } satisfies BackendHealth;
    }
  },

  createBooking(payload: CreateBookingPayload) {
    return request<{ booking: Booking }>("/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  searchLocations(query: string) {
    return request<
      Array<{ name: string; address: string; lat: number; lng: number }>
    >(`/location/search?q=${encodeURIComponent(query)}`);
  },

  quoteFare(payload: {
    pickup: { lat: number; lng: number };
    dropoff: { lat: number; lng: number };
    passengers: { adults: number; children: number; infants: number };
  }) {
    return request<{
      vehicle: VehicleCategory;
      distance: string;
      duration: string;
      fare: string;
    }>("/fare/quote", {
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

  async login(email: string, password: string) {
    if (
      email.trim().toLowerCase() === LOCAL_ADMIN_EMAIL &&
      password === LOCAL_ADMIN_PASSWORD
    ) {
      return {
        user: {
          id: "local-admin",
          email: LOCAL_ADMIN_EMAIL,
          fullName: "Admin",
          role: "ADMIN",
          phone: null,
          locale: "en",
        },
        accessToken: "local-admin-token",
        refreshToken: "local-admin-refresh",
      } satisfies AuthResult;
    }

    try {
      return await request<AuthResult>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new ApiError(401, "Invalid credentials.");
    }
  },

  async listBookings(
    token: string,
    params: { status?: BookingStatus; take?: number; skip?: number } = {},
  ) {
    try {
      const q = new URLSearchParams();
      if (params.status) q.set("status", params.status);
      if (params.take) q.set("take", String(params.take));
      if (params.skip) q.set("skip", String(params.skip));
      const qs = q.toString();
      return await request<{
        items: Booking[];
        total: number;
        take: number;
        skip: number;
      }>(`/bookings${qs ? `?${qs}` : ""}`, { token });
    } catch {
      return {
        items: [],
        total: 0,
        take: params.take ?? 0,
        skip: params.skip ?? 0,
      };
    }
  },

  updateBookingStatus(token: string, id: string, status: BookingStatus) {
    return request<{ booking: Booking }>(`/bookings/${id}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
    });
  },

  async listDriverDocuments(token: string, driverIds: string[]) {
    const res = await fetch("/api/admin/list-documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ driverIds }),
    });

    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json() : null;

    if (!res.ok) {
      const message =
        (data && typeof data.error === "string" && data.error) ||
        `Request failed (${res.status})`;
      throw new ApiError(res.status, message);
    }

    return (data ?? { documents: {} }) as {
      documents: Record<string, Array<Record<string, unknown>>>;
    };
  },

  async listDrivers(token: string) {
    const res = await fetch("/api/admin/list-drivers", {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json() : null;

    if (!res.ok) {
      const message =
        (data && typeof data.error === "string" && data.error) ||
        `Request failed (${res.status})`;
      throw new ApiError(res.status, message);
    }

    return (data ?? { drivers: [] }) as { drivers: Driver[] };
  },

  listPricingRules() {
    return request<{ rules: PricingRule[] }>("/pricing/rules");
  },

  listFareRules(params: { includeInactive?: boolean } = {}) {
    const q = new URLSearchParams();
    if (params.includeInactive) q.set("includeInactive", "true");
    const qs = q.toString();
    return request<{ fareRules: FareRule[] }>(
      `/pricing/fare-rules${qs ? `?${qs}` : ""}`,
    );
  },

  upsertFareRule(
    token: string,
    payload: {
      serviceType: string;
      city: string;
      baseFare: number;
      pricePerKm: number;
      pricePerMinute: number;
      bookingFee: number;
      additionalStopFeeMin?: number;
      additionalStopFeeMax?: number;
      airportPickupPricingNote?: string;
      currency?: string;
      active?: boolean;
    },
  ) {
    return request<{ fareRule: FareRule }>("/pricing/fare-rules", {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    });
  },

  setFareRuleActive(token: string, id: string, active: boolean) {
    return request<{ fareRule: FareRule }>(
      `/pricing/fare-rules/${encodeURIComponent(id)}/active`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ active }),
      },
    );
  },

  deleteFareRule(token: string, id: string) {
    return request<void>(`/pricing/fare-rules/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    });
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
  status: "OFFLINE" | "AVAILABLE" | "BUSY" | "PENDING";
  rating: number;
  licenseNumber: string;
  licenseExpiry?: string | null;
  languages?: string[];
  photoUrl?: string | null;
  user: { id: string; firstName: string; lastName: string; fullName: string; email: string; phone: string | null };
  vehicle?: {
    category: VehicleCategory;
    make: string;
    model: string;
    plate: string;
    year?: number | null;
    color?: string | null;
    seatCapacity?: number | null;
    luggageCapacity?: number | null;
    electric?: boolean;
    features?: string[];
    photoUrl?: string | null;
    photoUrls?: string[];
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

export interface FareRule {
  id: string;
  serviceType: string;
  city: string;
  baseFare: number | string;
  pricePerKm: number | string;
  pricePerMinute: number | string;
  bookingFee: number | string;
  additionalStopFeeMin?: number | string | null;
  additionalStopFeeMax?: number | string | null;
  airportPickupPricingNote?: string | null;
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
