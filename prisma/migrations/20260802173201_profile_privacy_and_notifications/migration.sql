-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notifyMessages" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyProductNews" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyProposals" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showFullName" BOOLEAN NOT NULL DEFAULT false;
