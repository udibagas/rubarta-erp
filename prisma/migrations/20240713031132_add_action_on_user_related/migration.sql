/*
  Warnings:

  - You are about to alter the column `readAt` on the `Notifications` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.

*/
-- DropForeignKey
ALTER TABLE `ApprovalSettingItems` DROP FOREIGN KEY `ApprovalSettingItems_approvalSettingId_fkey`;

-- DropForeignKey
ALTER TABLE `ExpenseClaimApproval` DROP FOREIGN KEY `ExpenseClaimApproval_expenseClaimId_fkey`;

-- DropForeignKey
ALTER TABLE `ExpenseClaimAttachments` DROP FOREIGN KEY `ExpenseClaimAttachments_expenseClaimId_fkey`;

-- DropForeignKey
ALTER TABLE `ExpenseClaimItems` DROP FOREIGN KEY `ExpenseClaimItems_expenseClaimId_fkey`;

-- DropForeignKey
ALTER TABLE `Notifications` DROP FOREIGN KEY `Notifications_userId_fkey`;

-- DropForeignKey
ALTER TABLE `PaymentAuthorizationItems` DROP FOREIGN KEY `PaymentAuthorizationItems_paymentAuthorizationId_fkey`;

-- DropForeignKey
ALTER TABLE `UserBalances` DROP FOREIGN KEY `UserBalances_userId_fkey`;

-- DropForeignKey
ALTER TABLE `UserRoles` DROP FOREIGN KEY `UserRoles_userId_fkey`;

-- AlterTable
ALTER TABLE `Notifications` MODIFY `readAt` TIMESTAMP NULL;

-- AddForeignKey
ALTER TABLE `UserRoles` ADD CONSTRAINT `UserRoles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBalances` ADD CONSTRAINT `UserBalances_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentAuthorizationItems` ADD CONSTRAINT `PaymentAuthorizationItems_paymentAuthorizationId_fkey` FOREIGN KEY (`paymentAuthorizationId`) REFERENCES `PaymentAuthorizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpenseClaimItems` ADD CONSTRAINT `ExpenseClaimItems_expenseClaimId_fkey` FOREIGN KEY (`expenseClaimId`) REFERENCES `ExpenseClaims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpenseClaimAttachments` ADD CONSTRAINT `ExpenseClaimAttachments_expenseClaimId_fkey` FOREIGN KEY (`expenseClaimId`) REFERENCES `ExpenseClaims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpenseClaimApproval` ADD CONSTRAINT `ExpenseClaimApproval_expenseClaimId_fkey` FOREIGN KEY (`expenseClaimId`) REFERENCES `ExpenseClaims`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalSettingItems` ADD CONSTRAINT `ApprovalSettingItems_approvalSettingId_fkey` FOREIGN KEY (`approvalSettingId`) REFERENCES `ApprovalSettings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notifications` ADD CONSTRAINT `Notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
