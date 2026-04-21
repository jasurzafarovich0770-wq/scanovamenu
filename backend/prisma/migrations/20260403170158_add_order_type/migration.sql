-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'DINE_IN';

-- CreateIndex
CREATE INDEX "AppUser_username_idx" ON "AppUser"("username");
