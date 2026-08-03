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
npm test        # run all tests
npm run test:cov # with coverage
```

Unit tests focus on core business logic: matching ratio/gauge/dye-lot-mixing calculations, unit conversion, ownership validation, guest-to-account merge, pattern-deletion eligibility conditions, and so on. `PrismaService` is replaced with a mock, so tests run without a real database. There are no e2e tests (against a real database) yet.

## Current Status — What Works and What Doesn't

**Implemented**
- Auth: guest issuance, Kakao/Google OAuth (token exchange → profile lookup → find-or-create), guest-to-account data merge (`mergeGuestInto`)
- Yarn: list/detail/create/update/delete, lot (batch) add/update/delete, mark-as-depleted
- Pattern: list/detail/search/create/update/delete (with ownership + zero-other-favorites + zero-linked-projects validation), favorite toggle + notes
- Matching: bidirectional yarn ↔ pattern matching (includes surplus ratio, gauge-approximation chip, dye-lot-mixing guidance)
- External integrations: Ravelry API fallback search (yarn/patterns), Cloudinary upload (direct unsigned upload from the frontend)
- Project: start/reuse check (redirects to an existing in-progress project if one exists), status/row-count/notes/photo management
- Unit tests for core service logic (auth/yarn/pattern/project services + matching and unit-conversion utils)

**Known Limitations**
- The Ravelry API was developed without credentials, so endpoint paths and field names are based on public docs/community libraries — needs re-verification against live responses once real API keys are issued (see the comment at the top of `ravelry.service.ts`)
- No e2e tests against a real database yet — currently only unit tests with `PrismaService` mocked
- No cleanup batch job for abandoned guest accounts (out of scope for phase 1, see planning doc section 2.9)
- Recommend running a full type check with `npx tsc --noEmit` once more before deploying
