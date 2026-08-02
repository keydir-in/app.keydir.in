-- AlterTable
ALTER TABLE "VendorCoupon" DROP COLUMN "autoShowOnProductPages";
ALTER TABLE "VendorCoupon" DROP COLUMN "autoCopy";
ALTER TABLE "VendorCoupon" RENAME COLUMN "affiliateLinkOverride" TO "affiliateLink";
