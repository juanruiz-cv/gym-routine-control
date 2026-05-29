# GymRoutineControl

Cross‑platform fitness tracking **PWA** built with Angular 20, Supabase, and Tailwind CSS v4. Track workouts, manage routines/exercises, monitor metrics, and use the integrated rest timer — all with offline support and SSR.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 20 (Standalone, Zoneless, Signals) |
| Styling | Tailwind CSS v4 (dark‑first, mobile‑first) |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| PWA | `@angular/service-worker`, IndexedDB (`idb`) |
| Charts | ECharts via `ngx-echarts` |
| Icons | Lucide Angular |
| Validation | Zod + Custom validators |
| Testing | Karma (unit) |
| Tooling | Husky, lint‑staged, commitlint, ESLint |

## Architecture

- **Screaming Architecture** – folder structure reflects business domains
- **Feature‑driven** – each feature is lazy‑loaded with its own routes
- **Smart / Dumb components** – pages orchestrate, UI components render
- **Signals first** – all reactive state uses `signal` / `computed`; RxJS only for Supabase real‑time
- **SSR hybrid** – prerenders static pages, hydrates on client

```
src/
├── app/
│   ├── core/           # Auth, guards, interceptors, layout, services
│   ├── features/       # Dashboard, Routines, Exercises, Workout, Metrics, Settings, Auth
│   ├── shared/         # UI components, directives, pipes, models, utils
│   └── app.ts          # Root + SwUpdate banner
├── environments/       # Supabase credentials
└── server.ts           # SSR entry
```

## Features

- **Authentication** – email/password sign‑up, login, forgot password, auth guards
- **Dashboard** – weekly volume chart, stats cards, recent activity, quick actions
- **Routines** – create/edit routines with exercise picker, detail view, duplicate, delete, favorites
- **Exercises** – global + custom exercises, search/filter by muscle group, category, equipment
- **Workout Session** – set‑by‑set weight/reps input, rest timer, exercise navigation, progress bar, finish/cancel
- **Workout Summary** – session stats, exercise breakdown, duration
- **Metrics** – volume history, muscle distribution, personal records, streak tracking
- **Settings** – profile, rest timer, sound/vibration toggles, sign out
- **PWA** – installable, offline‑cached assets, update notification, IndexedDB for offline data

## Database (Supabase)

| Table | Purpose |
|-------|---------|
| `profiles` | User profile + preferences (JSON column) |
| `routines` | Workout routines with soft‑delete |
| `routine_exercises` | Junction table (routine ↔ exercise with sets/reps/weight/rest) |
| `exercises` | Global + user‑created exercises |
| `workout_sessions` | Active/completed/cancelled sessions |
| `workout_sets` | Individual set data within a session |
| `personal_records` | Auto‑tracked PRs per exercise |

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Angular CLI 20.x
- A Supabase project (free tier)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment files
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.example.ts src/environments/environment.development.ts

# 3. Fill in your Supabase credentials
#    - SUPABASE_URL
#    - SUPABASE_ANON_KEY

# 4. Start dev server
npm start
```

Open `http://localhost:4200`.

### Build

```bash
npm run build          # Development
npm run build:prod     # Production (SSR + PWA + prerender)
npm run serve:ssr      # Serve SSR build locally
```

### Lint & Test

```bash
npm run lint
npm test
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | `ng serve` |
| `npm run build` | `ng build` |
| `npm run build:prod` | `ng build --configuration production` |
| `npm run serve:ssr` | `node dist/gym-routine-control/server/server.mjs` |
| `npm test` | `ng test` |
| `npm run lint` | `ng lint` |

## Project Structure

```
src/app/
├── core/
│   ├── auth/auth.service.ts
│   ├── guards/auth.guard.ts
│   ├── interceptors/auth.interceptor.ts
│   ├── layout/           # AuthLayoutComponent, MainLayoutComponent, BottomNavComponent
│   └── services/         # supabase, data (base), routine, exercise, workout, metrics, notification, seo
├── features/
│   ├── auth/             # login, register, forgot-password
│   ├── dashboard/        # dashboard.page.ts
│   ├── routines/         # routines list, routine-detail, routine-form
│   ├── exercises/        # exercises list, exercise-detail, exercise-form
│   ├── workout-session/  # active session, workout-summary
│   ├── metrics/          # metrics.page.ts
│   └── settings/         # settings.page.ts
└── shared/
    ├── ui/               # avatar, badge, button, card, empty-state, input, modal, progress-ring, skeleton, timer, toast
    ├── directives/       # click-outside, long-press, touch-feedback
    ├── pipes/            # difficulty, duration, relative-date
    ├── models/           # All TypeScript interfaces
    └── utils/            # formatters, validators
```

## PWA

- Service worker configured via `ngsw-config.json`
- Caches static assets and API responses for offline use
- Update notification banner in root component (`app.ts`)
- Manifest with full icon set (192×192, 512×512)
- IndexedDB (`idb`) for offline data persistence

## SEO

- `SeoService` for per‑route title and meta tags
- Open Graph / Twitter Card tags
- SSR prerendering for 6 static routes
- Canonical URLs and structured data support

## License

MIT
