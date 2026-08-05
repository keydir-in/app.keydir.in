-- The parent vendor product URL is optional; per-variant URLs are the source
-- of truth. DROP NOT NULL is idempotent on a shared database.
ALTER TABLE "VendorProduct" ALTER COLUMN "vendorUrl" DROP NOT NULL;
