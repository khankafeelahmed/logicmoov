import bcrypt from "bcryptjs";
import { PrismaClient, type VehicleCategory } from "@prisma/client";

const prisma = new PrismaClient();

const pricingRules: Array<{
  category: VehicleCategory;
  baseFareCents: number;
  perKmCents: number;
  multiplier: number;
}> = [
  { category: "SEDAN", baseFareCents: 450, perKmCents: 180, multiplier: 1 },
  { category: "SUV", baseFareCents: 600, perKmCents: 220, multiplier: 1 },
  { category: "VAN", baseFareCents: 800, perKmCents: 260, multiplier: 1 },
  { category: "LUXURY", baseFareCents: 1080, perKmCents: 340, multiplier: 1 },
];

async function main() {
  // Pricing rules
  for (const rule of pricingRules) {
    await prisma.pricingRule.upsert({
      where: { category: rule.category },
      update: rule,
      create: { ...rule, currency: "CAD", active: true },
    });
  }

  // Admin user
  const adminPassword = await bcrypt.hash("Admin1234!", 10);
  await prisma.user.upsert({
    where: { email: "admin@taximovqc.ca" },
    update: {},
    create: {
      email: "admin@taximovqc.ca",
      passwordHash: adminPassword,
      fullName: "TAXIMOVQC Admin",
      role: "ADMIN",
      locale: "fr",
    },
  });

  // Sample driver + vehicle
  const driverPassword = await bcrypt.hash("Driver1234!", 10);
  const driverUser = await prisma.user.upsert({
    where: { email: "driver@taximovqc.ca" },
    update: {},
    create: {
      email: "driver@taximovqc.ca",
      passwordHash: driverPassword,
      fullName: "Jean Tremblay",
      role: "DRIVER",
      phone: "+15145550199",
      locale: "fr",
    },
  });

  const driver = await prisma.driverProfile.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      licenseNumber: "QC-DRV-0001",
      status: "AVAILABLE",
      rating: 4.9,
    },
  });

  await prisma.vehicle.upsert({
    where: { plate: "QR-1000" },
    update: {},
    create: {
      category: "SEDAN",
      make: "Toyota",
      model: "Camry",
      year: 2023,
      plate: "QR-1000",
      seats: 4,
      driverId: driver.id,
    },
  });

  // Support agent
  const agentPassword = await bcrypt.hash("Agent1234!", 10);
  await prisma.user.upsert({
    where: { email: "agent@taximovqc.ca" },
    update: {},
    create: {
      email: "agent@taximovqc.ca",
      passwordHash: agentPassword,
      fullName: "Sophie Agent",
      role: "AGENT",
      locale: "fr",
    },
  });

  console.log(
    "✅ Seed complete: pricing rules, admin, driver + vehicle, support agent.",
  );
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
