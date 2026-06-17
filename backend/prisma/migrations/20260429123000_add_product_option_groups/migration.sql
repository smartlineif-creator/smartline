CREATE TABLE "ProductOptionGroup" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductOptionGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductOptionValue" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductOptionValue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VariantOptionSelection" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "optionValueId" TEXT NOT NULL,

    CONSTRAINT "VariantOptionSelection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductOptionGroup_productId_name_key" ON "ProductOptionGroup"("productId", "name");
CREATE UNIQUE INDEX "ProductOptionValue_groupId_value_key" ON "ProductOptionValue"("groupId", "value");
CREATE UNIQUE INDEX "VariantOptionSelection_variantId_optionValueId_key" ON "VariantOptionSelection"("variantId", "optionValueId");

ALTER TABLE "ProductOptionGroup" ADD CONSTRAINT "ProductOptionGroup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductOptionValue" ADD CONSTRAINT "ProductOptionValue_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProductOptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VariantOptionSelection" ADD CONSTRAINT "VariantOptionSelection_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VariantOptionSelection" ADD CONSTRAINT "VariantOptionSelection_optionValueId_fkey" FOREIGN KEY ("optionValueId") REFERENCES "ProductOptionValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
