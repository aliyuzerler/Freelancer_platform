-- CreateEnum
CREATE TYPE "IdentityStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'PROCESSING', 'VERIFIED', 'FAILED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "identityProvider" TEXT,
ADD COLUMN     "identityRef" TEXT,
ADD COLUMN     "identityStatus" "IdentityStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "identityVerifiedAt" TIMESTAMP(3);
