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
  gaugeStitches: number;
}> = [
  { brand: "드롭스", lineName: "Nepal", fiber: "울65% 알파카35%", weightCategory: "WORSTED", needleSize: "4.5mm", gaugeStitches: 18 },
  { brand: "드롭스", lineName: "Baby Merino", fiber: "메리노울100%", weightCategory: "SPORT", needleSize: "3mm", gaugeStitches: 24 },
  { brand: "드롭스", lineName: "Big Merino", fiber: "메리노울100%", weightCategory: "BULKY", needleSize: "6mm", gaugeStitches: 14 },
  { brand: "드롭스", lineName: "Air", fiber: "알파카70% 울30%", weightCategory: "ARAN", needleSize: "5.5mm", gaugeStitches: 16 },
  { brand: "드롭스", lineName: "Kid-Silk", fiber: "모헤어75% 실크25%", weightCategory: "LACE", needleSize: "4mm", gaugeStitches: 30 },
  { brand: "말라브리고", lineName: "Rios", fiber: "메리노울100%", weightCategory: "WORSTED", needleSize: "4.5mm", gaugeStitches: 18 },
  { brand: "말라브리고", lineName: "Sock", fiber: "메리노울80% 나일론20%", weightCategory: "FINGERING", needleSize: "2.5mm", gaugeStitches: 28 },
  { brand: "말라브리고", lineName: "Worsted", fiber: "메리노울100%", weightCategory: "WORSTED", needleSize: "5mm", gaugeStitches: 17 },
  { brand: "말라브리고", lineName: "Rasta", fiber: "메리노울100%", weightCategory: "SUPER_BULKY", needleSize: "10mm", gaugeStitches: 9 },
  { brand: "캐스케이드", lineName: "220", fiber: "페루비안울100%", weightCategory: "WORSTED", needleSize: "4.5mm", gaugeStitches: 18 },
  { brand: "캐스케이드", lineName: "220 Superwash Sport", fiber: "페루비안울100%", weightCategory: "SPORT", needleSize: "3.25mm", gaugeStitches: 24 },
  { brand: "베르소코", lineName: "Vintage", fiber: "아크릴52% 울40% 나일론8%", weightCategory: "WORSTED", needleSize: "4.5mm", gaugeStitches: 18 },
  { brand: "라이언브랜드", lineName: "Wool-Ease", fiber: "아크릴80% 울20%", weightCategory: "WORSTED", needleSize: "5mm", gaugeStitches: 18 },
  { brand: "라이언브랜드", lineName: "Wool-Ease Thick & Quick", fiber: "아크릴80% 울20%", weightCategory: "SUPER_BULKY", needleSize: "9mm", gaugeStitches: 8 },
  { brand: "로완", lineName: "Kidsilk Haze", fiber: "모헤어70% 실크30%", weightCategory: "LACE", needleSize: "4mm", gaugeStitches: 30 },
  { brand: "로완", lineName: "Alpaca Soft DK", fiber: "알파카75% 메리노울25%", weightCategory: "DK", needleSize: "4mm", gaugeStitches: 22 },
  { brand: "데비블리스", lineName: "Rialto DK", fiber: "메리노울100%", weightCategory: "DK", needleSize: "4mm", gaugeStitches: 22 },
  { brand: "산네스간", lineName: "Alpakka", fiber: "알파카100%", weightCategory: "SPORT", needleSize: "3mm", gaugeStitches: 24 },
  { brand: "니트픽스", lineName: "Wool of the Andes", fiber: "페루비안울100%", weightCategory: "WORSTED", needleSize: "4mm", gaugeStitches: 20 },
  { brand: "노로", lineName: "Kureyon", fiber: "울100% (멀티컬러)", weightCategory: "WORSTED", needleSize: "5mm", gaugeStitches: 18 },
  { brand: "카티아", lineName: "Concept Cotton-Merino", fiber: "면50% 메리노울50%", weightCategory: "DK", needleSize: "4mm", gaugeStitches: 22 },
  { brand: "리코디자인", lineName: "Essentials Mega Wool", fiber: "울100%", weightCategory: "SUPER_BULKY", needleSize: "10mm", gaugeStitches: 9 },
  { brand: "스키피스", lineName: "Stone Washed", fiber: "면78% 아크릴22%", weightCategory: "SPORT", needleSize: "3.5mm", gaugeStitches: 22 },
  { brand: "페이튼스", lineName: "Classic Wool", fiber: "울100%", weightCategory: "WORSTED", needleSize: "4.5mm", gaugeStitches: 18 },
  { brand: "베르제르드프랑스", lineName: "Magic Degrade", fiber: "아크릴70% 울30%", weightCategory: "ARAN", needleSize: "6mm", gaugeStitches: 16 },
  { brand: "웨스트요크셔스피너스", lineName: "Bo Peep", fiber: "메리노울100%", weightCategory: "FINGERING", needleSize: "3mm", gaugeStitches: 28 },
];

const patternSeed: Array<{
  name: string;
  designer: string;
  craftType: CraftType;
  weightCategory: WeightCategory;
  requiredMinM: number;
  requiredMaxM?: number;
  gaugeStitches?: number;
  sourceUrl?: string;
}> = [
  { name: "Weekender Sweater", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "DK", requiredMinM: 900, requiredMaxM: 1300, gaugeStitches: 22 },
  { name: "Comfy Cardigan", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 1000, requiredMaxM: 1500, gaugeStitches: 18 },
  { name: "Antler Cardigan", designer: "Andrea Mowry", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 1300, requiredMaxM: 1900, gaugeStitches: 18 },
  { name: "Sockhead Hat", designer: "Kelly McClure", craftType: "KNITTING", weightCategory: "FINGERING", requiredMinM: 350, requiredMaxM: 400, gaugeStitches: 28 },
  { name: "Simple Lines Beanie", designer: "Nimble Needles", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 150, requiredMaxM: 200, gaugeStitches: 18 },
  { name: "Log Cabin Blanket", designer: "Isabell Kraemer", craftType: "KNITTING", weightCategory: "BULKY", requiredMinM: 2000, requiredMaxM: 2600, gaugeStitches: 14 },
  { name: "Whimsical Cardigan", designer: "Isabell Kraemer", craftType: "KNITTING", weightCategory: "SPORT", requiredMinM: 900, requiredMaxM: 1400, gaugeStitches: 24 },
  { name: "Songbird Sweater", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "DK", requiredMinM: 950, requiredMaxM: 1350, gaugeStitches: 22 },
  { name: "No Frills Sweater", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 1000, requiredMaxM: 1450, gaugeStitches: 18 },
  { name: "Delilah Cardigan", designer: "Joji Locatelli", craftType: "KNITTING", weightCategory: "ARAN", requiredMinM: 1100, requiredMaxM: 1600, gaugeStitches: 17 },
  { name: "Chunky Knit Blanket", designer: "Lauren Aston", craftType: "KNITTING", weightCategory: "SUPER_BULKY", requiredMinM: 900, requiredMaxM: 1200, gaugeStitches: 8 },
  { name: "Faroese-Inspired Shawl", designer: "Anne Hanson", craftType: "KNITTING", weightCategory: "LACE", requiredMinM: 600, requiredMaxM: 900, gaugeStitches: 28 },
  { name: "Everyday Socks", designer: "Cookie A", craftType: "KNITTING", weightCategory: "FINGERING", requiredMinM: 380, requiredMaxM: 420, gaugeStitches: 30 },
  { name: "Summer Breeze Tee", designer: "Joji Locatelli", craftType: "KNITTING", weightCategory: "SPORT", requiredMinM: 700, requiredMaxM: 1000, gaugeStitches: 24 },
  { name: "Classic Aran Sweater", designer: "Alice Starmore", craftType: "KNITTING", weightCategory: "ARAN", requiredMinM: 1400, requiredMaxM: 1900, gaugeStitches: 17 },
  { name: "Solid Granny Throw", designer: "Sarah London", craftType: "CROCHET", weightCategory: "WORSTED", requiredMinM: 800, requiredMaxM: 1200, gaugeStitches: 14 },
  { name: "Modern Granny Bag", designer: "TL Yarn Crafts", craftType: "CROCHET", weightCategory: "DK", requiredMinM: 300, gaugeStitches: 20 },
  { name: "Coastal Crochet Cardigan", designer: "Made with a Twist", craftType: "CROCHET", weightCategory: "ARAN", requiredMinM: 1200, requiredMaxM: 1700, gaugeStitches: 15 },
  { name: "Textured Market Bag", designer: "TL Yarn Crafts", craftType: "BOTH", weightCategory: "WORSTED", requiredMinM: 250, gaugeStitches: 18 },
  { name: "Cozy Wrap Scarf", designer: "Melanie Berg", craftType: "BOTH", weightCategory: "BULKY", requiredMinM: 400, gaugeStitches: 12 },

  // PetiteKnit 인기 도안 추가 큐레이션 (사용자 요청) - Ravelry 디자이너 페이지에서 이름/즐겨찾기 수만 확인,
  // 실제 Ravelry API 키가 없어 정확한 필요량·게이지는 확인 못 함 - 스타일(홀드더블 스트랜드, 오버사이즈 핏) 기준
  // 추정치이며 배포 전 반드시 Ravelry에서 실제 값으로 교체할 것 (기획서 9번 원칙과 동일)
  { name: "Frankie Sweater", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "DK", requiredMinM: 1000, requiredMaxM: 1400, gaugeStitches: 22 },
  { name: "Ivy Sweater", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "DK", requiredMinM: 1000, requiredMaxM: 1400, gaugeStitches: 22 },
  { name: "Ivy Top", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "DK", requiredMinM: 600, requiredMaxM: 900, gaugeStitches: 22 },
  { name: "Ivy Blouse", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "DK", requiredMinM: 700, requiredMaxM: 1000, gaugeStitches: 22 },
  { name: "Hannah Sweater V-neck", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "DK", requiredMinM: 900, requiredMaxM: 1300, gaugeStitches: 22 },
  { name: "Uma Scarf", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "LACE", requiredMinM: 400, requiredMaxM: 600, gaugeStitches: 28 },
  { name: "Valerie Blouse", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "SPORT", requiredMinM: 700, requiredMaxM: 1000, gaugeStitches: 24 },
  { name: "Ida Tee", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "SPORT", requiredMinM: 500, requiredMaxM: 800, gaugeStitches: 24 },
  { name: "Anker's Sweater - My Size", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 1200, requiredMaxM: 1700, gaugeStitches: 18 },
  { name: "Anna's Cardigan - My Size", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "DK", requiredMinM: 800, requiredMaxM: 1100, gaugeStitches: 22 },
  { name: "Anna's Summer Cardigan", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "SPORT", requiredMinM: 700, requiredMaxM: 1000, gaugeStitches: 24 },
  { name: "Emmy Top", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "DK", requiredMinM: 500, requiredMaxM: 700, gaugeStitches: 22 },
  { name: "Alice Top", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "SPORT", requiredMinM: 500, requiredMaxM: 750, gaugeStitches: 24 },
  { name: "Cumulus Blouse", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "LACE", requiredMinM: 600, requiredMaxM: 900, gaugeStitches: 28 },
  { name: "Como Bag", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 200, requiredMaxM: 350, gaugeStitches: 18 },
  { name: "Julie Bag", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "WORSTED", requiredMinM: 200, requiredMaxM: 350, gaugeStitches: 18 },
  { name: "Terrazzo Bag", designer: "PetiteKnit", craftType: "KNITTING", weightCategory: "DK", requiredMinM: 250, requiredMaxM: 400, gaugeStitches: 22 },
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
        gaugeStitches: y.gaugeStitches,
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
        gaugeStitches: p.gaugeStitches,
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
