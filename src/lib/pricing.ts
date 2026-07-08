import type { Locale } from "@/i18n/config";

export type VehicleId = "sedan" | "suv" | "van" | "luxury";

export const vehicleOrder: VehicleId[] = ["sedan", "suv", "van", "luxury"];

const vehicleMultiplier: Record<VehicleId, number> = {
  sedan: 1,
  suv: 1.4,
  van: 1.9,
  luxury: 2.4,
};

const BASE_FARE = 4.5; // flag drop
const PER_KM = 2.1;

/**
 * Deterministic mock distance (in km) derived from the pickup/destination text.
 * Real implementation would call a maps/distance-matrix connector.
 */
export function mockDistanceKm(pickup: string, dropoff: string): number {
  const source = `${pickup.trim().toLowerCase()}|${dropoff.trim().toLowerCase()}`;
  if (!pickup.trim() || !dropoff.trim()) return 0;
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) % 100000;
  }
  // Map hash into a plausible 4–55 km range.
  return 4 + (hash % 512) / 10;
}

export function estimatePrice(distanceKm: number, vehicle: VehicleId): number {
  if (distanceKm <= 0) return 0;
  const raw = (BASE_FARE + PER_KM * distanceKm) * vehicleMultiplier[vehicle];
  return Math.round(raw);
}

export function formatCurrency(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}
