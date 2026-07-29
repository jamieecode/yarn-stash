/**
 * 초기 시드 데이터 스크립트
 *
 * 실행: npx prisma db seed  (package.json의 "prisma.seed" 설정과 연결됨)
 *
 * 정책 (기획서 2.10 참고):
 * - 대량 API 수집이 아니라 관리자가 직접 고른 소수 항목만 넣음
 * - 아래 목록은 "이런 형태로 채우면 된다"는 예시 큐레이션입니다.
 *   실제 배포 전에 각 항목의 무게 카테고리·필요량·바늘 사이즈 등을
 *   Ravelry에서 직접 다시 확인하고, 정확한 ravelryId를 채워 넣어주세요.
 *   (여기서는 실제 Ravelry API를 호출하지 않았으므로 ravelryId는 비워둡니다.)
 */

import { PrismaClient, WeightCategory, CatalogSource, PatternSource, CraftType } from "@prisma/client";

const prisma = new PrismaClient();

async function getOrCreateAdmin() {
  // 실제 운영 계정으로 교체하세요 (카카오/구글 로그인 후 발급된 실제 User.id 권장)
  const existing = await prisma.user.findFirst({
    where: { provider: "GUEST", nickname: "관리자(시드용)" },
  });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      provider: "GUEST",
      providerId: null,
      nickname: "관리자(시드용)",
    },
  });
}

const yarnCatalogSeed: Array<{
  brand: string;
  lineName: string;
  fiber: string;
  weightCategory: WeightCategory;
  needleSize: string;
}> = [
  { brand: "드롭스", lineName: "Nepal", fiber: "울65% 알파카35%", weightCategory: "WORSTED", needleSize: "4.5mm" },
  { brand: "드롭스", lineName: "Baby Merino", fiber: "메리노울100%", weightCategory: "SPORT", needleSize: "3mm" },
  { brand: "드롭스", lineName: "Big Merino", fiber: "메리노울100%", weightCategory: "BULKY", needleSize: "6mm" },
  { brand: "말라브리고", lineName: "Rios", fiber: "메리노울100%", weightCategory: "WORSTED", needleSize: "4.5mm" },
  { brand: "말라브리고", lineName: "Sock", fiber: "메리노울80% 나일론20%", weightCategory: "FINGERING", needleSize: "2.5mm" },
  { brand: "캐스케이드", lineName: "220", fiber: "페루비안울100%", weightCategory: "WORSTED", needleSize: "4.5mm" },
  { brand: "베르소코", lineName: "Vintage", fiber: "아크릴52% 울40% 나일론8%", weightCategory: "WORSTED", needleSize: "4.5mm" },
  { brand: "라이언브랜드", lineName: "Wool-Ease", fiber: "아크릴80% 울20%", weightCategory: "WORSTED", needleSize: "5mm" },
  { brand: "로완", lineName: "Kidsilk Haze", fiber: "모헤어70% 실크30%", weightCategory: "LACE", needleSize: "4mm" },
  { brand: "데비블리스", lineName: "Rialto DK", fiber: "메리노울100%", weightCategory: "DK", needleSize: "4mm" },
  { brand: "산네스간", lineName: "Alpakka", fiber: "알파카100%", weightCategory: "SPORT", needleSize: "3mm" },
  { brand: "니트픽스", lineName: "Wool of the Andes", fiber: "페루비안울100%", weightCategory: "WORSTED", needleSize: "4mm" },
  { brand: "말라브리고", lineName: "Worsted", fiber: "메리노울100%", weightCategory: "WORSTED", needleSize: "5mm" },
  { brand: "드롭스", lineName: "Air", fiber: "알파카70% 울30%", weightCategory: "ARAN", needleSize: "5.5mm" },
];

const patternSeed: Array<{
  name: string;
  designer: string;
  craftType: CraftType;
  weightCategory: WeightCategory;
  requiredMinM: number;
  requiredMaxM?: number;
  sourceUrl?: string;
}> = [
  { name: "Weekender Sweater", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "DK", requiredMinM: 900, requiredMaxM: 1300 },
  { name: "Comfy Cardigan", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 1000, requiredMaxM: 1500 },
  { name: "Antler Cardigan", designer: "Andrea Mowry", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 1300, requiredMaxM: 1900 },
  { name: "Sockhead Hat", designer: "Kelly McClure", craftType: "KNITTING", weightCategory: "FINGERING", requiredMinM: 350, requiredMaxM: 400 },
  { name: "Simple Lines Beanie", designer: "Nimble Needles", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 150, requiredMaxM: 200 },
  { name: "Log Cabin Blanket", designer: "Isabell Kraemer", craftType: "KNITTING", weightCategory: "BULKY", requiredMinM: 2000, requiredMaxM: 2600 },
  { name: "Whimsical Cardigan", designer: "Isabell Kraemer", craftType: "KNITTING", weightCategory: "SPORT", requiredMinM: 900, requiredMaxM: 1400 },
  { name: "Songbird Sweater", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "DK", requiredMinM: 950, requiredMaxM: 1350 },
  { name: "No Frills Sweater", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 1000, requiredMaxM: 1450 },
  { name: "Delilah Cardigan", designer: "Joji Locatelli", craftType: "KNITTING", weightCategory: "ARAN", requiredMinM: 1100, requiredMaxM: 1600 },
];

async function main() {
  const admin = await getOrCreateAdmin();
  console.log(`관리자 계정: ${admin.id}`);

  for (const y of yarnCatalogSeed) {
    await prisma.yarnCatalog.upsert({
      where: {
        // brand+lineName 조합에 unique 제약이 없으므로, 실제 마이그레이션 시
        // @@unique([brand, lineName]) 추가를 고려하거나 findFirst 후 create로 대체하세요.
        // 여기서는 seed 재실행 시 중복 방지를 위해 ravelryId 대신 임시 처리합니다.
        id: `seed-yarn-${y.brand}-${y.lineName}`.replace(/\s+/g, "-"),
      },
      update: {},
      create: {
        id: `seed-yarn-${y.brand}-${y.lineName}`.replace(/\s+/g, "-"),
        createdByUserId: admin.id,
        brand: y.brand,
        lineName: y.lineName,
        fiber: y.fiber,
        weightCategory: y.weightCategory,
        needleSize: y.needleSize,
        sourceType: CatalogSource.USER, // 실제 Ravelry API로 확인 후 RAVELRY + ravelryId로 교체 권장
      },
    });
  }
  console.log(`YarnCatalog ${yarnCatalogSeed.length}건 완료`);

  for (const p of patternSeed) {
    await prisma.pattern.upsert({
      where: {
        id: `seed-pattern-${p.name}-${p.designer}`.replace(/\s+/g, "-"),
      },
      update: {},
      create: {
        id: `seed-pattern-${p.name}-${p.designer}`.replace(/\s+/g, "-"),
        createdByUserId: admin.id,
        name: p.name,
        designer: p.designer,
        craftType: p.craftType,
        weightCategory: p.weightCategory,
        requiredMinM: p.requiredMinM,
        requiredMaxM: p.requiredMaxM,
        requiredUnit: "METRIC",
        sourceType: PatternSource.USER, // 실제 Ravelry API로 확인 후 RAVELRY + ravelryId로 교체 권장
        sourceUrl: p.sourceUrl,
      },
    });
  }
  console.log(`Pattern ${patternSeed.length}건 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
