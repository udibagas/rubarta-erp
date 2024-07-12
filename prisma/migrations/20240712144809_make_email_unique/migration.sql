/*
  Warnings:

  - You are about to alter the column `readAt` on the `Notifications` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.
  - A unique constraint covering the columns `[email]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Notifications` MODIFY `readAt` TIMESTAMP NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Users_email_key` ON `Users`(`email`);
