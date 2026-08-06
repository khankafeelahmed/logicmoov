-- CreateTable
CREATE TABLE "fare_rules" (
    "id" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "base_fare" DECIMAL(10,2) NOT NULL,
    "price_per_km" DECIMAL(10,2) NOT NULL,
    "price_per_minute" DECIMAL(10,2) NOT NULL,
    "booking_fee" DECIMAL(10,2) NOT NULL,
    "additional_stop_fee_min" DECIMAL(10,2),
    "additional_stop_fee_max" DECIMAL(10,2),
    "airport_pickup_pricing_note" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fare_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fare_rules_service_type_city_key" ON "fare_rules"("service_type", "city");

-- CreateIndex
CREATE INDEX "fare_rules_service_type_city_active_idx" ON "fare_rules"("service_type", "city", "active");
