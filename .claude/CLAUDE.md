# Gym Routine Control — Project Context

You are working on a cross‑platform fitness tracking PWA.

## Stack
- Angular 20 (Standalone, Zoneless, Signals, SSR)
- Tailwind CSS v4 (dark‑first, mobile‑first)
- Supabase (PostgreSQL, Auth, Storage)
- PWA (service‑worker, IndexedDB offline)
- ECharts, Lucide Angular icons, Zod validation

## Architecture
- Screaming Architecture: feature‑driven, lazy‑loaded routes
- Smart/Dumb components: pages orchestrate, UI components render
- Signals first (signal, computed); RxJS only for Supabase real‑time
- All state transformations are pure — never use `mutate()`

## Routes (all lazy‑loaded)
| Path | Feature | Layout |
|------|---------|--------|
| `/auth/*` | Login / Register / Forgot‑password | AuthLayout |
| `/dashboard` | Weekly stats, volume chart, recent activity | MainLayout |
| `/routines` | List / Detail / Form | MainLayout |
| `/exercises` | List / Detail / Form | MainLayout |
| `/workout/*` | Active session / Summary | None (full‑screen) |
| `/metrics` | Volume, muscle distribution, PRs | MainLayout |
| `/settings` | Preferences, profile, sign out | MainLayout |
| `/` → redirect to `/dashboard` | | |

## Services
| Service | Role |
|---------|------|
| `SupabaseService` | Raw Supabase client, session state |
| `DataService` | Abstract base class with `checkUserId()` |
| `AuthService` | Sign‑in/up/out, auth state signal |
| `RoutineService` | Routine CRUD |
| `ExerciseService` | Exercise CRUD |
| `WorkoutService` | Sessions, sets, PR tracking |
| `MetricsService` | Stats, volume history, streaks, muscle distribution |
| `NotificationService` | Push / local notifications |
| `SeoService` | Title + meta tags per route |

## Database Tables
`profiles`, `routines`, `routine_exercises`, `exercises`, `workout_sessions`, `workout_sets`, `personal_records`

## Key Conventions
- Standalone components (no NgModules)
- Use `input()` / `output()` functions, never decorators
- Use `class` / `style` bindings, never `ngClass` / `ngStyle`
- Use `@if` / `@for` / `@switch` native control flow
- Use `inject()` instead of constructor DI
- Strict typing everywhere — avoid `any`, use `unknown`
- `environment.ts` files contain placeholder Supabase credentials — replace before running
- Dark mode by default, mobile‑first responsive design

## Build
```bash
npm start         # Dev server
npm run build:prod  # Production build (SSR + PWA)
npm run serve:ssr   # Serve SSR build locally
npm run lint        # ESLint
```
