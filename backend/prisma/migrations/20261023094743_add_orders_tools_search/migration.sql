-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "toolsSearch" TEXT NOT NULL DEFAULT '';
UPDATE "orders" SET "toolsSearch" = lower(array_to_string("tools", ' '));
