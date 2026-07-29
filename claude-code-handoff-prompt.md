# 실 스태시 트래커 — Claude Code 작업 프롬프트

## 배경

"실 스태시 트래커"라는 뜨개 재고 관리 앱을 기획 중이야. 기획서·화면설계서·Prisma 스키마·seed 스크립트·Nest.js 백엔드 스켈레톤·React 프로토타입까지 이미 만들어져 있어. 이 프로젝트 폴더에 아래 파일들을 넣어뒀으니 먼저 다 읽어봐:

- `실_스태시_트래커_기획서.md` — 기능 정의, 데이터 모델, 정책 결정 사항
- `실_스태시_트래커_화면설계서.md` — 화면별 구성/상태/연결 API 명세
- `backend/` — Nest.js 스켈레톤 (Prisma 연결·게스트 인증·기본 CRUD 일부만 동작, 나머지는 TODO 주석)
- `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`
- `yarn-stash-prototype.jsx` — React 프로토타입. **UI/인터랙션 스펙북 용도**이지 프로덕션 코드 아님 (useState로 화면 전환, 목업 데이터 사용). 화면 흐름·디자인 토큰 참고용으로만 쓰고 그대로 복붙하지 말 것.

## 확정된 핵심 설계 원칙 (반드시 지켜줘)

1. **인증**: 게스트 우선. 첫 화면에서 카카오/구글 로그인 또는 게스트 시작 중 선택. JWT를 **localStorage**에 저장하고 `Authorization: Bearer` 헤더로 전달 (쿠키 아님 — 프론트/백엔드 도메인이 분리돼 있어서).
2. **데이터 소유권**:
   - 개인 데이터(`Yarn`, `PatternBookmark`, `Project`) — 게스트도 쓰기 가능, `userId` 필수
   - 공유 데이터(`Pattern`, `YarnCatalog`) — 조회는 게스트 가능, **등록/수정은 로그인(비게스트)만** 가능. `createdByUserId`가 등록한 사람, 수정 권한 판별 기준
3. **게스트 → 계정 전환 시 데이터 병합**: 로그인하면 게스트로 쌓인 `Yarn`/`PatternBookmark`/`Project`의 `userId`를 새 계정으로 일괄 재할당 (`backend/src/auth/auth.service.ts`의 `mergeGuestInto` 참고, 아직 호출 안 돼 있음)
4. **매칭 로직 (실↔도안 양방향)**:
   - 무게 카테고리 일치 + `requiredMinM` 대비 보유 야드 비율(%) — **100% 미만도 숨기지 않고 "부족함" 칩으로 표시** (130%+ 여유있음 / 110~130% 충분함 / 100~110% 타이트함 / 100%미만 부족함)
   - `Yarn.consumed = true`(소진 처리)인 실은 매칭에서 반드시 제외
   - 게이지(`gaugeStitches`) 비교는 하드 필터 아니고 ±1콧수 이내면 "게이지 일치" 보조 칩만 추가
   - 로트(`dyeLot`) 인식: 합계는 충분한데 최대 단일 로트로는 부족하면 "로트를 섞어야 해요" 보조 안내
5. **삭제 정책**: 실 삭제는 자유(연결된 Project는 `onDelete: SetNull`로 연결만 해제). 도안 삭제는 **본인 외 찜 0건 + 연결된 Project 0건**일 때만 가능.
6. **Project**: `userId`+`patternId` 유니크 제약 없음(완료 후 재작업 가능해야 해서) — "이미 진행 중인 프로젝트가 있으면 새로 안 만들고 기존으로 이동"은 `status = IN_PROGRESS` 조건까지 포함해서 **애플리케이션 레벨에서 체크**해야 함 (`backend/src/project/project.service.ts`의 `startOrResume` 참고).
7. **필수 셀렉트는 기본값을 미리 선택해두지 않기**: 특히 `Pattern.craftType`/`weightCategory`처럼 공유 데이터에 영향 주는 필드는 프론트에서 명시적으로 고르기 전엔 제출 불가능하게 (실수로 잘못된 값이 커뮤니티 데이터를 오염시키는 걸 방지).
8. **이미지**: 사용자 업로드 사진(실/프로젝트 진행 사진)만 Cloudinary에 올리고 `photoUrl`/`publicId` 저장. Ravelry 등 외부 썸네일은 절대 재호스팅하지 말고 URL만 저장.
9. **Ravelry 연동**: 실제 API 스펙(yardage가 범위로 오는 경우가 흔함, weight 카테고리에 Aran 별도 존재 등)을 절대 추측하지 말고, 반드시 Ravelry 공식 API 문서를 직접 확인하면서 구현할 것.

## 지금 해야 할 작업 (순서대로)

### 1. 인증 완성
- 카카오/구글 OAuth 실제 연동 (`backend/src/auth/auth.service.ts`의 `loginWithKakao`/`loginWithGoogle` — 현재 `NotImplementedException` 상태)
- 로그인 성공 시 `mergeGuestInto` 호출해서 게스트 데이터 이관
- 프론트에 로그인/게스트 시작 화면 구현 (프로토타입의 `LoginScreen` 참고, 실제 라우팅·API 연동으로 다시 작성)

### 2. CRUD 완성
각 서비스 파일에 `NotImplementedException`으로 남겨둔 메서드들 구현:
- `yarn.service.ts`: `update`, `remove`, `findPatternMatches`
- `pattern.service.ts`: `update`, `remove`, `findYarnMatches`, `toggleBookmark` (+ 검색 시 Ravelry 폴백)
- `project.service.ts`: `update`, `remove`

### 3. 매칭 로직
위 "확정된 핵심 설계 원칙 4번"을 그대로 쿼리로 옮기기. 양방향(실→도안, 도안→실) 모두 구현.

### 4. Ravelry API 연동
`yarn-catalog.service.ts`와 `pattern.service.ts`의 검색에 Ravelry 폴백 추가. 사용자가 선택한 항목만 `ravelryId` 기준 upsert로 캐싱.

### 5. Cloudinary 업로드
클라이언트 unsigned upload preset 방식으로 프론트에서 직접 업로드, 반환 URL만 백엔드에 저장.

### 6. 프론트엔드 (React + Vite)
- 프로토타입을 화면 흐름·디자인 스펙으로 참고해서 **새로 구현**: React Router로 실제 라우팅, React Query로 데이터 페칭, 목업 데이터 전부 실제 API 호출로 교체
- Next.js 아님 — 이 프로젝트는 React(Vite)+Nest.js 조합으로 포트폴리오에 남기기로 결정된 것 (별도 프로젝트에서 Next.js를 쓸 계획이라 스택을 의도적으로 구분함)

## 작업 방식

- 애매하거나 기획서/화면설계서에 없는 결정이 필요하면, 추측해서 진행하지 말고 먼저 물어봐줘.
- 스키마를 변경해야 하면 `backend/prisma/schema.prisma` 수정 후 마이그레이션까지 챙겨줘.
- 각 기능 구현 후 간단히라도 동작 확인(컴파일, 실제 요청 테스트)하고 다음으로 넘어가줘.
