"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api, type FareRule } from "@/lib/api";
import { clearSession, getToken } from "@/lib/adminAuth";

type FareForm = {
  serviceType: string;
  city: string;
  baseFare: number;
  pricePerKm: number;
  pricePerMinute: number;
  bookingFee: number;
  additionalStopFeeMin: number;
  additionalStopFeeMax: number;
  airportPickupPricingNote: string;
  currency: string;
  active: boolean;
};

const DEFAULT_FORM: FareForm = {
  serviceType: "CITY_TAXI",
  city: "Montreal",
  baseFare: 4.1,
  pricePerKm: 2.05,
  pricePerMinute: 0.77,
  bookingFee: 2,
  additionalStopFeeMin: 3,
  additionalStopFeeMax: 5,
  airportPickupPricingNote: "Separate fixed pricing",
  currency: "CAD",
  active: true,
};

function asNumber(value: number | string | null | undefined, fallback = 0) {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function AdminFaresPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fareRules, setFareRules] = useState<FareRule[]>([]);
  const [form, setForm] = useState<FareForm>(DEFAULT_FORM);

  const selectedKey = useMemo(
    () => `${form.serviceType}::${form.city}`.toLowerCase(),
    [form.serviceType, form.city],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.listFareRules({ includeInactive: true });
      setFareRules(res.fareRules);
    } catch (err) {
      if ((err as { status?: number }).status === 401) {
        clearSession();
        router.replace(`/${locale}/admin/login`);
        return;
      }
      setError("Could not load fare rules. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, [router, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  function editRule(rule: FareRule) {
    setSuccess(null);
    setForm({
      serviceType: rule.serviceType,
      city: rule.city,
      baseFare: asNumber(rule.baseFare),
      pricePerKm: asNumber(rule.pricePerKm),
      pricePerMinute: asNumber(rule.pricePerMinute),
      bookingFee: asNumber(rule.bookingFee),
      additionalStopFeeMin: asNumber(rule.additionalStopFeeMin, 0),
      additionalStopFeeMax: asNumber(rule.additionalStopFeeMax, 0),
      airportPickupPricingNote: rule.airportPickupPricingNote ?? "",
      currency: rule.currency,
      active: rule.active,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    const token = getToken();
    if (!token) return;
    try {
      await api.upsertFareRule(token, {
        serviceType: form.serviceType.trim(),
        city: form.city.trim(),
        baseFare: form.baseFare,
        pricePerKm: form.pricePerKm,
        pricePerMinute: form.pricePerMinute,
        bookingFee: form.bookingFee,
        additionalStopFeeMin: form.additionalStopFeeMin,
        additionalStopFeeMax: form.additionalStopFeeMax,
        airportPickupPricingNote: form.airportPickupPricingNote.trim() || undefined,
        currency: form.currency.trim().toUpperCase(),
        active: form.active,
      });
      setSuccess("Fare rule saved.");
      await load();
    } catch (err) {
      if ((err as { status?: number }).status === 401) {
        clearSession();
        router.replace(`/${locale}/admin/login`);
        return;
      }
      setError("Could not save fare rule.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(rule: FareRule) {
    const token = getToken();
    if (!token) return;
    setActionId(rule.id);
    setError(null);
    setSuccess(null);
    try {
      await api.setFareRuleActive(token, rule.id, !rule.active);
      setSuccess(rule.active ? "Fare rule deactivated." : "Fare rule activated.");
      await load();
    } catch (err) {
      if ((err as { status?: number }).status === 401) {
        clearSession();
        router.replace(`/${locale}/admin/login`);
        return;
      }
      setError("Could not update fare rule status.");
    } finally {
      setActionId(null);
    }
  }

  async function removeRule(rule: FareRule) {
    const ok = window.confirm(
      `Delete fare rule ${rule.serviceType} / ${rule.city}? This cannot be undone.`,
    );
    if (!ok) return;
    const token = getToken();
    if (!token) return;
    setActionId(rule.id);
    setError(null);
    setSuccess(null);
    try {
      await api.deleteFareRule(token, rule.id);
      setSuccess("Fare rule deleted.");
      if (`${rule.serviceType}::${rule.city}`.toLowerCase() === selectedKey) {
        setForm(DEFAULT_FORM);
      }
      await load();
    } catch (err) {
      if ((err as { status?: number }).status === 401) {
        clearSession();
        router.replace(`/${locale}/admin/login`);
        return;
      }
      setError("Could not delete fare rule.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-900">Fare Rules</h1>
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
      {success && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <form
          onSubmit={save}
          className="space-y-4 rounded-2xl border border-ink-100 bg-white p-5"
        >
          <h2 className="text-lg font-bold text-ink-900">Create / Update Rule</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-ink-600">Service Type</span>
              <input
                required
                value={form.serviceType}
                onChange={(e) => setForm((p) => ({ ...p, serviceType: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink-600">City</span>
              <input
                required
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink-600">Base Fare (CAD)</span>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.baseFare}
                onChange={(e) =>
                  setForm((p) => ({ ...p, baseFare: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink-600">Distance Rate (CAD/km)</span>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.pricePerKm}
                onChange={(e) =>
                  setForm((p) => ({ ...p, pricePerKm: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink-600">Waiting Rate (CAD/min)</span>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.pricePerMinute}
                onChange={(e) =>
                  setForm((p) => ({ ...p, pricePerMinute: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink-600">Booking Fee (CAD)</span>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.bookingFee}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bookingFee: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink-600">Additional Stop Min (CAD)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.additionalStopFeeMin}
                onChange={(e) =>
                  setForm((p) => ({ ...p, additionalStopFeeMin: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink-600">Additional Stop Max (CAD)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.additionalStopFeeMax}
                onChange={(e) =>
                  setForm((p) => ({ ...p, additionalStopFeeMax: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-ink-600">Airport Pickup Pricing Note</span>
              <input
                value={form.airportPickupPricingNote}
                onChange={(e) =>
                  setForm((p) => ({ ...p, airportPickupPricingNote: e.target.value }))
                }
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-ink-600">Currency</span>
              <input
                required
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
              />
              Active
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save fare rule
          </button>
        </form>

        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-ink-900">Current Rules</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-ink-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : fareRules.length === 0 ? (
            <p className="text-sm text-ink-400">No fare rules found.</p>
          ) : (
            <div className="space-y-2">
              {fareRules.map((rule) => {
                const key = `${rule.serviceType}::${rule.city}`.toLowerCase();
                const active = key === selectedKey;
                return (
                  <div
                    key={`${rule.serviceType}-${rule.city}`}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                      active
                        ? "border-brand-300 bg-brand-50"
                        : "border-ink-100 bg-white hover:bg-ink-50"
                    }`}
                  >
                    <p className="font-semibold text-ink-900">
                      {rule.serviceType} · {rule.city}
                    </p>
                    <p className="text-xs text-ink-500">
                      Base ${asNumber(rule.baseFare).toFixed(2)} · Km $
                      {asNumber(rule.pricePerKm).toFixed(2)} · Min $
                      {asNumber(rule.pricePerMinute).toFixed(2)} · Booking $
                      {asNumber(rule.bookingFee).toFixed(2)}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-400">
                      {rule.active ? "Active" : "Inactive"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => editRule(rule)}
                        className="rounded-md border border-ink-200 px-2 py-1 text-xs font-medium text-ink-700 hover:bg-ink-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={actionId === rule.id}
                        onClick={() => void toggleActive(rule)}
                        className="rounded-md border border-amber-200 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                      >
                        {actionId === rule.id ? "Working..." : rule.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        disabled={actionId === rule.id}
                        onClick={() => void removeRule(rule)}
                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
