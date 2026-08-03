-- AlterTable
ALTER TABLE "users" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "payoutHolderName" TEXT;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- Grandfather existing accounts: anyone who already confirmed their email is
-- approved — the manual-review gate applies to new registrations only.
UPDATE "users" SET "approvedAt" = CURRENT_TIMESTAMP
WHERE "approvedAt" IS NULL AND "emailVerified" IS NOT NULL;
