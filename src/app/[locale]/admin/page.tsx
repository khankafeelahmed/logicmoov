"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarCheck,
  Clock,
  DollarSign,
  Loader2,
  Users,
} from "lucide-react";
import { api, type Booking, type Driver } from "@/lib/api";
import { getToken, clearSession } from "@/lib/adminAuth";
import { formatCurrency } from "@/lib/pricing";
import StatusBadge from "@/components/admin/StatusBadge";

export default function AdminDashboard() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const base = `/${locale}/admin`;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [b, d] = await Promise.all([
        api.listBookings(token, { take: 100 }),
        api.listDrivers(token),
      ]);
      setBookings(b.items);
      setDrivers(d.drivers);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 401) {
        clearSession();
        router.replace(`${base}/login`);
        return;
      }
      setError("Could not load data. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, [router, base]);

  useEffect(() => {
    void load();
  }, [load]);

  const revenueCents = bookings
    .filter((b) => b.payment?.status === "PAID")
    .reduce((sum, b) => sum + b.priceCents, 0);
  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const available = drivers.filter((d) => d.status === "AVAILABLE").length;

  const cards = [
    {
      label: "Total bookings",
      value: String(bookings.length),
      icon: CalendarCheck,
    },
    { label: "Pending", value: String(pending), icon: Clock },
    {
      label: "Revenue (paid)",
      value: formatCurrency(Math.round(revenueCents / 100), "en"),
      icon: DollarSign,
    },
    {
      label: "Drivers available",
      value: `${available}/${drivers.length}`,
      icon: Users,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-900">Dashboard</h1>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-ink-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-ink-100 bg-white p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                      {card.label}
                    </span>
                    <Icon className="h-4 w-4 text-brand-500" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-ink-900">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-ink-100 bg-white">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h2 className="font-bold text-ink-900">Recent bookings</h2>
              <Link
                href={`${base}/bookings`}
                className="text-sm font-semibold text-brand-600 hover:underline"
              >
                View all
              </Link>
            </div>
            {bookings.length === 0 ? (
              <p className="p-5 text-sm text-ink-400">No bookings yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-ink-400">
                      <th className="px-5 py-3 font-semibold">Reference</th>
                      <th className="px-5 py-3 font-semibold">Route</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {bookings.slice(0, 8).map((b) => (
                      <tr key={b.id}>
                        <td className="px-5 py-3 font-mono font-semibold text-ink-900">
                          {b.reference}
                        </td>
                        <td className="px-5 py-3 text-ink-600">
                          {b.pickupAddress} → {b.dropoffAddress}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-ink-900">
                          {formatCurrency(Math.round(b.priceCents / 100), "en")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
