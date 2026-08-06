-- AlterTable
ALTER TABLE "Booking"
ADD COLUMN "adultsCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "childrenCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "infantsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "booking_passenger_options" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "infantSeatQty" INTEGER NOT NULL DEFAULT 0,
    "childSeatQty" INTEGER NOT NULL DEFAULT 0,
    "boosterSeatQty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_passenger_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "booking_passenger_options_bookingId_key" ON "booking_passenger_options"("bookingId");

-- AddForeignKey
ALTER TABLE "booking_passenger_options" ADD CONSTRAINT "booking_passenger_options_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
