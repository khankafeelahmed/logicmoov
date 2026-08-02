import type { VehicleCategory } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { cacheGet, cacheSet } from "../../lib/redis";

/** Default pricing used when no DB rule exists for a category. */
const DEFAULTS: Record<
  VehicleCategory,
  { baseFareCents: number; perKmCents: number; multiplier: number; currency: string }
> = {
  SEDAN: { baseFareCents: 450, perKmCents: 180, multiplier: 1, currency: "CAD" },
  SUV: { baseFareCents: 600, perKmCents: 220, multiplier: 1, currency: "CAD" },
  VAN: { baseFareCents: 800, perKmCents: 260, multiplier: 1, currency: "CAD" },
  LUXURY: { baseFareCents: 1080, perKmCents: 340, multiplier: 1, currency: "CAD" },
};

const VARIABLE_RULES: Record<
  VehicleCategory,
  {
    perMinuteCents: number;
    waitingFareCents: number;
    bookingFeeCents: number;
  }
> = {
  SEDAN: { perMinuteCents: 70, waitingFareCents: 70, bookingFeeCents: 200 },
  SUV: { perMinuteCents: 90, waitingFareCents: 90, bookingFeeCents: 250 },
  VAN: { perMinuteCents: 110, waitingFareCents: 110, bookingFeeCents: 300 },
  LUXURY: { perMinuteCents: 130, waitingFareCents: 130, bookingFeeCents: 400 },
};

export const CATEGORIES: VehicleCategory[] = ["SEDAN", "SUV", "VAN", "LUXURY"];

/**
 * Deterministic mock distance (km) from address text.
 * Replace with a Google Maps Distance Matrix connector in production.
 */
export function mockDistanceKm(pickup: string, dropoff: string): number {
  const source = `${pickup.trim().toLowerCase()}|${dropoff.trim().toLowerCase()}`;
  if (!pickup.trim() || !dropoff.trim()) return 0;
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) % 100000;
  }
  return Math.round((4 + (hash % 512) / 10) * 10) / 10;
}

async function getRule(category: VehicleCategory) {
  const rule = await prisma.pricingRule.findUnique({ where: { category } });
  if (rule && rule.active) {
    return {
      baseFareCents: rule.baseFareCents,
      perKmCents: rule.perKmCents,
      multiplier: rule.multiplier,
      currency: rule.currency,
    };
  }
  return { ...DEFAULTS[category], currency: "CAD" };
}

const GST_RATE = 0.05;
const QST_RATE = 0.09975;

export interface Quote {
  category: VehicleCategory;
  distanceKm: number;
  durationMinutes: number;
  waitingMinutes: number;
  netCents: number;
  taxCents: number;
  priceCents: number;
  currency: string;
}

function estimateDurationMinutes(distanceKm: number) {
  return Math.max(10, Math.round(distanceKm * 1.5));
}

function roundCents(value: number) {
  return Math.round(value);
}

export async function computeQuote(
  category: VehicleCategory,
  distanceKm: number,
  durationMinutes?: number,
  waitingMinutes = 0,
): Promise<Quote> {
  const rule = await getRule(category);
  const variable = VARIABLE_RULES[category];
  const minutes = durationMinutes ?? estimateDurationMinutes(distanceKm);

  const net =
    rule.baseFareCents +
    rule.perKmCents * distanceKm +
    variable.perMinuteCents * minutes +
    variable.waitingFareCents * waitingMinutes +
    variable.bookingFeeCents;

  const netCents = roundCents(net * rule.multiplier);
  const gstCents = roundCents(netCents * GST_RATE);
  const qstCents = roundCents((netCents + gstCents) * QST_RATE);

  return {
    category,
    distanceKm,
    durationMinutes: minutes,
    waitingMinutes,
    netCents,
    taxCents: gstCents + qstCents,
    priceCents: netCents + gstCents + qstCents,
    currency: rule.currency,
  };
}

/** Quotes for every vehicle category, using a cache keyed by distance. */
export async function quoteAllCategories(
  distanceKm: number,
  durationMinutes?: number,
  waitingMinutes = 0,
): Promise<Quote[]> {
  const cacheKey = `quote:${distanceKm.toFixed(1)}:${durationMinutes ?? "auto"}:${waitingMinutes}`;
  const cached = await cacheGet<Quote[]>(cacheKey);
  if (cached) return cached;

  const quotes = await Promise.all(
    CATEGORIES.map((c) => computeQuote(c, distanceKm, durationMinutes, waitingMinutes)),
  );
  await cacheSet(cacheKey, quotes, 300);
  return quotes;
}
