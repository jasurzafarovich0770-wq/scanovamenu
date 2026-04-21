-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ORDER_PAYMENT', 'SERVICE_FEE_DEDUCT', 'SERVICE_FEE_CREDIT');

-- AlterTable: Order ga waiterId, serviceFee qo'shish
ALTER TABLE "Order" ADD COLUMN "waiterId" TEXT;
ALTER TABLE "Order" ADD COLUMN "serviceFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable: Waiter
CREATE TABLE "Waiter" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Waiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RestaurantWallet
CREATE TABLE "RestaurantWallet" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cardNumber" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RestaurantWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WaiterWallet
CREATE TABLE "WaiterWallet" (
    "id" TEXT NOT NULL,
    "waiterId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WaiterWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WalletTransaction
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "orderId" TEXT,
    "restaurantId" TEXT,
    "waiterId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Waiter_restaurantId_idx" ON "Waiter"("restaurantId");
CREATE INDEX "Waiter_isActive_idx" ON "Waiter"("isActive");
CREATE UNIQUE INDEX "RestaurantWallet_restaurantId_key" ON "RestaurantWallet"("restaurantId");
CREATE UNIQUE INDEX "WaiterWallet_waiterId_key" ON "WaiterWallet"("waiterId");
CREATE INDEX "WalletTransaction_restaurantId_idx" ON "WalletTransaction"("restaurantId");
CREATE INDEX "WalletTransaction_waiterId_idx" ON "WalletTransaction"("waiterId");
CREATE INDEX "WalletTransaction_orderId_idx" ON "WalletTransaction"("orderId");
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");
CREATE INDEX "Order_waiterId_idx" ON "Order"("waiterId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_waiterId_fkey" FOREIGN KEY ("waiterId") REFERENCES "Waiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Waiter" ADD CONSTRAINT "Waiter_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RestaurantWallet" ADD CONSTRAINT "RestaurantWallet_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WaiterWallet" ADD CONSTRAINT "WaiterWallet_waiterId_fkey" FOREIGN KEY ("waiterId") REFERENCES "Waiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "RestaurantWallet"("restaurantId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_waiterId_fkey" FOREIGN KEY ("waiterId") REFERENCES "Waiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
