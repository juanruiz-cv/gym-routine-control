# Gym Routine Control

## Stack
- Angular 20 (Standalone, Zoneless, Signals, SSR)
- TailwindCSS v4 (dark‑first, mobile‑first)
- Supabase (PostgreSQL, Auth, Storage)
- PWA (`@angular/service-worker`, IndexedDB)
- ECharts, Lucide Angular, Zod

## Architecture
- Screaming Architecture
- Feature Driven
- Smart/Dumb Components
- Lazy‑loaded routes (7 feature modules)
- Signals first — RxJS only for Supabase real‑time

## Routes
| Path | Feature | Layout |
|------|---------|--------|
| `/auth/*` | Login / Register / Forgot | AuthLayout |
| `/dashboard` | Weekly stats, volume chart | MainLayout |
| `/routines` | List / Detail / Form | MainLayout |
| `/exercises` | List / Detail / Form | MainLayout |
| `/workout/*` | Active session / Summary | Full‑screen |
| `/metrics` | Volume, muscles, PRs | MainLayout |
| `/settings` | Preferences, profile | MainLayout |

## Database Tables
`profiles`, `routines`, `routine_exercises`, `exercises`, `workout_sessions`, `workout_sets`, `personal_records`

## Database Migration Notes
- Migration was executed via Supabase Management API (OAuth `sbp_oauth_*` token)
- **Fixed bugs in `00000_complete_schema.sql`**: `create or replace trigger` → `create trigger` (Postgres syntax)
- **PowerShell bug**: `$$` in SQL is expanded by PowerShell as "last command". Use `@'...'@` (single-quoted here-string) and `$body$` dollar quoting instead when running via PowerShell
- 7 tables, 22 RLS policies, 4 triggers, 20 seed exercises created successfully

## Rules
- Use Signals first — never `mutate()`, use `set()` / `update()`
- Avoid unnecessary RxJS
- Mobile-first, dark mode by default
- Reusable UI components in `@shared/ui/`
- SEO optimized via `SeoService`
- Lazy loading, strict typing, `inject()` over constructor DI
- Native control flow (`@if`, `@for`, `@switch`)
- `input()` / `output()` functions, never decorators
- `class` / `style` bindings, never `ngClass` / `ngStyle`

## Features
- Authentication (email/password)
- Workout tracking (set‑by‑set, rest timer, progress)
- Metrics & analytics (volume, streaks, muscle distribution, PRs)
- Routine management (CRUD, duplicate, favorites, exercise picker)
- Exercise management (global + custom, search/filter)
- Rest timer (configurable, sound/vibration)
- PWA offline mode (service-worker + IndexedDB)
- SSR with prerendering (6 routes)
- Preferences persisted to `profiles.preferences` JSON column