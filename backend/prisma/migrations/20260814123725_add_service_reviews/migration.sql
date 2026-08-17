-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "serviceId" TEXT,
ALTER COLUMN "productId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Review_productId_idx" ON "Review"("productId");

-- CreateIndex
CREATE INDEX "Review_serviceId_idx" ON "Review"("serviceId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CheckConstraint: exactly one of productId / serviceId must be set
ALTER TABLE "Review" ADD CONSTRAINT "review_target_exactly_one"
CHECK ((("productId" IS NOT NULL)::int + ("serviceId" IS NOT NULL)::int) = 1);
