-- CreateTable
CREATE TABLE "ProjectYarnUsage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "yarnId" TEXT NOT NULL,
    "reservedM" DOUBLE PRECISION NOT NULL,
    "usedM" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectYarnUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectYarnUsage_yarnId_idx" ON "ProjectYarnUsage"("yarnId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectYarnUsage_projectId_yarnId_key" ON "ProjectYarnUsage"("projectId", "yarnId");

-- AddForeignKey
ALTER TABLE "ProjectYarnUsage" ADD CONSTRAINT "ProjectYarnUsage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectYarnUsage" ADD CONSTRAINT "ProjectYarnUsage_yarnId_fkey" FOREIGN KEY ("yarnId") REFERENCES "Yarn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: 기존 Project.yarnId 단일 연결을 사용량 레코드로 이관한다.
-- 예약량은 도안의 requiredMinM(가장 작은 사이즈 기준 필요량)을 기본값으로 쓰고,
-- 이미 완료된 프로젝트는 되돌아가 확정 입력을 받을 수 없으므로 같은 값을 실사용량으로 확정 처리한다.
INSERT INTO "ProjectYarnUsage" ("id", "projectId", "yarnId", "reservedM", "usedM", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    p."id",
    p."yarnId",
    pat."requiredMinM",
    CASE WHEN p."status" = 'COMPLETED' THEN pat."requiredMinM" ELSE NULL END,
    p."createdAt",
    CURRENT_TIMESTAMP
FROM "Project" p
JOIN "Pattern" pat ON pat."id" = p."patternId"
WHERE p."yarnId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_yarnId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "yarnId";
