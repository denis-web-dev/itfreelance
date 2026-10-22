-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deadline" DATE;

-- CreateTable
CREATE TABLE "order_stages" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,

    CONSTRAINT "order_stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_stages_orderId_position_key" ON "order_stages"("orderId", "position");

-- AddForeignKey
ALTER TABLE "order_stages" ADD CONSTRAINT "order_stages_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
