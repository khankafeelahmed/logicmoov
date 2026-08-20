import crypto from "node:crypto";
import type { BookingSource, VehicleCategory } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { HttpError } from "../../lib/httpError";
import * as ratesService from "../rates/rates.service";

function generateReference(): string {
  return `QR-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export interface SupplierBookingInput {
  source: BookingSource; // BOOKING_COM | HOLIDAY_TAXIS | VIATOR | GET_YOUR_GUIDE | EXPEDIA
  externalRef: string; // the OTA's own booking reference
  originZone: string;
  destinationZone: string;
  category: VehicleCategory;
  scheduledAt: string; // ISO
  passengers: number;
  luggage: number;
  flightNumber?: string;
  notes?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  agreedPriceCents: number; // the price the OTA already quoted its customer
  currency: string;
  // Free-text fallback addresses (zones are the primary key for rate lookup,
  // but drivers still need somewhere to actually go).
  pickupAddress: string;
  dropoffAddress: string;
}

/**
 * Accepts a booking that arrives already priced by an OTA/consolidator.
 * Unlike the public booking flow, this does NOT run the live pricing engine
 * — it validates the OTA's price against your own published rate card and
 * rejects (for manual review) anything that doesn't match a rate you filed.
 */
export async function ingestSupplierBooking(input: SupplierBookingInput) {
  const rate = await ratesService.findActiveRate(
    input.originZone,
    input.destinationZone,
    input.category,
  );

  // Guard against stale rate cards: if what the OTA thinks you charge no
  // longer matches what you've published, don't silently honor either
  // number — surface it so a human confirms before the booking is accepted.
  if (rate.priceCents !== input.agreedPriceCents) {
    throw HttpError.conflict(
      `Price mismatch for ${input.originZone} -> ${input.destinationZone} (${input.category}): ` +
        `published rate is ${rate.priceCents} ${rate.currency}, supplier sent ${input.agreedPriceCents} ${input.currency}`,
    );
  }

  const booking = await prisma.booking.create({
    data: {
      reference: generateReference(),
      source: input.source,
      externalRef: input.externalRef,
      tripType: "ONE_WAY",
      category: input.category,
      pickupAddress: input.pickupAddress,
      dropoffAddress: input.dropoffAddress,
      scheduledAt: new Date(input.scheduledAt),
      passengers: input.passengers,
      luggage: input.luggage,
      flightNumber: input.flightNumber,
      notes: input.notes,
      distanceKm: 0, // not meaningful for a zone-priced supplier booking
      priceCents: input.agreedPriceCents,
      currency: input.currency,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
    },
  });

  return booking;
}

export interface CancelSupplierBookingInput {
  externalRef: string;
  source: BookingSource;
  reason?: string;
}

export async function cancelSupplierBooking(input: CancelSupplierBookingInput) {
  const booking = await prisma.booking.findFirst({
    where: { externalRef: input.externalRef, source: input.source },
  });
  if (!booking) {
    throw HttpError.notFound(
      `No booking found for ${input.source} ref ${input.externalRef}`,
    );
  }
  return prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancelledBy: "SUPPLIER",
      cancelledReason: input.reason,
    },
  });
}
