-- AlterTable
ALTER TABLE "SubscriptionPayment" ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "transactionId" TEXT,
ADD COLUMN "gatewayData" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_transactionId_key" ON "SubscriptionPayment"("transactionId");
