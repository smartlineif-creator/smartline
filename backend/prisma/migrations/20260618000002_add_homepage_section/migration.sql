-- Create HomepageSection table for configurable homepage layout
CREATE TABLE IF NOT EXISTS "HomepageSection" (
  "id"        TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "order"     INTEGER NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "config"    JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);
