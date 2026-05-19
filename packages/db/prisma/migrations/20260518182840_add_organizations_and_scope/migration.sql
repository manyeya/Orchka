-- AlterTable
ALTER TABLE "credential" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "execution" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "execution_stat" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "activeOrganizationId" TEXT;

-- AlterTable
ALTER TABLE "workflow" ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviterId" TEXT NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "member"("organizationId");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "credential_organizationId_idx" ON "credential"("organizationId");

-- CreateIndex
CREATE INDEX "execution_organizationId_startedAt_idx" ON "execution"("organizationId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "execution_organizationId_status_startedAt_idx" ON "execution"("organizationId", "status", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "execution_stat_organizationId_date_idx" ON "execution_stat"("organizationId", "date" DESC);

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "workflow_organizationId_idx" ON "workflow"("organizationId");

-- CreateIndex
CREATE INDEX "workflow_organizationId_updatedAt_idx" ON "workflow"("organizationId", "updatedAt" DESC);

-- AddForeignKey
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential" ADD CONSTRAINT "credential_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution" ADD CONSTRAINT "execution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_stat" ADD CONSTRAINT "execution_stat_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Backfill: every user with existing workflows/credentials/executions gets
-- a "Personal" org as the owner. All their rows are reassigned to that org
-- so the NOT NULL constraint can be applied at the bottom.
-- ---------------------------------------------------------------------------

-- 1. Create one personal organization per user that has any owned data.
WITH users_with_data AS (
    SELECT DISTINCT u.id, u.name, u.email
    FROM "user" u
    WHERE EXISTS (SELECT 1 FROM "workflow" WHERE "userId" = u.id)
       OR EXISTS (SELECT 1 FROM "credential" WHERE "userId" = u.id)
       OR EXISTS (SELECT 1 FROM "execution" WHERE "userId" = u.id)
       OR EXISTS (SELECT 1 FROM "execution_stat" WHERE "userId" = u.id)
)
INSERT INTO "organization" ("id", "name", "slug", "createdAt", "metadata")
SELECT
    gen_random_uuid()::text,
    'Personal',
    -- Slug must be unique per organization; fall back to the user id for
    -- uniqueness across users that share a display name.
    'personal-' || substring(u.id from 1 for 8) || '-' || substring(md5(u.id) from 1 for 6),
    NOW(),
    json_build_object('personal', true, 'userId', u.id)::text
FROM users_with_data u;

-- 2. Make each user the owner of their personal org.
INSERT INTO "member" ("id", "organizationId", "userId", "role", "createdAt")
SELECT
    gen_random_uuid()::text,
    o.id,
    (o.metadata::json ->> 'userId'),
    'owner',
    NOW()
FROM "organization" o
WHERE o.metadata IS NOT NULL
  AND (o.metadata::json ->> 'personal') = 'true';

-- 3. Reassign every owned row to that org.
UPDATE "workflow" w
SET "organizationId" = m."organizationId"
FROM "member" m
WHERE m."userId" = w."userId"
  AND w."organizationId" IS NULL;

UPDATE "credential" c
SET "organizationId" = m."organizationId"
FROM "member" m
WHERE m."userId" = c."userId"
  AND c."organizationId" IS NULL;

UPDATE "execution" e
SET "organizationId" = m."organizationId"
FROM "member" m
WHERE m."userId" = e."userId"
  AND e."organizationId" IS NULL;

UPDATE "execution_stat" es
SET "organizationId" = m."organizationId"
FROM "member" m
WHERE m."userId" = es."userId"
  AND es."organizationId" IS NULL;

-- 4. Set every existing session's activeOrganizationId to the user's
-- personal org so the moment the user reloads, their data is visible.
UPDATE "session" s
SET "activeOrganizationId" = m."organizationId"
FROM "member" m
WHERE m."userId" = s."userId"
  AND s."activeOrganizationId" IS NULL;

-- 5. Now lock the NOT NULL constraints. Any rows still NULL would fail
-- here, which is the safety check we want.
ALTER TABLE "workflow" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "credential" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "execution" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "execution_stat" ALTER COLUMN "organizationId" SET NOT NULL;
