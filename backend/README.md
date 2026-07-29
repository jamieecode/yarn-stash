# 실 스태시 트래커 백엔드 (Nest.js 스켈레톤)

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
  auth/          # 게스트 발급(동작함) / 카카오·구글(다음 단계 TODO)
  yarn/          # 실 CRUD - 목록/상세/등록은 동작, 수정/삭제/매칭은 TODO
  yarn-catalog/  # 실 카탈로그 검색 (Ravelry 폴백은 다음 단계)
  pattern/       # 도안 CRUD - 목록/상세/검색/등록은 동작, 나머지는 TODO
  project/       # 프로젝트 트래커 - 목록/상세/시작(재사용 체크 포함)은 동작, 나머지는 TODO
```

## 지금 상태 — 뭐가 되고 뭐가 안 되는지

**실제로 동작함**
- Prisma 연결, 전체 모듈 조립
- 게스트 발급 → JWT 발급 → `/auth/me`로 검증
- 실 목록/상세/등록 (배치 포함, 단위 정규화)
- 도안 목록/상세/검색/등록 (게스트는 조회만, 등록은 로그인 필요)
- 프로젝트 시작(진행중 프로젝트 재사용 체크 포함)/목록/상세

**의도적으로 TODO로 남겨둔 것** (다음 단계 로드맵의 "2. 인증부터 구현", "3. CRUD API", "4. 매칭 로직"에 해당)
- 카카오/구글 OAuth 실제 연동 + 게스트 데이터 병합 호출
- 실/도안/프로젝트 수정·삭제 (소유권 검증, cascade 처리)
- 도안 ↔ 실 양방향 매칭 쿼리 (게이지·로트·소진 제외 포함)
- 도안 찜(북마크) 토글 + 메모
- Ravelry API 폴백 검색, Cloudinary 업로드 연동

## 검증 관련 안내

Prisma 스키마 필드명·타입을 코드와 하나씩 손으로 대조했고, 그 과정에서
`Pattern.ravelryId` DTO 타입 불일치(스키마는 `Int?`, DTO는 `string`으로 잘못 선언) 하나를 발견해서 고쳤다.
로컬에서 `npm install` 후 `npx tsc --noEmit`으로 한 번 더 확인해보는 것을 권장한다.
