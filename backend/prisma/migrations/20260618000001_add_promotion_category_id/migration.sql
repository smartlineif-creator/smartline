-- Add categoryId to Promotion for category-wide promotions
ALTER TABLE "Promotion" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
