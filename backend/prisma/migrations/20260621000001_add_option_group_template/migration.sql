-- CreateTable
CREATE TABLE "OptionGroupTemplate" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OptionGroupTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OptionGroupTemplate" ADD CONSTRAINT "OptionGroupTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "ProductOptionGroup" ADD COLUMN "unit" TEXT;
