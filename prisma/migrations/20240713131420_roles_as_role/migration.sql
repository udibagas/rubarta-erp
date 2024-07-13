/*
  Warnings:

  - The `roles` column on the `Users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "roles",
ADD COLUMN     "roles" "Role"[] DEFAULT ARRAY['USER']::"Role"[];
