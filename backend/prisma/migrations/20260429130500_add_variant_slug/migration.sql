ALTER TABLE "Variant" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "Variant_slug_key" ON "Variant"("slug");
