-- CreateEnum
CREATE TYPE "WeightCategory" AS ENUM ('LACE', 'FINGERING', 'SPORT', 'DK', 'WORSTED', 'ARAN', 'BULKY', 'SUPER_BULKY');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('KAKAO', 'GOOGLE', 'GUEST');

-- CreateEnum
CREATE TYPE "PatternSource" AS ENUM ('RAVELRY', 'LINK', 'USER');

-- CreateEnum
CREATE TYPE "CatalogSource" AS ENUM ('RAVELRY', 'USER');

-- CreateEnum
CREATE TYPE "CraftType" AS ENUM ('KNITTING', 'CROCHET', 'BOTH');

-- CreateEnum
CREATE TYPE "UnitSystem" AS ENUM ('METRIC', 'IMPERIAL');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ON_HOLD');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerId" TEXT,
    "nickname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YarnCatalog" (
    "id" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "lineName" TEXT NOT NULL,
    "fiber" TEXT,
    "weightCategory" "WeightCategory",
    "needleSize" TEXT,
    "gaugeStitches" DOUBLE PRECISION,
    "sourceType" "CatalogSource" NOT NULL,
    "ravelryId" INTEGER,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YarnCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Yarn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "catalogId" TEXT,
    "brand" TEXT NOT NULL,
    "lineName" TEXT,
    "colorName" TEXT,
    "fiber" TEXT,
    "weightCategory" "WeightCategory",
    "needleSize" TEXT,
    "gaugeStitches" DOUBLE PRECISION,
    "memo" TEXT,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Yarn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YarnPhoto" (
    "id" TEXT NOT NULL,
    "yarnId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YarnPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YarnBatch" (
    "id" TEXT NOT NULL,
    "yarnId" TEXT NOT NULL,
    "dyeLot" TEXT,
    "skeinCount" INTEGER NOT NULL,
    "weightPerSkeinG" DOUBLE PRECISION NOT NULL,
    "lengthPerSkeinM" DOUBLE PRECISION NOT NULL,
    "inputUnit" "UnitSystem" NOT NULL,
    "purchasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YarnBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pattern" (
    "id" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designer" TEXT,
    "craftType" "CraftType" NOT NULL,
    "weightCategory" "WeightCategory" NOT NULL,
    "requiredMinM" DOUBLE PRECISION NOT NULL,
    "requiredMaxM" DOUBLE PRECISION,
    "requiredUnit" "UnitSystem",
    "gaugeStitches" DOUBLE PRECISION,
    "sourceUrl" TEXT,
    "sourceType" "PatternSource" NOT NULL,
    "ravelryId" INTEGER,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalYarnCatalogId" TEXT,
    "originalYarnBrand" TEXT,
    "originalYarnLine" TEXT,

    CONSTRAINT "Pattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatternBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatternBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "yarnId" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "currentRow" INTEGER NOT NULL DEFAULT 0,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPhoto" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_provider_providerId_key" ON "User"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "YarnCatalog_ravelryId_key" ON "YarnCatalog"("ravelryId");

-- CreateIndex
CREATE INDEX "YarnCatalog_brand_idx" ON "YarnCatalog"("brand");

-- CreateIndex
CREATE INDEX "YarnCatalog_lineName_idx" ON "YarnCatalog"("lineName");

-- CreateIndex
CREATE UNIQUE INDEX "Pattern_ravelryId_key" ON "Pattern"("ravelryId");

-- CreateIndex
CREATE INDEX "Pattern_weightCategory_idx" ON "Pattern"("weightCategory");

-- CreateIndex
CREATE INDEX "Pattern_craftType_idx" ON "Pattern"("craftType");

-- CreateIndex
CREATE INDEX "Pattern_name_idx" ON "Pattern"("name");

-- CreateIndex
CREATE INDEX "Pattern_designer_idx" ON "Pattern"("designer");

-- CreateIndex
CREATE UNIQUE INDEX "PatternBookmark_userId_patternId_key" ON "PatternBookmark"("userId", "patternId");

-- AddForeignKey
ALTER TABLE "YarnCatalog" ADD CONSTRAINT "YarnCatalog_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Yarn" ADD CONSTRAINT "Yarn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Yarn" ADD CONSTRAINT "Yarn_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "YarnCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YarnPhoto" ADD CONSTRAINT "YarnPhoto_yarnId_fkey" FOREIGN KEY ("yarnId") REFERENCES "Yarn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YarnBatch" ADD CONSTRAINT "YarnBatch_yarnId_fkey" FOREIGN KEY ("yarnId") REFERENCES "Yarn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pattern" ADD CONSTRAINT "Pattern_originalYarnCatalogId_fkey" FOREIGN KEY ("originalYarnCatalogId") REFERENCES "YarnCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatternBookmark" ADD CONSTRAINT "PatternBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatternBookmark" ADD CONSTRAINT "PatternBookmark_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_yarnId_fkey" FOREIGN KEY ("yarnId") REFERENCES "Yarn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPhoto" ADD CONSTRAINT "ProjectPhoto_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
