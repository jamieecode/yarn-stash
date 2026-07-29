# 실 스태시 트래커 백엔드 (Nest.js)

## 실행 방법

```bash
npm install
cp .env.example .env   # DATABASE_URL 등 채우기 (Neon 연결 문자열)
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

## 구조

```
src/
  main.ts              # 부트스트랩, CORS, ValidationPipe
  app.module.ts         # 전체 모듈 조립
  prisma/                # PrismaService (전역 모듈)
  common/
    guards/
      auth.guard.ts        # 로그인(게스트 포함) 필수 - 개인 데이터 API용
      optional-auth.guard.ts # 토큰 있으면 심고 없어도 통과 - 공유 데이터 조회용
    decorators/current-user.decorator.ts
  auth/          # 게스트 발급 / 카카오·구글 OAuth / 게스트→계정 데이터 병합
  yarn/          # 실 CRUD (배치 포함) + 도안 매칭
  yarn-catalog/  # 실 카탈로그 검색 (로컬 우선 + Ravelry 폴백)
  pattern/       # 도안 CRUD + 찜(북마크) + 실 매칭
  project/       # 프로젝트 트래커 - 시작/재사용 체크, 진행 상태 관리
```

## 지금 상태 — 뭐가 되고 뭐가 안 되는지

**구현 완료**
- 인증: 게스트 발급, 카카오/구글 OAuth(토큰 교환 → 프로필 조회 → find-or-create), 게스트 → 계정 데이터 병합(`mergeGuestInto`)
- 실: 목록/상세/등록/수정/삭제, 배치(로트) 추가·수정·삭제, 소진 처리
- 도안: 목록/상세/검색/등록/수정/삭제(소유권 + 타인 찜 0건 + 연결 프로젝트 0건 검증), 찜 토글 + 메모
- 매칭: 실 → 도안, 도안 → 실 양방향 (여유분 비율, 게이지 보조 칩, 로트 혼합 안내 포함)
- 외부 연동: Ravelry API 폴백 검색(실/도안), Cloudinary 업로드(프론트에서 직접 unsigned upload)
- 프로젝트: 시작/재사용 체크(진행 중인 프로젝트 있으면 그걸로 이동), 상태·단수·메모·사진 관리

**알려진 제한사항**
- Ravelry API는 자격증명 없이 개발해서, 엔드포인트·필드명이 공개 문서/커뮤니티 라이브러리 기준으로 작성됨 — 실제 키 발급 후 라이브 응답으로 재검증 필요 (`ravelry.service.ts` 상단 주석 참고)
- 자동화된 테스트(unit/e2e)가 아직 없음 — Prisma 스키마와 DTO 타입은 수동으로 대조함 (예: `Pattern.ravelryId`는 스키마상 `Int?`)
- 방치된 게스트 계정 정리 배치 작업 없음 (기획서 2.9, 1단계 스코프 제외)
- 배포 전 `npx tsc --noEmit`으로 전체 타입 체크를 한 번 더 실행하는 것을 권장
