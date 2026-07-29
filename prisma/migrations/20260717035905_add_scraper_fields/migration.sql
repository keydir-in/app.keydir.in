-- CreateEnum
CREATE TYPE "ScrapeStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING', 'MANUAL_OVERRIDE');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('IN_STOCK', 'PREORDER', 'GROUP_BUY', 'COMING_SOON', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "PriceSource" AS ENUM ('SCRAPER', 'MANUAL');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" VARCHAR(200),
    "github" TEXT,
    "discord" TEXT,
    "reddit" TEXT,
    "monkeytype" TEXT,
    "website" TEXT,
    "voteCredits" INTEGER NOT NULL DEFAULT 25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "website" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "website" TEXT NOT NULL,
    "affiliateLink" TEXT,
    "shippingPolicy" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brandId" TEXT,
    "productType" TEXT NOT NULL DEFAULT 'keyboards',
    "image" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorProduct" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "vendorUrl" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "availability" "Availability" NOT NULL DEFAULT 'IN_STOCK',
    "shippingCost" INTEGER NOT NULL DEFAULT 0,
    "shippingIncluded" BOOLEAN NOT NULL DEFAULT false,
    "totalPrice" INTEGER NOT NULL DEFAULT 0,
    "stockStatus" TEXT NOT NULL DEFAULT 'in_stock',
    "affiliateLink" TEXT,
    "scrapeStatus" "ScrapeStatus" NOT NULL DEFAULT 'PENDING',
    "scrapeError" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "lastSuccessfulAt" TIMESTAMP(3),
    "lastScrapedPrice" INTEGER,
    "lastScrapedAvailability" "Availability",
    "scraperVersion" TEXT,
    "manualOverride" BOOLEAN NOT NULL DEFAULT false,
    "manualUpdatedAt" TIMESTAMP(3),
    "manualUpdatedById" TEXT,
    "updatedBy" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "vendorProductId" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "availability" "Availability" NOT NULL DEFAULT 'IN_STOCK',
    "shippingCost" INTEGER NOT NULL DEFAULT 0,
    "totalPrice" INTEGER NOT NULL DEFAULT 0,
    "source" "PriceSource" NOT NULL DEFAULT 'MANUAL',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stockStatus" TEXT NOT NULL DEFAULT 'in_stock',

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "desktopImage" TEXT,
    "mobileImage" TEXT,
    "linkType" TEXT NOT NULL DEFAULT 'url',
    "linkUrl" TEXT,
    "openNewTab" BOOLEAN NOT NULL DEFAULT false,
    "displayRule" TEXT NOT NULL DEFAULT 'both',
    "bannerType" TEXT NOT NULL DEFAULT 'hero',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BannerLocation" (
    "id" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "BannerLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyboardSpec" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "layout" TEXT,
    "keyboardStyle" JSONB,
    "caseMaterial" TEXT,
    "surfaceFinish" TEXT,
    "weight" INTEGER,
    "lengthMm" INTEGER,
    "widthMm" INTEGER,
    "heightMm" INTEGER,
    "typingAngle" INTEGER,
    "mountingStyle" JSONB,
    "plateMaterial" JSONB,
    "stabilizerCompat" JSONB,
    "foamMaterial" JSONB,
    "foamPlacement" JSONB,
    "flexCuts" BOOLEAN NOT NULL DEFAULT false,
    "pcbType" JSONB,
    "pcbThickness" DOUBLE PRECISION,
    "pollingRate" INTEGER,
    "nkro" BOOLEAN NOT NULL DEFAULT false,
    "batteryCapacity" INTEGER,
    "connectivity" JSONB,
    "detachableCable" BOOLEAN NOT NULL DEFAULT false,
    "firmware" JSONB,
    "lighting" TEXT,
    "ledOrientation" TEXT,
    "perKeyRgb" BOOLEAN NOT NULL DEFAULT false,
    "switchesIncluded" BOOLEAN NOT NULL DEFAULT false,
    "switchCompat" JSONB,
    "switchType" JSONB,
    "keycapsIncluded" BOOLEAN NOT NULL DEFAULT false,
    "keycapMaterial" TEXT,
    "keycapProfile" TEXT,
    "keycapLegendType" JSONB,
    "keycapLegendPlacement" JSONB,
    "includedAccessories" JSONB,
    "additionalAccessories" TEXT,
    "specialFeatures" TEXT,

    CONSTRAINT "KeyboardSpec_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");

-- CreateIndex
CREATE INDEX "Profile_username_idx" ON "Profile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_slug_idx" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_slug_key" ON "Vendor"("slug");

-- CreateIndex
CREATE INDEX "Vendor_slug_idx" ON "Vendor"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_productType_idx" ON "Product"("productType");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE INDEX "VendorProduct_productId_idx" ON "VendorProduct"("productId");

-- CreateIndex
CREATE INDEX "VendorProduct_vendorId_idx" ON "VendorProduct"("vendorId");

-- CreateIndex
CREATE INDEX "VendorProduct_totalPrice_idx" ON "VendorProduct"("totalPrice");

-- CreateIndex
CREATE INDEX "VendorProduct_lastCheckedAt_idx" ON "VendorProduct"("lastCheckedAt");

-- CreateIndex
CREATE INDEX "VendorProduct_scrapeStatus_idx" ON "VendorProduct"("scrapeStatus");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProduct_vendorId_productId_key" ON "VendorProduct"("vendorId", "productId");

-- CreateIndex
CREATE INDEX "PriceHistory_vendorProductId_idx" ON "PriceHistory"("vendorProductId");

-- CreateIndex
CREATE INDEX "PriceHistory_recordedAt_idx" ON "PriceHistory"("recordedAt");

-- CreateIndex
CREATE INDEX "PriceHistory_source_idx" ON "PriceHistory"("source");

-- CreateIndex
CREATE INDEX "Vote_productId_idx" ON "Vote"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_profileId_productId_key" ON "Vote"("profileId", "productId");

-- CreateIndex
CREATE INDEX "Banner_status_idx" ON "Banner"("status");

-- CreateIndex
CREATE INDEX "Banner_priority_idx" ON "Banner"("priority");

-- CreateIndex
CREATE INDEX "BannerLocation_location_idx" ON "BannerLocation"("location");

-- CreateIndex
CREATE UNIQUE INDEX "BannerLocation_bannerId_location_key" ON "BannerLocation"("bannerId", "location");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_profileId_productId_key" ON "Wishlist"("profileId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_profileId_productId_key" ON "Collection"("profileId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "KeyboardSpec_productId_key" ON "KeyboardSpec"("productId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProduct" ADD CONSTRAINT "VendorProduct_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProduct" ADD CONSTRAINT "VendorProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES "VendorProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BannerLocation" ADD CONSTRAINT "BannerLocation_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyboardSpec" ADD CONSTRAINT "KeyboardSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
