/*
  Warnings:

  - Added the required column `expenseClaimId` to the `ExpenseClaimItems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ExpenseClaimItems` ADD COLUMN `expenseClaimId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `ExpenseClaimItems` ADD CONSTRAINT `ExpenseClaimItems_expenseClaimId_fkey` FOREIGN KEY (`expenseClaimId`) REFERENCES `ExpenseClaims`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
