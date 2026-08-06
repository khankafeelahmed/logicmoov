import type { VehicleCategory } from "@prisma/client";
import { computeCityFareQuote } from "../pricing/pricing.service";

export interface FareQuoteInput {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  passengers: { adults: number; children: number; infants: number };
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function distanceKmFromCoordinates(
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number },
) {
  const earthKm = 6371;
  const dLat = toRad(dropoff.lat - pickup.lat);
  const dLng = toRad(dropoff.lng - pickup.lng);
  const lat1 = toRad(pickup.lat);
  const lat2 = toRad(dropoff.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistance = earthKm * c;
  return Math.round(directDistance * 1.22 * 10) / 10;
}

function estimateDurationMinutes(distanceKm: number) {
  // Approx city + airport transfer average.
  return Math.max(8, Math.round((distanceKm / 35) * 60));
}

function recommendVehicle(totalPassengers: number): VehicleCategory {
  if (totalPassengers <= 4) return "SEDAN";
  if (totalPassengers <= 5) return "SUV";
  return "VAN";
}

export async function quoteFare(input: FareQuoteInput) {
  const totalPassengers =
    input.passengers.adults + input.passengers.children + input.passengers.infants;
  const distanceKm = distanceKmFromCoordinates(input.pickup, input.dropoff);
  const durationMinutes = estimateDurationMinutes(distanceKm);
  const vehicle = recommendVehicle(totalPassengers);

  const cityQuote = await computeCityFareQuote({
    city: "Montreal",
    serviceType: "CITY_TAXI",
    distanceKm,
    waitingMinutes: durationMinutes,
  });

  return {
    vehicle,
    distanceKm,
    durationMinutes,
    fareCad: cityQuote.estimatedFare,
    currency: cityQuote.currency,
    totalPassengers,
  };
}
