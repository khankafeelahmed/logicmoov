import type { VehicleCategory } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { HttpError } from "../../lib/httpError";

export interface UpsertRouteRateInput {
  originZone: string;
  destinationZone: string;
  category: VehicleCategory;
  priceCents: number;
  currency?: string;
  meetAndGreetFeeCents?: number;
  includedWaitMin?: number;
  active?: boolean;
}

/**
 * Looked up by the supplier-booking ingestion endpoint to validate/confirm
 * a price an OTA already quoted its customer. Throws if no active rate is
 * on file for the route/category — that booking must be manually reviewed
 * rather than silently accepted at an unpublished price.
 */
export async function findActiveRate(
  originZone: string,
  destinationZone: string,
  category: VehicleCategory,
) {
  const rate = await prisma.routeRate.findFirst({
    where: { originZone, destinationZone, category, active: true },
  });
  if (!rate) {
    throw HttpError.notFound(
      `No published rate for ${originZone} -> ${destinationZone} (${category})`,
    );
  }
  return rate;
}

export async function listRates(opts: {
  originZone?: string;
  take: number;
  skip: number;
}) {
  const where = opts.originZone ? { originZone: opts.originZone } : {};
  const [items, total] = await Promise.all([
    prisma.routeRate.findMany({
      where,
      orderBy: [{ originZone: "asc" }, { destinationZone: "asc" }],
      take: opts.take,
      skip: opts.skip,
    }),
    prisma.routeRate.count({ where }),
  ]);
  return { items, total, take: opts.take, skip: opts.skip };
}

/** Creates or updates the rate for a given originZone/destinationZone/category triple. */
export async function upsertRate(input: UpsertRouteRateInput) {
  return prisma.routeRate.upsert({
    where: {
      originZone_destinationZone_category: {
        originZone: input.originZone,
        destinationZone: input.destinationZone,
        category: input.category,
      },
    },
    update: {
      priceCents: input.priceCents,
      currency: input.currency ?? "CAD",
      meetAndGreetFeeCents: input.meetAndGreetFeeCents,
      includedWaitMin: input.includedWaitMin ?? 60,
      active: input.active ?? true,
    },
    create: {
      originZone: input.originZone,
      destinationZone: input.destinationZone,
      category: input.category,
      priceCents: input.priceCents,
      currency: input.currency ?? "CAD",
      meetAndGreetFeeCents: input.meetAndGreetFeeCents,
      includedWaitMin: input.includedWaitMin ?? 60,
      active: input.active ?? true,
    },
  });
}

export async function deleteRate(id: string) {
  const rate = await prisma.routeRate.findUnique({ where: { id } });
  if (!rate) throw HttpError.notFound("Rate not found");
  await prisma.routeRate.delete({ where: { id } });
}
