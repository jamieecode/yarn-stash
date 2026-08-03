# Yarn Stash Tracker

[한국어](README.md)

A personal inventory app for knitters and crocheters. Register the yarn you own and get pattern recommendations you can actually knit with it — or start from a pattern you like and check whether any of your yarn would work for it.

## Key Features

- **Bidirectional yarn ↔ pattern matching**: Matches on weight-category compatibility and yardage sufficiency (owned vs. required), scored into four levels — plenty / sufficient / tight / insufficient. Also flags gauge approximation and dye-lot (dye-matching) considerations as supporting signals.
- **Local DB + Ravelry hybrid search**: When registering yarn or patterns, the local database is queried first; if nothing matches, it falls back to the Ravelry API and caches only the item the user actually selects.
- **Guest-first authentication**: Usable immediately without signing in. Guest data is carried over seamlessly when the user later upgrades to Kakao/Google login.
- **Project tracker**: Once a project is started from a pattern, track it with a row counter, progress photos, and status (in progress / completed / on hold).

Background on the feature set and data model is in [`docs/실_스태시_트래커_기획서.md`](docs/실_스태시_트래커_기획서.md) (Korean), and per-screen specs are in [`docs/실_스태시_트래커_화면설계서.md`](docs/실_스태시_트래커_화면설계서.md) (Korean).

## Tech Stack

| Area | Stack |
|---|---|
| Frontend | React 19, Vite, TypeScript, React Router, TanStack Query, Tailwind CSS |
| Backend | Nest.js, Prisma, PostgreSQL |
| Auth | JWT (localStorage) + Kakao/Google OAuth |
| Images | Cloudinary (direct client-side upload) |
| External integration | Ravelry API |

## Folder Structure

```
backend/    Nest.js API server (see backend/README.md for details)
frontend/   React client (see frontend/README.md for details)
docs/       Product spec, screen spec, initial UI prototype, dev kickoff prompt
```

## Getting Started

Both servers need to be started separately.

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL (Neon), etc.
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env   # fill in backend API URL, etc.
npm run dev
```

Each folder's README has more detailed run options and current implementation status.

## License

[MIT](LICENSE)
