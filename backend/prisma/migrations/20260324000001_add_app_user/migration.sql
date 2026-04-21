CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "restaurantId" TEXT,
    "restaurantName" TEXT,
    "ownerName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "tables" INTEGER NOT NULL DEFAULT 0,
    "cardNumber" TEXT,
    "serviceFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppUser_username_key" ON "AppUser"("username");
CREATE INDEX "AppUser_restaurantId_idx" ON "AppUser"("restaurantId");
