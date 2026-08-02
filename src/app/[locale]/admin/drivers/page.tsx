"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { api, type Driver } from "@/lib/api";
import { getToken, clearSession } from "@/lib/adminAuth";
import StatusBadge from "@/components/admin/StatusBadge";

export default function AdminDriversPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.listDrivers(token);
      setDrivers(res.drivers);
    } catch (err) {
      if ((err as { status?: number }).status === 401) {
        clearSession();
        router.replace(`/${locale}/admin/login`);
        return;
      }
      setError("Could not load drivers. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, [router, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-900">Drivers</h1>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-ink-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-ink-400">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">License</th>
                <th className="px-4 py-3 font-semibold">Vehicle</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                    No drivers found.
                  </td>
                </tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-semibold text-ink-900">
                      {d.user.fullName}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      <div>{d.user.email}</div>
                      <div className="text-xs text-ink-400">{d.user.phone ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-ink-600">
                      {d.licenseNumber}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {d.vehicle
                        ? `${d.vehicle.make} ${d.vehicle.model} (${d.vehicle.plate})`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-ink-700">
                        <Star className="h-3.5 w-3.5 fill-brand-500 text-brand-500" />
                        {d.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
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
