# 실 스태시 트래커 백엔드 (Nest.js)

[English](README.en.md)

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
  ravelry/       # Ravelry API 클라이언트 (yarn-catalog, pattern에서 공용으로 사용)
  pattern/       # 도안 CRUD + 찜(북마크) + 실 매칭
  project/       # 프로젝트 트래커 - 시작/재사용 체크, 진행 상태 관리, 실 사용량(재고 차감)
  dashboard/     # 홈 화면 집계 - 스태시 총량/굵기별 분포/프로젝트 현황/바로 뜰 수 있는 도안
```

## 테스트

```bash
npm test        # unit 테스트 전체 실행
npm run test:cov # 커버리지 포함
```

핵심 비즈니스 로직(매칭 비율·게이지·로트 혼합 계산, 단위 변환, 소유권 검증, 게스트→계정 병합, 도안 삭제 가능 조건 등) 위주로 서비스 unit 테스트를 작성했다. `PrismaService`는 목(mock)으로 대체하므로 실제 DB 없이 실행된다.

### e2e 테스트

컨트롤러·가드·Prisma를 전부 실제로 거치는 통합 테스트. 로컬 Docker로 띄운 별도 Postgres(개발용 Neon DB와 분리)를 대상으로 한다.

```bash
docker compose -f docker-compose.test.yml up -d   # 테스트 전용 Postgres 컨테이너 (localhost:5433)
cp .env.example .env.test                          # DATABASE_URL만 아래 값으로 교체
# DATABASE_URL="postgresql://postgres:test@localhost:5433/yarn_stash_test"
npx dotenv -e .env.test -- npx prisma migrate deploy   # 스키마 적용 (최초 1회, 마이그레이션 추가될 때마다 재실행)
npm run test:e2e
```

게스트 생성→실 등록→매칭 조회, 게스트→카카오 계정 병합, 도안 삭제 제약 조건(찜/연결 프로젝트), 프로젝트 실 사용량↔재고 차감(예약→확정→복구), 홈 대시보드 집계 다섯 가지 핵심 플로우를 검증한다 (`test/app.e2e-spec.ts`). 카카오/구글 등 외부 OAuth 호출은 `global.fetch`를 스텁으로 대체해 실제 네트워크 요청 없이 우리 쪽 로직만 검증한다.

## 지금 상태 — 뭐가 되고 뭐가 안 되는지

**구현 완료**
- 인증: 게스트 발급, 카카오/구글 OAuth(토큰 교환 → 프로필 조회 → find-or-create), 게스트 → 계정 데이터 병합(`mergeGuestInto`)
- 실: 목록/상세/등록/수정/삭제, 배치(로트) 추가·수정·삭제, 소진 처리
- 도안: 목록/상세/검색/등록/수정/삭제(소유권 + 타인 찜 0건 + 연결 프로젝트 0건 검증), 찜 토글 + 메모
- 매칭: 실 → 도안, 도안 → 실 양방향 (여유분 비율, 게이지 보조 칩, 로트 혼합 안내 포함). 판정 기준은 총 보유량이 아니라 **가용량**(다른 프로젝트가 잡고 있는 양을 뺀 값)
- 재고 차감: 프로젝트가 실을 잡으면(`ProjectYarnUsage`) 그만큼 가용량이 줄고, 완료 시 실사용량으로 확정, 연결 해제/프로젝트 삭제 시 자동 복구. `YarnBatch`는 절대 깎지 않는 비파괴 방식이라 이력이 남고 되돌릴 수 있음
- 외부 연동: Ravelry API 폴백 검색(실/도안), Cloudinary 업로드(프론트에서 직접 unsigned upload)
- 프로젝트: 시작/재사용 체크(진행 중인 프로젝트 있으면 그걸로 이동), 상태·단수·메모·사진 관리, 실 연결/예약량 조정/해제(`/projects/:id/yarns`), 완료 시 실사용량 확정(`confirmUsages`)
- 홈 대시보드(`GET /dashboard`): 스태시 총량(보유/사용중/가용), 굵기별 분포, 프로젝트 상태별 개수, 찜 개수, "지금 바로 뜰 수 있는 도안" 집계. 실 하나의 가용량만으로 필요량이 커버되는 도안만 세고, 여러 실을 합쳐야 하는 경우는 제외한다(로트가 다르면 실제로 못 뜨는 경우가 많음)
- 핵심 서비스 로직 unit 테스트 (auth/yarn/pattern/project 서비스 + 매칭·단위 변환 유틸) + 핵심 플로우 e2e 테스트 (로컬 Docker Postgres 대상)
- Ravelry API 실제 키로 라이브 검증 완료, 필드 매핑 버그 수정 (`ravelry.service.ts`)

**알려진 제한사항**
- 방치된 게스트 계정 정리 배치 작업 없음 (기획서 2.9, 1단계 스코프 제외)
- 배포 전 `npx tsc --noEmit`으로 전체 타입 체크를 한 번 더 실행하는 것을 권장
