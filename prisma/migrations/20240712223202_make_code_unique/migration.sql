/*
  Warnings:

  - You are about to alter the column `readAt` on the `Notifications` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.
  - A unique constraint covering the columns `[code]` on the table `Banks` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Companies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Departments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Notifications` MODIFY `readAt` TIMESTAMP NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Banks_code_key` ON `Banks`(`code`);

-- CreateIndex
CREATE UNIQUE INDEX `Companies_code_key` ON `Companies`(`code`);

-- CreateIndex
CREATE UNIQUE INDEX `Departments_code_key` ON `Departments`(`code`);
