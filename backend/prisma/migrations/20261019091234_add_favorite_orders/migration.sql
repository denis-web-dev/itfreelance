-- CreateTable
CREATE TABLE "favorite_orders" (
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_orders_pkey" PRIMARY KEY ("userId","orderId")
);

-- AddForeignKey
ALTER TABLE "favorite_orders" ADD CONSTRAINT "favorite_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_orders" ADD CONSTRAINT "favorite_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
