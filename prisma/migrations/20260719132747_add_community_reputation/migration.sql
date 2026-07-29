/*
  Warnings:

  - The `surfaceFinish` column on the `KeyboardSpec` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `keycapMaterial` column on the `KeyboardSpec` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('ADD_PRODUCT', 'UPDATE_PRICE', 'EDIT_SPECS', 'REPORT_VENDOR', 'UPLOAD_IMAGES', 'FIX_PRODUCT_INFO');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BanStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'LIFTED');

-- AlterTable
ALTER TABLE "KeyboardSpec" ADD COLUMN     "breakInProgress" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "colors" JSONB,
ADD COLUMN     "factoryFilmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "factoryLubed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "handLubed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stabilizerLayout" JSONB,
ADD COLUMN     "switchBottomHousing" TEXT,
ADD COLUMN     "switchBottomOut" DOUBLE PRECISION,
ADD COLUMN     "switchBrand" JSONB,
ADD COLUMN     "switchDustproofStem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "switchLedDiffuser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "switchLightPipe" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "switchLongPole" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "switchModel" JSONB,
ADD COLUMN     "switchOpForce" DOUBLE PRECISION,
ADD COLUMN     "switchPreTravel" DOUBLE PRECISION,
ADD COLUMN     "switchRatedLifetime" INTEGER,
ADD COLUMN     "switchSpringLength" DOUBLE PRECISION,
ADD COLUMN     "switchSpringType" TEXT,
ADD COLUMN     "switchSpringWeight" DOUBLE PRECISION,
ADD COLUMN     "switchStemMaterial" TEXT,
ADD COLUMN     "switchTopHousing" TEXT,
ADD COLUMN     "switchTotalTravel" DOUBLE PRECISION,
DROP COLUMN "surfaceFinish",
ADD COLUMN     "surfaceFinish" JSONB,
DROP COLUMN "keycapMaterial",
ADD COLUMN     "keycapMaterial" JSONB;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "longDescription" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "ogImage" TEXT,
ADD COLUMN     "releaseDate" TIMESTAMP(3),
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "tags" JSONB;

-- CreateTable
CREATE TABLE "VendorVariant" (
    "id" TEXT NOT NULL,
    "vendorProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" JSONB,
    "switches" JSONB,
    "keycaps" JSONB,
    "price" INTEGER NOT NULL DEFAULT 0,
    "availability" "Availability" NOT NULL DEFAULT 'IN_STOCK',
    "stockStatus" TEXT NOT NULL DEFAULT 'in_stock',
    "variantUrl" TEXT,
    "sku" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwitchSpec" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "factoryLubed" BOOLEAN NOT NULL DEFAULT false,
    "handLubed" BOOLEAN NOT NULL DEFAULT false,
    "factoryFilmed" BOOLEAN NOT NULL DEFAULT false,
    "breakInProgress" BOOLEAN NOT NULL DEFAULT false,
    "switchCompat" JSONB,
    "switchType" JSONB,
    "switchBrand" JSONB,
    "switchModel" JSONB,
    "switchOpForce" DOUBLE PRECISION,
    "switchBottomOut" DOUBLE PRECISION,
    "switchPreTravel" DOUBLE PRECISION,
    "switchTotalTravel" DOUBLE PRECISION,
    "switchSpringWeight" DOUBLE PRECISION,
    "switchSpringLength" DOUBLE PRECISION,
    "switchRatedLifetime" INTEGER,
    "switchStemMaterial" TEXT,
    "switchTopHousing" TEXT,
    "switchBottomHousing" TEXT,
    "switchSpringType" TEXT,
    "switchLongPole" BOOLEAN NOT NULL DEFAULT false,
    "switchLedDiffuser" BOOLEAN NOT NULL DEFAULT false,
    "switchDustproofStem" BOOLEAN NOT NULL DEFAULT false,
    "switchLightPipe" BOOLEAN NOT NULL DEFAULT false,
    "quantityPerPack" INTEGER,
    "packagingType" TEXT,

    CONSTRAINT "SwitchSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeycapSpec" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "keycapProfile" JSONB,
    "keycapLayoutSupport" JSONB,
    "keycapMaterial" JSONB,
    "keycapManufacturing" JSONB,
    "keycapLegends" JSONB,
    "keycapLegendPlacement" JSONB,
    "keycapLanguage" JSONB,
    "keycapKeyCount" JSONB,
    "keycapStemCompat" JSONB,
    "keycapThickness" TEXT,
    "keycapColorway" TEXT,
    "keycapManufacturer" JSONB,
    "keycapDesigner" TEXT,
    "keycapNovelties" BOOLEAN NOT NULL DEFAULT false,
    "keycapSpacebars" BOOLEAN NOT NULL DEFAULT false,
    "keycapAccentKeys" BOOLEAN NOT NULL DEFAULT false,
    "keycapArtisan" BOOLEAN NOT NULL DEFAULT false,
    "keycapNotes" TEXT,

    CONSTRAINT "KeycapSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouseSpec" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "mouseConnection" JSONB,
    "mouseSensor" TEXT,
    "mouseDpi" INTEGER,
    "mousePollingRate" JSONB,
    "mouseMaxIps" INTEGER,
    "mouseMaxAccel" INTEGER,
    "mouseLod" TEXT,
    "mouseWeight" DOUBLE PRECISION,
    "mouseShape" TEXT,
    "mouseHandOrientation" TEXT,
    "mouseSize" TEXT,
    "mouseDimensionsLength" DOUBLE PRECISION,
    "mouseDimensionsWidth" DOUBLE PRECISION,
    "mouseDimensionsHeight" DOUBLE PRECISION,
    "mouseSwitches" TEXT,
    "mouseEncoder" TEXT,
    "mouseButtons" INTEGER,
    "mouseSideButtons" INTEGER,
    "mouseScrollWheel" TEXT,
    "mouseBattery" INTEGER,
    "mouseBatteryLife" TEXT,
    "mouseChargingPort" TEXT,
    "mouseFeet" TEXT,
    "mouseRgb" BOOLEAN NOT NULL DEFAULT false,
    "mouseSoftwareRequired" BOOLEAN NOT NULL DEFAULT false,
    "mouseOnboardMemory" BOOLEAN NOT NULL DEFAULT false,
    "mouseShellMaterial" TEXT,
    "mouseGripType" JSONB,
    "mouseColor" TEXT,
    "mouseCompatibility" JSONB,
    "mouseAccessories" JSONB,
    "mouseAccessoriesOther" TEXT,
    "mouseWarranty" TEXT,

    CONSTRAINT "MouseSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserXP" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserXP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "ContributionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" "ContributionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "bgColor" TEXT NOT NULL DEFAULT '#FAFF00',
    "textColor" TEXT NOT NULL DEFAULT '#111111',
    "borderColor" TEXT NOT NULL DEFAULT '#111111',
    "icon" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BanHistory" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "BanStatus" NOT NULL DEFAULT 'ACTIVE',
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "liftedAt" TIMESTAMP(3),

    CONSTRAINT "BanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorVariant_vendorProductId_idx" ON "VendorVariant"("vendorProductId");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE INDEX "ProductImage_sortOrder_idx" ON "ProductImage"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SwitchSpec_productId_key" ON "SwitchSpec"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "KeycapSpec_productId_key" ON "KeycapSpec"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "MouseSpec_productId_key" ON "MouseSpec"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "UserXP_profileId_key" ON "UserXP"("profileId");

-- CreateIndex
CREATE INDEX "UserXP_xp_idx" ON "UserXP"("xp");

-- CreateIndex
CREATE INDEX "Contribution_profileId_idx" ON "Contribution"("profileId");

-- CreateIndex
CREATE INDEX "Contribution_status_idx" ON "Contribution"("status");

-- CreateIndex
CREATE INDEX "Contribution_type_idx" ON "Contribution"("type");

-- CreateIndex
CREATE INDEX "Contribution_createdAt_idx" ON "Contribution"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_slug_key" ON "Badge"("slug");

-- CreateIndex
CREATE INDEX "Badge_slug_idx" ON "Badge"("slug");

-- CreateIndex
CREATE INDEX "Badge_sortOrder_idx" ON "Badge"("sortOrder");

-- CreateIndex
CREATE INDEX "UserBadge_profileId_idx" ON "UserBadge"("profileId");

-- CreateIndex
CREATE INDEX "UserBadge_badgeId_idx" ON "UserBadge"("badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_profileId_badgeId_key" ON "UserBadge"("profileId", "badgeId");

-- CreateIndex
CREATE INDEX "ActivityLog_profileId_idx" ON "ActivityLog"("profileId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "BanHistory_profileId_idx" ON "BanHistory"("profileId");

-- CreateIndex
CREATE INDEX "BanHistory_status_idx" ON "BanHistory"("status");

-- CreateIndex
CREATE INDEX "BanHistory_type_idx" ON "BanHistory"("type");

-- AddForeignKey
ALTER TABLE "VendorVariant" ADD CONSTRAINT "VendorVariant_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES "VendorProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwitchSpec" ADD CONSTRAINT "SwitchSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeycapSpec" ADD CONSTRAINT "KeycapSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouseSpec" ADD CONSTRAINT "MouseSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserXP" ADD CONSTRAINT "UserXP_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BanHistory" ADD CONSTRAINT "BanHistory_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BanHistory" ADD CONSTRAINT "BanHistory_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
