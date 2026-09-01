-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false;

-- Backfill
UPDATE "Order" SET "isPaid" = true WHERE "status" = 'DELIVERED';
