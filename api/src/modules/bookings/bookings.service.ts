import type { BookingStatus, Prisma, VehicleCategory } from "@prisma/client";
import crypto from "node:crypto";
import { prisma } from "../../db/prisma";
import { HttpError } from "../../lib/httpError";
import { computeQuote, mockDistanceKm } from "../pricing/pricing.service";

function generateReference(): string {
  return `QR-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export interface CreateBookingInput {
  tripType: "ONE_WAY" | "ROUND_TRIP";
  category: VehicleCategory;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffAddress: string;
  dropoffLat?: number;
  dropoffLng?: number;
  scheduledAt: string; // ISO
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
  durationMinutes?: number;
  waitingMinutes?: number;
}

function estimateDistanceKmFromCoordinates(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(dropoffLat - pickupLat);
  const dLng = toRad(dropoffLng - pickupLng);
  const lat1 = toRad(pickupLat);
  const lat2 = toRad(dropoffLat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistance = earthKm * c;

  // Simple road-distance approximation from straight-line distance.
  return Math.round(directDistance * 1.22 * 10) / 10;
}

export async function createBooking(
  input: CreateBookingInput,
  customerId?: string,
) {
  const adults = input.passengerCounts?.adults ?? input.passengers ?? 1;
  const children = input.passengerCounts?.children ?? 0;
  const infants = input.passengerCounts?.infants ?? 0;
  const passengers = adults + children + infants;

  if (adults < 1) {
    throw HttpError.badRequest("At least one adult passenger is required");
  }
  if (passengers < 1 || passengers > 8) {
    throw HttpError.badRequest("Passenger count must be between 1 and 8");
  }

  const infantSeatQty = input.childSeatOptions?.infantSeatQty ?? 0;
  const childSeatQty = input.childSeatOptions?.childSeatQty ?? 0;
  const boosterSeatQty = input.childSeatOptions?.boosterSeatQty ?? 0;

  const distanceKm =
    input.distanceKm ??
    (input.pickupLat !== undefined &&
    input.pickupLng !== undefined &&
    input.dropoffLat !== undefined &&
    input.dropoffLng !== undefined
      ? estimateDistanceKmFromCoordinates(
          input.pickupLat,
          input.pickupLng,
          input.dropoffLat,
          input.dropoffLng,
        )
      : mockDistanceKm(input.pickupAddress, input.dropoffAddress));

  const quote = await computeQuote(
    input.category,
    distanceKm,
    input.durationMinutes,
    input.waitingMinutes ?? 0,
  );
  const priceCents =
    input.tripType === "ROUND_TRIP" ? quote.priceCents * 2 : quote.priceCents;

  const booking = await prisma.booking.create({
    data: {
      reference: generateReference(),
      tripType: input.tripType,
      category: input.category,
      customerId: customerId ?? null,
      pickupAddress: input.pickupAddress,
      pickupLat: input.pickupLat,
      pickupLng: input.pickupLng,
      dropoffAddress: input.dropoffAddress,
      dropoffLat: input.dropoffLat,
      dropoffLng: input.dropoffLng,
      scheduledAt: new Date(input.scheduledAt),
      passengers,
      adultsCount: adults,
      childrenCount: children,
      infantsCount: infants,
      luggage: input.luggage ?? 0,
      notes: input.notes,
      distanceKm,
      priceCents,
      currency: quote.currency,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      payment: {
        create: {
          amountCents: priceCents,
          currency: quote.currency,
          method: "CARD",
          status: "PENDING",
        },
      },
      passengerOptions: {
        create: {
          infantSeatQty,
          childSeatQty,
          boosterSeatQty,
        },
      },
    },
    include: { payment: true, passengerOptions: true },
  });

  return booking;
}

export async function getByReference(reference: string) {
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: { payment: true, passengerOptions: true, driver: { include: { user: true } } },
  });
  if (!booking) throw HttpError.notFound("Booking not found");
  return booking;
}

export async function listBookings(opts: {
  customerId?: string;
  status?: BookingStatus;
  take: number;
  skip: number;
}) {
  const where: Prisma.BookingWhereInput = {};
  if (opts.customerId) where.customerId = opts.customerId;
  if (opts.status) where.status = opts.status;

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { payment: true, passengerOptions: true },
      orderBy: { createdAt: "desc" },
      take: opts.take,
      skip: opts.skip,
    }),
    prisma.booking.count({ where }),
  ]);

  return { items, total, take: opts.take, skip: opts.skip };
}

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["EN_ROUTE", "CANCELLED"],
  EN_ROUTE: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function updateStatus(
  id: string,
  status: BookingStatus,
  driverId?: string,
) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw HttpError.notFound("Booking not found");

  const allowed = ALLOWED_TRANSITIONS[booking.status];
  if (!allowed.includes(status)) {
    throw HttpError.badRequest(
      `Cannot transition booking from ${booking.status} to ${status}`,
    );
  }

  return prisma.booking.update({
    where: { id },
    data: {
      status,
      ...(driverId ? { driverId } : {}),
    },
    include: { payment: true, passengerOptions: true },
  });
}
