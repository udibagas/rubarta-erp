/*
  Warnings:

  - You are about to drop the column `userId` on the `PaymentAuthorizations` table. All the data in the column will be lost.
  - Added the required column `employeeId` to the `PaymentAuthorizations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PaymentAuthorizations" DROP CONSTRAINT "PaymentAuthorizations_bankId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentAuthorizations" DROP CONSTRAINT "PaymentAuthorizations_userId_fkey";

-- AlterTable
ALTER TABLE "PaymentAuthorizations" DROP COLUMN "userId",
ADD COLUMN     "employeeId" INTEGER NOT NULL,
ADD COLUMN     "requesterId" INTEGER,
ALTER COLUMN "bankId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PaymentAuthorizations" ADD CONSTRAINT "PaymentAuthorizations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAuthorizations" ADD CONSTRAINT "PaymentAuthorizations_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAuthorizations" ADD CONSTRAINT "PaymentAuthorizations_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
