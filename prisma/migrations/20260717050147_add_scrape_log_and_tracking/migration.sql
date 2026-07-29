-- AlterEnum
ALTER TYPE "ScrapeStatus" ADD VALUE 'NEEDS_REVIEW';

-- AlterTable
ALTER TABLE "VendorProduct" ADD COLUMN     "lastHttpStatus" INTEGER,
ADD COLUMN     "responseTimeMs" INTEGER;

-- CreateTable
CREATE TABLE "ScrapeLog" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vendorProductId" TEXT,
    "status" "ScrapeStatus" NOT NULL,
    "httpStatus" INTEGER,
    "responseTimeMs" INTEGER,
    "error" TEXT,
    "price" INTEGER,
    "availability" "Availability",
    "selectorVersion" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScrapeLog_vendorId_idx" ON "ScrapeLog"("vendorId");

-- CreateIndex
CREATE INDEX "ScrapeLog_vendorProductId_idx" ON "ScrapeLog"("vendorProductId");

-- CreateIndex
CREATE INDEX "ScrapeLog_status_idx" ON "ScrapeLog"("status");

-- CreateIndex
CREATE INDEX "ScrapeLog_createdAt_idx" ON "ScrapeLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ScrapeLog" ADD CONSTRAINT "ScrapeLog_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
