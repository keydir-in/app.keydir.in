-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "couponsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "VendorCoupon" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "discountType" TEXT NOT NULL DEFAULT 'percentage',
    "discountValue" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "autoShowOnProductPages" BOOLEAN NOT NULL DEFAULT true,
    "autoCopy" BOOLEAN NOT NULL DEFAULT false,
    "affiliateLinkOverride" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorCoupon_vendorId_idx" ON "VendorCoupon"("vendorId");

-- AddForeignKey
ALTER TABLE "VendorCoupon" ADD CONSTRAINT "VendorCoupon_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
