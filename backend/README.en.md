# Yarn Stash Tracker Backend (Nest.js)

[한국어](README.md)

## Getting Started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, etc. (Neon connection string)
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

## Structure

```
src/
  main.ts              # bootstrap, CORS, ValidationPipe
  app.module.ts         # top-level module assembly
  prisma/                # PrismaService (global module)
  common/
    guards/
      auth.guard.ts        # requires login (guest included) - for personal data APIs
      optional-auth.guard.ts # attaches user if a token is present, passes through otherwise - for shared/public data lookups
    decorators/current-user.decorator.ts
  auth/          # guest issuance / Kakao & Google OAuth / guest-to-account data merge
  yarn/          # yarn CRUD (including lots/batches) + pattern matching
  yarn-catalog/  # yarn catalog search (local-first + Ravelry fallback)
  ravelry/       # Ravelry API client (shared by yarn-catalog and pattern)
  pattern/       # pattern CRUD + favorites/bookmarks + yarn matching
  project/       # project tracker - start/reuse check, progress status management
```

## Tests

```bash
npm test        # run all unit tests
npm run test:cov # with coverage
```

Unit tests focus on core business logic: matching ratio/gauge/dye-lot-mixing calculations, unit conversion, ownership validation, guest-to-account merge, pattern-deletion eligibility conditions, and so on. `PrismaService` is replaced with a mock, so tests run without a real database.

### e2e tests

Integration tests that go through the real controllers, guards, and Prisma, against a separate local Postgres instance (kept apart from the dev Neon database) started with Docker.

```bash
docker compose -f docker-compose.test.yml up -d   # dedicated test Postgres container (localhost:5433)
cp .env.example .env.test                          # replace DATABASE_URL with the value below
# DATABASE_URL="postgresql://postgres:test@localhost:5433/yarn_stash_test"
npx dotenv -e .env.test -- npx prisma migrate deploy   # apply schema (once, and again whenever migrations are added)
npm run test:e2e
```

Covers three core flows: guest creation → yarn registration → pattern-match lookup; guest-to-Kakao-account merge; and pattern deletion constraints (favorited by others / linked project) (`test/app.e2e-spec.ts`). External OAuth calls (Kakao, etc.) are stubbed via `global.fetch` so only our own logic is exercised, without hitting the real network.

## Current Status — What Works and What Doesn't

**Implemented**
- Auth: guest issuance, Kakao/Google OAuth (token exchange → profile lookup → find-or-create), guest-to-account data merge (`mergeGuestInto`)
- Yarn: list/detail/create/update/delete, lot (batch) add/update/delete, mark-as-depleted
- Pattern: list/detail/search/create/update/delete (with ownership + zero-other-favorites + zero-linked-projects validation), favorite toggle + notes
- Matching: bidirectional yarn ↔ pattern matching (includes surplus ratio, gauge-approximation chip, dye-lot-mixing guidance)
- External integrations: Ravelry API fallback search (yarn/patterns), Cloudinary upload (direct unsigned upload from the frontend)
- Project: start/reuse check (redirects to an existing in-progress project if one exists), status/row-count/notes/photo management
- Unit tests for core service logic (auth/yarn/pattern/project services + matching and unit-conversion utils) + e2e tests for core flows (against a local Docker Postgres)
- Ravelry API verified live against real credentials, field-mapping bugs fixed (`ravelry.service.ts`)

**Known Limitations**
- No cleanup batch job for abandoned guest accounts (out of scope for phase 1, see planning doc section 2.9)
- Recommend running a full type check with `npx tsc --noEmit` once more before deploying
