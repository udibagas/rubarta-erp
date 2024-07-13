-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'CASHIER', 'FINANCE', 'ACCOUNTING', 'GA', 'APPROVER', 'VERIFIER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIIALLY_APPROVED', 'REJECTED', 'VERIFIED', 'CANCELLED', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIIALLY_APPROVED', 'REJECTED', 'VERIFIED', 'PAID');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('PAYMENT_AUTHORIZATION', 'EXPENSE_CLAIM');

-- CreateTable
CREATE TABLE "Companies" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departments" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banks" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "roles" TEXT[] DEFAULT ARRAY['ADMIN']::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "bankId" INTEGER,
    "bankAccount" VARCHAR(30),
    "departmentId" INTEGER,
    "signatureSpeciment" VARCHAR(255),

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBalances" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "UserBalances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAuthorizations" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "number" VARCHAR(50) NOT NULL,
    "userId" INTEGER NOT NULL,
    "bankId" INTEGER NOT NULL,
    "grossAmount" BIGINT NOT NULL,
    "deduction" BIGINT NOT NULL,
    "netAmount" BIGINT NOT NULL,
    "amount" BIGINT NOT NULL,
    "cashAdvance" BIGINT NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "expenseClaimId" INTEGER,
    "status" "PaymentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "PaymentAuthorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAuthorizationItems" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "paymentAuthorizationId" INTEGER NOT NULL,

    CONSTRAINT "PaymentAuthorizationItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAuthorizationApprovals" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "approvalStatus" "ApprovalStatus",
    "note" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "paymentAuthorizationId" INTEGER NOT NULL,

    CONSTRAINT "PaymentAuthorizationApprovals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseTypes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(30) NOT NULL,

    CONSTRAINT "ExpenseTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseClaims" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "userId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "totalAmount" BIGINT NOT NULL,
    "cashAdvance" BIGINT NOT NULL,
    "claim" BIGINT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "ExpenseClaims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseClaimItems" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "expenseTypeId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "expenseClaimId" INTEGER NOT NULL,

    CONSTRAINT "ExpenseClaimItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseClaimAttachments" (
    "id" SERIAL NOT NULL,
    "expenseClaimId" INTEGER NOT NULL,
    "description" VARCHAR(255),
    "fileName" VARCHAR(255) NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "fileType" VARCHAR(30) NOT NULL,

    CONSTRAINT "ExpenseClaimAttachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseClaimApproval" (
    "id" SERIAL NOT NULL,
    "expenseClaimId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "approvalStatus" "ApprovalStatus",
    "note" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ExpenseClaimApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalSettings" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "approvalType" "ApprovalType" NOT NULL,

    CONSTRAINT "ApprovalSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalSettingItems" (
    "id" SERIAL NOT NULL,
    "approvalSettingId" INTEGER NOT NULL,
    "level" SMALLINT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ApprovalSettingItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "id" BIGSERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "redirectUrl" VARCHAR(255),
    "readAt" TIMESTAMP,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Companies_code_key" ON "Companies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Departments_code_key" ON "Departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Banks_code_key" ON "Banks"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserBalances_userId_key" ON "UserBalances"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAuthorizations_expenseClaimId_key" ON "PaymentAuthorizations"("expenseClaimId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalSettings_companyId_approvalType_key" ON "ApprovalSettings"("companyId", "approvalType");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalSettingItems_approvalSettingId_level_userId_key" ON "ApprovalSettingItems"("approvalSettingId", "level", "userId");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBalances" ADD CONSTRAINT "UserBalances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAuthorizations" ADD CONSTRAINT "PaymentAuthorizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAuthorizations" ADD CONSTRAINT "PaymentAuthorizations_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAuthorizations" ADD CONSTRAINT "PaymentAuthorizations_expenseClaimId_fkey" FOREIGN KEY ("expenseClaimId") REFERENCES "ExpenseClaims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAuthorizations" ADD CONSTRAINT "PaymentAuthorizations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAuthorizationItems" ADD CONSTRAINT "PaymentAuthorizationItems_paymentAuthorizationId_fkey" FOREIGN KEY ("paymentAuthorizationId") REFERENCES "PaymentAuthorizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAuthorizationApprovals" ADD CONSTRAINT "PaymentAuthorizationApprovals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAuthorizationApprovals" ADD CONSTRAINT "PaymentAuthorizationApprovals_paymentAuthorizationId_fkey" FOREIGN KEY ("paymentAuthorizationId") REFERENCES "PaymentAuthorizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaims" ADD CONSTRAINT "ExpenseClaims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaims" ADD CONSTRAINT "ExpenseClaims_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaims" ADD CONSTRAINT "ExpenseClaims_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaimItems" ADD CONSTRAINT "ExpenseClaimItems_expenseClaimId_fkey" FOREIGN KEY ("expenseClaimId") REFERENCES "ExpenseClaims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaimItems" ADD CONSTRAINT "ExpenseClaimItems_expenseTypeId_fkey" FOREIGN KEY ("expenseTypeId") REFERENCES "ExpenseTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaimAttachments" ADD CONSTRAINT "ExpenseClaimAttachments_expenseClaimId_fkey" FOREIGN KEY ("expenseClaimId") REFERENCES "ExpenseClaims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaimApproval" ADD CONSTRAINT "ExpenseClaimApproval_expenseClaimId_fkey" FOREIGN KEY ("expenseClaimId") REFERENCES "ExpenseClaims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaimApproval" ADD CONSTRAINT "ExpenseClaimApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalSettings" ADD CONSTRAINT "ApprovalSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalSettingItems" ADD CONSTRAINT "ApprovalSettingItems_approvalSettingId_fkey" FOREIGN KEY ("approvalSettingId") REFERENCES "ApprovalSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalSettingItems" ADD CONSTRAINT "ApprovalSettingItems_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
