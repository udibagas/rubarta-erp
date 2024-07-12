/*
  Warnings:

  - You are about to drop the column `amount` on the `ExpenseClaims` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[expenseClaimId]` on the table `PaymentAuthorizations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Departments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileType` to the `ExpenseClaimAttachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `ExpenseClaims` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Users` DROP FOREIGN KEY `Users_departmentId_fkey`;

-- AlterTable
ALTER TABLE `Companies` ADD COLUMN `code` VARCHAR(10) NOT NULL;

-- AlterTable
ALTER TABLE `Departments` ADD COLUMN `code` VARCHAR(10) NOT NULL;

-- AlterTable
ALTER TABLE `ExpenseClaimAttachments` ADD COLUMN `fileType` VARCHAR(30) NOT NULL;

-- AlterTable
ALTER TABLE `ExpenseClaims` DROP COLUMN `amount`,
    ADD COLUMN `totalAmount` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `PaymentAuthorizations` ADD COLUMN `expenseClaimId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Users` ADD COLUMN `bankAccount` VARCHAR(30) NULL,
    ADD COLUMN `signatureSpeciment` VARCHAR(255) NULL,
    MODIFY `role` ENUM('USER', 'CASHIER', 'FINANCE', 'ACCOUNTING', 'GA', 'ADMIN') NOT NULL DEFAULT 'USER',
    MODIFY `departmentId` INTEGER NULL;

-- CreateTable
CREATE TABLE `ApprovalSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `companyId` INTEGER NOT NULL,
    `approvalType` ENUM('PAYMENT_AUTHORIZATION', 'EXPENSE_CLAIM') NOT NULL,

    UNIQUE INDEX `ApprovalSettings_companyId_approvalType_key`(`companyId`, `approvalType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApprovalSettingItems` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `approvalSettingId` INTEGER NOT NULL,
    `level` SMALLINT NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `ApprovalSettingItems_approvalSettingId_level_userId_key`(`approvalSettingId`, `level`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `message` TEXT NOT NULL,
    `redirectUrl` VARCHAR(255) NULL,
    `readAt` TIMESTAMP NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `PaymentAuthorizations_expenseClaimId_key` ON `PaymentAuthorizations`(`expenseClaimId`);

-- AddForeignKey
ALTER TABLE `Users` ADD CONSTRAINT `Users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentAuthorizations` ADD CONSTRAINT `PaymentAuthorizations_expenseClaimId_fkey` FOREIGN KEY (`expenseClaimId`) REFERENCES `ExpenseClaims`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalSettings` ADD CONSTRAINT `ApprovalSettings_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalSettingItems` ADD CONSTRAINT `ApprovalSettingItems_approvalSettingId_fkey` FOREIGN KEY (`approvalSettingId`) REFERENCES `ApprovalSettings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalSettingItems` ADD CONSTRAINT `ApprovalSettingItems_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notifications` ADD CONSTRAINT `Notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
