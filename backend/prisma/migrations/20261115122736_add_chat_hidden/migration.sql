-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "customerHiddenAt" TIMESTAMP(3),
ADD COLUMN     "freelancerHiddenAt" TIMESTAMP(3);
