-- Add IsFeatured column to Products table
ALTER TABLE "Products" 
ADD COLUMN IF NOT EXISTS "IsFeatured" boolean NOT NULL DEFAULT false;

-- Update existing products to not be featured by default
UPDATE "Products" SET "IsFeatured" = false WHERE "IsFeatured" IS NULL;
