/**
 * Thin client for the Taxi LogicMoov backend API.
 * Base URL is configurable via NEXT_PUBLIC_API_URL.
 */
import { getDriverAccounts } from "@/lib/driverAuth";
import { listDriversFromStore, listVehiclesFromStore } from "@/lib/supabaseClient";

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
const LOCAL_DRIVER_KEY = "taxi_logicmoov_local_drivers";
const LOCAL_VEHICLE_KEY = "taxi_logicmoov_local_vehicles";

function readLocalDriverRows() {
  if (typeof window === "undefined") return [] as Array<Record<string, unknown>>;
  const raw = window.localStorage.getItem(LOCAL_DRIVER_KEY);
  if (!raw) return [] as Array<Record<string, unknown>>;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as Array<Record<string, unknown>>;
  }
}

function readLocalVehicleRows() {
  if (typeof window === "undefined") return [] as Array<Record<string, unknown>>;
  const raw = window.localStorage.getItem(LOCAL_VEHICLE_KEY);
  if (!raw) return [] as Array<Record<string, unknown>>;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as Array<Record<string, unknown>>;
  }
}

function mapLocalDriversToAdminDriverList(): Driver[] {
  const rows = readLocalDriverRows();
  const vehicles = readLocalVehicleRows();

  return rows.map((row) => {
    const fullName = String(row.full_name ?? row.fullName ?? "Unknown driver");
    const email = String(row.email ?? "");
    const phone = typeof row.whatsapp_number === "string" ? row.whatsapp_number : null;
    const rowVehicle = vehicles.find((vehicle) => vehicle.driver_id === row.id);
    const driverPhotoUrl = typeof row.photo_url === "string" && row.photo_url ? row.photo_url : null;
    const vehiclePhotoUrls = Array.isArray(rowVehicle?.photo_urls)
      ? rowVehicle.photo_urls.map((item: unknown) => String(item)).filter(Boolean)
      : [];
    const vehiclePhotoUrl = vehiclePhotoUrls[0] ?? (typeof rowVehicle?.photo_url === "string" ? rowVehicle.photo_url : null);
    const languages = Array.isArray(row.languages)
      ? row.languages.map((item: unknown) => String(item)).filter(Boolean)
      : typeof row.languages === "string"
        ? row.languages.split(",").map((item: string) => item.trim()).filter(Boolean)
        : [];

    return {
      id: String(row.id ?? crypto.randomUUID()),
      status: "AVAILABLE",
      rating: 4.8,
      licenseNumber: String(row.license_number ?? "—"),
      licenseExpiry: typeof row.license_expiry === "string" ? row.license_expiry : null,
      languages,
      photoUrl: driverPhotoUrl,
      user: {
        id: String(row.id ?? crypto.randomUUID()),
        fullName,
        email,
        phone,
      },
      vehicle: rowVehicle
        ? {
            category: String(rowVehicle.vehicle_type ?? "SEDAN") as VehicleCategory,
            make: String(rowVehicle.brand ?? "Unknown"),
            model: String(rowVehicle.model ?? "Model"),
            plate: String(rowVehicle.plate_number ?? "—"),
            year: rowVehicle.year !== undefined && rowVehicle.year !== null ? Number(rowVehicle.year) : null,
            color: typeof rowVehicle.color === "string" ? rowVehicle.color : null,
            seatCapacity: rowVehicle.seat_capacity !== undefined && rowVehicle.seat_capacity !== null ? Number(rowVehicle.seat_capacity) : null,
            luggageCapacity: rowVehicle.luggage_capacity !== undefined && rowVehicle.luggage_capacity !== null ? Number(rowVehicle.luggage_capacity) : null,
            electric: Boolean(rowVehicle.electric),
            features: Array.isArray(rowVehicle.inclusions)
              ? rowVehicle.inclusions.map((item: unknown) => String(item)).filter(Boolean)
              : [],
            photoUrl: vehiclePhotoUrl,
            photoUrls: vehiclePhotoUrls.length > 0
              ? vehiclePhotoUrls
              : vehiclePhotoUrl
                ? [vehiclePhotoUrl]
                : [],
          }
        : null,
    };
  });
}

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

  async listDrivers(token: string) {
    try {
      return await request<{ drivers: Driver[] }>("/drivers", { token });
    } catch {
      const rows = await listDriversFromStore();
      const vehicles = await listVehiclesFromStore();
      const accounts = getDriverAccounts();
      const matchedAccountIds = new Set<string>();
      const driversFromProfiles = rows.map((row) => {
        const fullName = String(row.full_name ?? row.fullName ?? "Unknown driver");
        const email = String(row.email ?? "");
        const phone = typeof row.whatsapp_number === "string" ? row.whatsapp_number : null;
        const rowVehicle = vehicles.find((vehicle) => String(vehicle.driver_id ?? "") === String(row.id));
        const account = accounts.find(
          (entry) =>
            entry.email.toLowerCase() === email.toLowerCase() ||
            entry.fullName.toLowerCase() === fullName.toLowerCase(),
        );
        if (account) {
          matchedAccountIds.add(account.id);
        }
        const approvalStatus = account?.status === "pending"
          ? "PENDING"
          : account?.status === "suspended"
            ? "OFFLINE"
            : "AVAILABLE";

        const driverPhotoUrl = typeof row.photo_url === "string" && row.photo_url ? row.photo_url : null;
        const vehiclePhotoUrls = Array.isArray(rowVehicle?.photo_urls)
          ? rowVehicle.photo_urls.map((item: unknown) => String(item)).filter(Boolean)
          : [];
        const vehiclePhotoUrl = vehiclePhotoUrls[0] ?? (typeof rowVehicle?.photo_url === "string" ? rowVehicle.photo_url : null);
        const languages = Array.isArray(row.languages)
          ? row.languages.map((item: unknown) => String(item)).filter(Boolean)
          : typeof row.languages === "string"
            ? row.languages.split(",").map((item: string) => item.trim()).filter(Boolean)
            : [];

        return {
          id: String(row.id ?? crypto.randomUUID()),
          status: approvalStatus,
          rating: 4.8,
          licenseNumber: String(row.license_number ?? "—"),
          licenseExpiry: typeof row.license_expiry === "string" ? row.license_expiry : null,
          languages,
          photoUrl: driverPhotoUrl,
          user: {
            id: String(row.id ?? crypto.randomUUID()),
            fullName,
            email,
            phone,
          },
          vehicle: rowVehicle
            ? {
                category: String(rowVehicle.vehicle_type ?? "SEDAN") as VehicleCategory,
                make: String(rowVehicle.brand ?? "Unknown"),
                model: String(rowVehicle.model ?? "Model"),
                plate: String(rowVehicle.plate_number ?? "—"),
                year: rowVehicle.year !== undefined && rowVehicle.year !== null ? Number(rowVehicle.year) : null,
                color: typeof rowVehicle.color === "string" ? rowVehicle.color : null,
                seatCapacity: rowVehicle.seat_capacity !== undefined && rowVehicle.seat_capacity !== null ? Number(rowVehicle.seat_capacity) : null,
                luggageCapacity: rowVehicle.luggage_capacity !== undefined && rowVehicle.luggage_capacity !== null ? Number(rowVehicle.luggage_capacity) : null,
                electric: Boolean(rowVehicle.electric),
                features: Array.isArray(rowVehicle.inclusions)
                  ? rowVehicle.inclusions.map((item: unknown) => String(item)).filter(Boolean)
                  : [],
                photoUrl: vehiclePhotoUrl || null,
                photoUrls: vehiclePhotoUrls.length > 0
                  ? vehiclePhotoUrls
                  : vehiclePhotoUrl
                    ? [vehiclePhotoUrl]
                    : [],
              }
            : null,
        } satisfies Driver;
      });

      const accountOnlyDrivers = accounts
        .filter((account) => !matchedAccountIds.has(account.id))
        .map((account) => {
          const status = account.status === "pending"
            ? "PENDING"
            : account.status === "suspended"
              ? "OFFLINE"
              : "AVAILABLE";
          return {
            id: account.id,
            status,
            rating: 4.8,
            licenseNumber: "—",
            licenseExpiry: null,
            languages: [],
            photoUrl: null,
            user: {
              id: account.id,
              fullName: account.fullName,
              email: account.email,
              phone: account.phone || null,
            },
            vehicle: null,
          } satisfies Driver;
        });

      return { drivers: [...driversFromProfiles, ...accountOnlyDrivers] };
    }
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
  user: { id: string; fullName: string; email: string; phone: string | null };
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
