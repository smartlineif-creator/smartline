-- AlterTable
ALTER TABLE "Category" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill: preserve current (alphabetical) order within each parent group
-- so the visible category order doesn't jump right after deploy.
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "parentId" ORDER BY "name" ASC) - 1 AS rn
  FROM "Category"
)
UPDATE "Category" c SET "sortOrder" = ranked.rn FROM ranked WHERE c."id" = ranked."id";
