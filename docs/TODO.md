# 해야 할 일

정리 시점: 2026-08-04. 프로젝트 현재 상태(코드/테스트/문서)를 기준으로 남은 작업을 정리함.

## 1. 외부 서비스 연동 설정 — ✅ 전체 완료 (2026-08-04)

코드(OAuth 플로우, Ravelry 호출, Cloudinary 업로드) 구현 + 실제 계정/키 발급 + 라이브 테스트까지 4개 항목 모두 끝남. 배포 도메인이 로컬(`localhost:5173`)과 달라지는 시점에 Redirect URI만 각 콘솔에 추가 등록하면 됨 (3번 인프라 섹션 참고).

### 1-1. 카카오 로그인 — ✅ 완료
- [x] 앱 등록, REST API 키/Client Secret 발급 (Client Secret은 앱 생성 시 기본 활성화라 콘솔에서 코드만 복사)
- [x] Redirect URI 등록 (`/앱/플랫폼 키/REST API 키` 화면의 "카카오 로그인 리다이렉트 URI" — 처음에 등록 안 해서 `KOE006` 에러 났었고, 등록 후 해결 확인)
- [x] 닉네임 동의항목을 "선택 동의"로 설정 + `scope=profile_nickname` 명시적 요청(안 하면 재로그인 시 스킵됨) → 최초 가입 시 자동 채움, 마이페이지에서 수정 가능하게 구현·검증 완료 (커밋 `9786958`)
- [x] 실제 로그인 플로우 브라우저로 end-to-end 검증 (동의 화면 → 콜백 → 로그인 성공)

### 1-2. 구글 로그인 — ✅ 완료
- [x] Google Cloud Console에서 OAuth 클라이언트 생성, Client ID/Secret 발급
- [x] "데이터 액세스"에 `openid`/`email`/`profile` 스코프 등록 (여기 빠져있으면 동의 화면 자체가 안 뜸)
- [x] 승인된 리디렉션 URI 등록
- [x] `VITE_GOOGLE_CLIENT_SECRET`이 프론트 `.env`에 실수로 들어갔던 것 발견 후 제거 (Client Secret은 백엔드 전용, 프론트에 넣으면 번들에 노출됨) — 주의: 다른 값도 비슷한 실수 없는지 배포 전 재점검
- [x] 실제 로그인 플로우 브라우저로 end-to-end 검증, 닉네임(`profile.name`) 자동 채움까지 확인

### 1-3. Ravelry API — ✅ 완료 (2026-08-04)
- [x] ravelry.com/api에서 앱 등록, **Basic Auth: read-only access** 크리덴셜 발급 (personal account access/OAuth는 우리 앱에 과한 권한이라 사용 안 함)
- [x] `basic_auth_username`/`basic_auth_password` → 백엔드 `.env`의 `RAVELRY_API_KEY`/`RAVELRY_API_SECRET`에 입력
- [x] 실제 API 호출로 크리덴셜 동작 확인 (`/yarns/search.json` 등에서 200 OK, `/current_user.json`은 read-only 권한 밖이라 403 — 정상 동작)
- [x] 라이브 응답으로 필드명 재검증 후 `ravelry.service.ts` 수정 완료 (커밋 `fec71d8`)
  - `searchYarns`/`searchPatterns`: `photos[0].small_url` → `first_photo.small_url`
  - `getYarnDetail`: `yarn_company_name` → `yarn_company.name`, `fiber_content_description` → `yarn_fibers` 배열 조합(`formatFiberDescription`)
  - `getPatternDetail`: `designer.name` → `pattern_author.name`
- [x] 기존 unit 테스트 61개 통과 확인, 4개 메서드 전부 실제 API로 end-to-end 검증 완료

### 1-4. Cloudinary — ✅ 완료
- [x] `yarn-stash-unsigned`라는 이름으로 Unsigned 모드 preset 신규 생성 (계정에 다른 프로젝트용 preset이 이미 있어서 재사용하지 않고 새로 만듦)
- [x] 백엔드/프론트엔드 `.env` 둘 다 반영
- [x] 실 등록 폼에서 실제 파일 업로드 → Cloudinary에 저장되고 `<img>`로 정상 렌더링되는 것까지 확인, 테스트 이미지는 정리 완료

## 2. 배포 전 품질 점검

- [x] 백엔드 타입 체크 — CI(`ci.yml` backend 잡)에서 `npx tsc --noEmit`로 매 푸시마다 실행
- [x] 프론트엔드 빌드 확인 — CI(`ci.yml` frontend 잡)에서 `npm run build`(`tsc -b && vite build`)로 매 푸시마다 실행
- [x] 프론트엔드 lint — CI에서 `npm run lint`(oxlint) 실행
- [x] 번역 키 일치 검사 — ✅ 완료 (2026-10-02). CI frontend 잡에 `npm run check-i18n` 추가 (스크립트가 `--experimental-strip-types`를 써서 frontend 잡만 Node 22로 올림)
- [ ] 백엔드 lint — lint 스크립트 자체가 없음, 필요하면 eslint 설정 추가 고려
- [x] e2e 테스트 추가 — ✅ 완료 (2026-08-04). 로컬 Docker Postgres(`backend/docker-compose.test.yml`, `localhost:5433`, 개발용 Neon DB와 분리)를 대상으로 `backend/test/app.e2e-spec.ts` 작성, `npm run test:e2e`로 실행. 아래 3개 플로우 컨트롤러→가드→Prisma 전체 경로로 검증, 4개 테스트 전부 통과
  - 게스트 생성 → 로그인 → 실 등록 → 도안 매칭 조회
  - 게스트 → 소셜 계정 병합(카카오, `mergeGuestInto`) — `global.fetch`를 스텁으로 대체해 실제 카카오 서버 호출 없이 검증
  - 도안 삭제 제약 조건(연결된 프로젝트 있을 때 403 거부)
  - 사용법은 `backend/README.md`의 "e2e 테스트" 섹션 참고
- [x] 프론트엔드 스모크 테스트 — ✅ 완료 (2026-10-06). Vitest + Testing Library(jsdom) 구성, `npm test`로 실행하고 CI frontend 잡에 추가. 앱 라우팅/세션 가드(세션 없음·딥링크·만료 토큰 401), 에러 바운더리(대체 화면·다시 시도·경로 변경 시 해제), `apiClient` 오류 처리(429 번역 문구·서버 message·204), `lib/` 유틸까지 18개 테스트. 개별 화면의 폼/목록 동작은 아직 테스트 없음
- [x] Ravelry 오류 로깅 — ✅ 완료 (2026-10-01). `ravelry.service.ts`의 `get()`이 실패 원인별로 로그를 남김: 401/403은 error(크리덴셜 점검 필요), 429/5xx/네트워크 오류/8초 타임아웃은 warn, 상세 조회 404는 정상 케이스라 로그 없음. 키가 비어 있으면 기동 시 한 번 경고.
- [x] Ravelry 장애 안내 — ✅ 완료 (2026-10-02). 404 외 실패는 `RavelryUnavailableError`(503)로 구분. 검색(`/patterns/search`, `/yarn-catalog/search`)은 로컬 결과를 그대로 주되 응답을 `{ items, ravelryUnavailable }`로 바꿔 화면에 "Ravelry 검색 일시 불가" 안내를 띄우고, 상세 조회(등록 폼 자동 채움/카탈로그 확정)는 503으로 응답해 오류 문구를 표시. 프론트는 예전 배열 응답도 받아주므로(`lib/ravelry.ts`) 배포 순서와 무관
- [x] 프론트 에러 바운더리 — ✅ 완료 (2026-10-02). 렌더링 중 예외가 나도 앱 전체가 빈 화면이 되지 않도록 레이아웃의 `<Outlet />`과 최상위 라우트를 `components/ErrorBoundary.tsx`로 감쌈. 하단 탭바는 바운더리 밖이라 다른 탭으로 이동 가능하고, 경로가 바뀌면 에러 상태가 자동으로 풀림

## 3. 인프라/운영 — ✅ 배포 완료 (2026-08-05)

- [x] CI 파이프라인 구성 — `.github/workflows/ci.yml` 추가, backend(타입체크/유닛/e2e)·frontend(lint/check-i18n/build) 두 잡 모두 그린 확인
- [x] 배포 대상 결정 및 셋업 — 백엔드: Render(Public Git Repository 방식, `start:prod` 스크립트 경로 버그 수정 후 배포 성공), 프론트엔드: Vercel(Vite 프리셋, Root Directory=`frontend`), DB: Neon(기존 개발용과 동일 인스턴스 공유)
  - Vercel SPA 라우팅: `frontend/vercel.json`에 catch-all rewrite 추가 안 하면 `/auth/*/callback` 같은 직접 진입 경로가 404 남 — 추가 후 확인
- [x] CORS/환경변수 점검 — Render `FRONTEND_ORIGIN`, Vercel `VITE_API_BASE_URL` 배포 도메인 기준으로 설정, 카카오/구글 콘솔 + Render + Vercel 4곳 모두 Redirect URI 동기화 완료
- [x] 프로덕션에서 카카오/구글 로그인 실제 end-to-end 검증 완료 (마이페이지에서 닉네임 정상 표시 확인), 테스트 중 생성된 소셜 계정 2개는 정리 완료
- [x] 요청 한도(rate limiting) — ✅ 완료 (2026-10-02). `@nestjs/throttler` 전역 가드, IP 기준 메모리 카운터(`common/throttle.ts`). 기본 분당 120회, 게스트 생성 시간당 20회, Ravelry 검색 분당 60회, Ravelry 상세/카탈로그 확정 분당 30회, `/api/health`는 제외. Render 프록시 뒤라 `trust proxy`를 켜서 X-Forwarded-For 기준으로 구분(헤더 위조로 우회는 가능하지만 다른 사용자가 같이 막히지는 않음). 프론트는 429를 번역된 문구로 보여주고 4xx는 재시도하지 않음
- [ ] 방치된 게스트 계정 정리 배치 — 기획서 2.9에서 1단계 스코프 제외로 명시됨. 실사용 데이터 쌓인 뒤 필요성 확인되면 그때 작업 (지금 당장 우선순위 아님)
- [x] Render 무료 플랜 슬립(15분 미사용 시 인스턴스 정지) 대응 — `GET /api/health`(`app.controller.ts`) 추가, e2e 테스트(`app.e2e-spec.ts`)로 200/`{status:"ok"}` 응답 검증. 처음엔 GitHub Actions cron(`keep-alive.yml`, 10분 간격)으로 핑했으나 실행이 몇 시간씩 밀려 효과가 없어서 워크플로를 삭제하고(커밋 `43aaa79`) UptimeRobot 5분 간격 핑으로 교체

## 4. 포트폴리오/공개 저장소 보완

- [x] 루트 README(한/영)에 스크린샷 추가 — `docs/screenshots/`의 홈/실 목록/도안 목록/프로젝트 상세 4장
- [x] 라이브 데모 링크를 루트 README 상단에 추가
- [ ] GitHub 저장소 설정에서 Description/Topics 채우기 (public 전환 직후라 아직 비어있을 가능성)

## 5. 2단계 기능 (보류, 지금 당장 필요 없음)

- [ ] 나눔/교환 등 공유 기능 (기획서 1번: "1단계는 완전히 개인용, 공유 요소는 2단계로 보류")
- [ ] 찜한 도안 매칭 변경 알림, 오래 방치된 실 리마인드 — 푸시 인프라 필요, 기획서 2.9에서 실사용 데이터 확인 후 검토하기로 명시
