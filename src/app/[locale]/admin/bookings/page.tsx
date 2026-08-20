"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  api,
  type BackendHealth,
  type Booking,
  type BookingStatus,
} from "@/lib/api";
import { getToken, clearSession } from "@/lib/adminAuth";
import { formatCurrency } from "@/lib/pricing";
import StatusBadge from "@/components/admin/StatusBadge";

const NEXT_STATUS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["EN_ROUTE", "CANCELLED"],
  EN_ROUTE: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const ALL_STATUSES: (BookingStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "ASSIGNED",
  "EN_ROUTE",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export default function AdminBookingsPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | "ALL">("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    setHealthError(null);
    try {
      const backendHealth = await api.getBackendHealth();
      setHealth(backendHealth);
    } catch {
      setHealth(null);
      setHealthError("Backend health check failed.");
    }
    try {
      const res = await api.listBookings(token, {
        take: 100,
        status: filter === "ALL" ? undefined : filter,
      });
      setBookings(res.items);
    } catch (err) {
      if ((err as { status?: number }).status === 401) {
        clearSession();
        router.replace(`/${locale}/admin/login`);
        return;
      }
      setError("Could not load bookings. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, [filter, router, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(id: string, status: BookingStatus) {
    const token = getToken();
    if (!token) return;
    setUpdatingId(id);
    try {
      const { booking } = await api.updateBookingStatus(token, id, status);
      setBookings((prev) => prev.map((b) => (b.id === id ? booking : b)));
    } catch {
      setError("Failed to update booking status.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink-900">Bookings</h1>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as BookingStatus | "ALL")}
            className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-700"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All statuses" : s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
      {healthError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          API/DB health: unavailable. {healthError}
        </div>
      ) : health ? (
        health.status === "ok" && health.checks?.database === "ok" ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            API/DB health: online.
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            API/DB health: degraded
            {health.error ? ` — ${health.error}` : "."}
          </div>
        )
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-ink-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-ink-400">
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Route</th>
                <th className="px-4 py-3 font-semibold">Scheduled</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Price</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-400">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="align-top">
                    <td className="px-4 py-3 font-mono font-semibold text-ink-900">
                      {b.reference}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      <div>{b.contactName}</div>
                      <div className="text-xs text-ink-400">{b.contactPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {b.pickupAddress}
                      <br />
                      <span className="text-ink-400">→ {b.dropoffAddress}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {new Date(b.scheduledAt).toLocaleString("en-CA")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.payment?.status ?? "PENDING"} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-ink-900">
                      {formatCurrency(Math.round(b.priceCents / 100), "en")}
                    </td>
                    <td className="px-4 py-3">
                      {NEXT_STATUS[b.status].length === 0 ? (
                        <span className="text-xs text-ink-400">—</span>
                      ) : (
                        <select
                          disabled={updatingId === b.id}
                          value=""
                          onChange={(e) =>
                            e.target.value &&
                            void changeStatus(b.id, e.target.value as BookingStatus)
                          }
                          className="rounded-lg border border-ink-200 px-2 py-1 text-xs text-ink-700 disabled:opacity-50"
                        >
                          <option value="">Change…</option>
                          {NEXT_STATUS[b.status].map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
