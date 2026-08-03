-- CreateEnum
CREATE TYPE "JobSourceType" AS ENUM ('REMOTEOK', 'WEWORKREMOTELY', 'GREENHOUSE', 'LEVER');

-- CreateEnum
CREATE TYPE "RecruiterEmailOrigin" AS ENUM ('PUBLISHED', 'ATS_REPLY', 'PATTERN', 'ROLE_GUESS', 'ENRICHMENT');

-- CreateEnum
CREATE TYPE "RecruiterEmailStatus" AS ENUM ('UNVERIFIED', 'MX_OK', 'DELIVERABLE', 'CATCH_ALL', 'RISKY', 'UNDELIVERABLE', 'SUPPRESSED');

-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'UNCLAIMED';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "emailedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "job_sources" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "source" "JobSourceType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "applyUrl" TEXT,
    "publishedEmail" TEXT,
    "contentHash" TEXT NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiter_contacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyDomain" TEXT,
    "email" TEXT NOT NULL,
    "origin" "RecruiterEmailOrigin" NOT NULL,
    "patternUsed" TEXT,
    "status" "RecruiterEmailStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCatchAll" BOOLEAN NOT NULL DEFAULT false,
    "contactable" BOOLEAN NOT NULL DEFAULT false,
    "bounceCount" INTEGER NOT NULL DEFAULT 0,
    "lastBounceAt" TIMESTAMP(3),
    "suppressedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruiter_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiter_access_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruiter_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_sources_jobId_key" ON "job_sources"("jobId");

-- CreateIndex
CREATE INDEX "job_sources_contentHash_idx" ON "job_sources"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "job_sources_source_externalId_key" ON "job_sources"("source", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_contacts_userId_key" ON "recruiter_contacts"("userId");

-- CreateIndex
CREATE INDEX "recruiter_contacts_status_contactable_idx" ON "recruiter_contacts"("status", "contactable");

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_access_tokens_token_key" ON "recruiter_access_tokens"("token");

-- CreateIndex
CREATE INDEX "recruiter_access_tokens_token_idx" ON "recruiter_access_tokens"("token");

-- CreateIndex
CREATE INDEX "recruiter_access_tokens_userId_idx" ON "recruiter_access_tokens"("userId");

-- AddForeignKey
ALTER TABLE "job_sources" ADD CONSTRAINT "job_sources_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_contacts" ADD CONSTRAINT "recruiter_contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_access_tokens" ADD CONSTRAINT "recruiter_access_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
