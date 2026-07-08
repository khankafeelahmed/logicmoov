"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Navigation } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  estimatePrice,
  formatCurrency,
  mockDistanceKm,
} from "@/lib/pricing";

export default function QuickEstimate({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [estimate, setEstimate] = useState<number | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const km = mockDistanceKm(pickup, dropoff);
    setEstimate(estimatePrice(km, "sedan"));
  }

  const bookHref = `/${locale}/book?pickup=${encodeURIComponent(
    pickup,
  )}&dropoff=${encodeURIComponent(dropoff)}`;

  return (
    <div className="w-full rounded-2xl border border-ink-100 bg-white p-5 shadow-xl shadow-ink-900/5 sm:p-6">
      <h2 className="text-base font-bold text-ink-900">{dict.quickBook.title}</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-500">
            {dict.quickBook.pickup}
          </span>
          <div className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 focus-within:border-brand-500">
            <MapPin className="h-4 w-4 text-brand-500" />
            <input
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder={dict.quickBook.pickupPlaceholder}
              className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-500">
            {dict.quickBook.dropoff}
          </span>
          <div className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 focus-within:border-brand-500">
            <Navigation className="h-4 w-4 text-brand-500" />
            <input
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              placeholder={dict.quickBook.dropoffPlaceholder}
              className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400"
            />
          </div>
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-ink-900 py-3 text-sm font-bold text-white transition hover:bg-ink-800"
        >
          {dict.quickBook.submit}
        </button>
      </form>

      {estimate !== null && estimate > 0 && (
        <div className="mt-4 rounded-xl bg-brand-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-600">
              {dict.quickBook.estimate}
            </span>
            <span className="text-2xl font-extrabold text-ink-900">
              {formatCurrency(estimate, locale)}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-500">{dict.quickBook.note}</p>
          <Link
            href={bookHref}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 py-2.5 text-sm font-bold text-ink-900 transition hover:bg-brand-400"
          >
            {dict.hero.ctaPrimary}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
