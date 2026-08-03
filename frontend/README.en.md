# Yarn Stash Tracker Frontend (React + Vite)

[한국어](README.md)

This is the frontend for a personal knitting/crochet inventory app: register the yarn you own and get pattern recommendations you can actually knit with it, or start from a pattern and find matching yarn. For background on the feature set and data model, see [`docs/실_스태시_트래커_기획서.md`](../docs/실_스태시_트래커_기획서.md) (Korean); for per-screen specs, see [`docs/실_스태시_트래커_화면설계서.md`](../docs/실_스태시_트래커_화면설계서.md) (Korean).

## Getting Started

```bash
npm install
cp .env.example .env   # fill in backend API URL, Cloudinary/Kakao/Google client IDs
npm run dev
```

The backend (`../backend`) must be running first.

## Tech Stack

- React 19 + Vite + TypeScript
- React Router — URL-based routing (tab bar hidden on register/detail screens, shown on list screens)
- TanStack Query — server state management/caching
- Tailwind CSS
- Cloudinary unsigned upload — photos are uploaded directly from the client; only the URL is saved to the backend

## Structure

```
src/
  api/            # TanStack Query hooks (yarn/pattern/project/catalog)
  auth/           # session context, route guard for session-required routes
  components/
    layout/       # bottom tab bar, top bar, list/simple layouts
    yarn/ pattern/ ui/
  lib/            # API client, Cloudinary upload, unit conversion utils, etc.
  pages/          # yarn/pattern/project/my screens (list, register, detail, edit)
  types/          # API request/response type definitions
```

## Note

`docs/yarn-stash-prototype.jsx` is an early UI spec book (a useState-based mockup) used to work out screen flow and design tokens. The actual implementation is the React Router + TanStack Query code in this folder (`src/`).
