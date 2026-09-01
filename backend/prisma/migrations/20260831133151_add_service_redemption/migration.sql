-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "lastRedeemedAt" TIMESTAMP(3),
ADD COLUMN     "redeemedCount" INTEGER NOT NULL DEFAULT 0;
