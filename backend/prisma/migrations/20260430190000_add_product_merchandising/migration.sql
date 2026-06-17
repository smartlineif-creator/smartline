CREATE TYPE "ProductRelationType" AS ENUM ('RECOMMENDED', 'WITH_THIS_BUY');
CREATE TYPE "ProductCategoryLinkType" AS ENUM ('ACCESSORY');

CREATE TABLE "ProductRelation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "relatedId" TEXT NOT NULL,
    "type" "ProductRelationType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductRelation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductCategoryLink" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "type" "ProductCategoryLinkType" NOT NULL,

    CONSTRAINT "ProductCategoryLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductRelation_productId_relatedId_type_key" ON "ProductRelation"("productId", "relatedId", "type");
CREATE UNIQUE INDEX "ProductCategoryLink_productId_categoryId_type_key" ON "ProductCategoryLink"("productId", "categoryId", "type");

ALTER TABLE "ProductRelation" ADD CONSTRAINT "ProductRelation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductRelation" ADD CONSTRAINT "ProductRelation_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductCategoryLink" ADD CONSTRAINT "ProductCategoryLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCategoryLink" ADD CONSTRAINT "ProductCategoryLink_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
