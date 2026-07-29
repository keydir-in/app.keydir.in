-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "imageAttribute" TEXT NOT NULL DEFAULT 'src',
ADD COLUMN     "titleAttribute" TEXT NOT NULL DEFAULT 'text';
