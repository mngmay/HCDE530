# ResearchBridge frontend

React + TypeScript demo for UX researchers (logged in as **May**). Uses dummy data with API fallback to `http://localhost:3001`.

## Run locally

```bash
cd researchbridge-frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Sign in at `/login` or go straight to the dashboard.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview production build

## Environment

Optional `.env`:

```
VITE_API_URL=http://localhost:3001
```

When the API is unavailable, all data loads from `src/data/dummy.ts`.

## Key routes

| Path | Page |
|------|------|
| `/` | Dashboard |
| `/projects` | Projects |
| `/studies/study-1` | Study detail |
| `/studies/study-1/translate` | Insight translator |
| `/studies/study-1/tickets` | Ticket bridge |

## Node version

Node 18+ recommended. If `npm install` fails on older Node, upgrade with `nvm install 20` or use Node 18 LTS.
