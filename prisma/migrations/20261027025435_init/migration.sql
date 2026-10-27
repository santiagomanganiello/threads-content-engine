-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('BASS_HISTORY', 'COMMUNITY', 'EDUCATION', 'CULTURE', 'HUMOR');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('IDEA', 'GENERATING', 'PENDING_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "PublishAttemptStatus" AS ENUM ('PENDING', 'CONTAINER_CREATED', 'PUBLISHED', 'FAILED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR');

-- CreateTable
CREATE TABLE "content_ideas" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT,
    "category" "PostCategory" NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_posts" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT,
    "text" VARCHAR(500) NOT NULL,
    "hook" TEXT,
    "question" TEXT,
    "category" "PostCategory" NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "externalPostId" TEXT,
    "needsFactCheck" BOOLEAN NOT NULL DEFAULT false,
    "factualClaims" JSONB,
    "generationBatchId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_generations" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "prompt" TEXT,
    "rawResponse" TEXT,
    "tokensPrompt" INTEGER,
    "tokensCompletion" INTEGER,
    "status" "GenerationStatus" NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publish_attempts" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "PublishAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "containerId" TEXT,
    "externalPostId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publish_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_revisions" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "previousText" VARCHAR(500) NOT NULL,
    "newText" VARCHAR(500) NOT NULL,
    "changedBy" TEXT,
    "changeSource" TEXT NOT NULL DEFAULT 'USER_EDIT',
    "invalidatedApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_posts_status_idx" ON "content_posts"("status");

-- CreateIndex
CREATE INDEX "content_posts_category_idx" ON "content_posts"("category");

-- CreateIndex
CREATE INDEX "content_posts_generationBatchId_idx" ON "content_posts"("generationBatchId");

-- CreateIndex
CREATE INDEX "content_posts_scheduledAt_idx" ON "content_posts"("scheduledAt");

-- CreateIndex
CREATE INDEX "content_generations_postId_idx" ON "content_generations"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "publish_attempts_idempotencyKey_key" ON "publish_attempts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "publish_attempts_postId_idx" ON "publish_attempts"("postId");

-- CreateIndex
CREATE INDEX "publish_attempts_status_idx" ON "publish_attempts"("status");

-- CreateIndex
CREATE INDEX "content_revisions_postId_idx" ON "content_revisions"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "content_ideas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_generations" ADD CONSTRAINT "content_generations_postId_fkey" FOREIGN KEY ("postId") REFERENCES "content_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publish_attempts" ADD CONSTRAINT "publish_attempts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "content_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "content_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
