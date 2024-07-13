/*
  Warnings:

  - You are about to alter the column `readAt` on the `Notifications` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.
  - You are about to drop the column `role` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ExpenseClaimApproval` ADD COLUMN `note` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `Notifications` MODIFY `readAt` TIMESTAMP NULL;

-- AlterTable
ALTER TABLE `PaymentAuthorizationApprovals` ADD COLUMN `note` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `Users` DROP COLUMN `role`;

-- CreateTable
CREATE TABLE `UserRoles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `role` ENUM('USER', 'CASHIER', 'FINANCE', 'ACCOUNTING', 'GA', 'APPROVER', 'VERIFIER', 'ADMIN') NOT NULL,

    UNIQUE INDEX `UserRoles_userId_role_key`(`userId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserRoles` ADD CONSTRAINT `UserRoles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
