-- ================================================================
-- Gym Routine Control — Initial Schema
-- ================================================================

-- 0. Extensions
create extension if not exists "pgcrypto";

-- ================================================================
-- TABLES
-- ================================================================

-- 1. Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  preferences jsonb not null default '{
    "theme": "dark",
    "rest_timer": 90,
    "sound_enabled": true,
    "vibration_enabled": true
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Routines
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  muscle_groups text[] not null default '{}',
  estimated_duration int,
  is_favorite boolean not null default false,
  is_template boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_routines_user_id on public.routines(user_id);
create index if not exists idx_routines_deleted_at on public.routines(deleted_at);

-- 3. Exercises
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  category text,
  equipment text,
  muscle_group text not null,
  instructions text,
  video_url text,
  image_url text,
  is_global boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_exercises_user_id on public.exercises(user_id);
create index if not exists idx_exercises_muscle_group on public.exercises(muscle_group);
create index if not exists idx_exercises_is_global on public.exercises(is_global);

-- 4. Routine Exercises (join table with ordering)
create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  sort_order int not null default 0,
  sets int not null default 3,
  reps int,
  weight decimal,
  rest_time int not null default 90,
  tempo text,
  rpe decimal,
  notes text,
  created_at timestamptz not null default now(),
  unique (routine_id, exercise_id, sort_order)
);

create index if not exists idx_routine_exercises_routine on public.routine_exercises(routine_id);

-- 5. Workout Sessions
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  routine_id uuid references public.routines(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration int,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_workout_sessions_user_id on public.workout_sessions(user_id);
create index if not exists idx_workout_sessions_status on public.workout_sessions(status);
create index if not exists idx_workout_sessions_started_at on public.workout_sessions(started_at);

-- 6. Workout Sets
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  routine_exercise_id uuid not null references public.routine_exercises(id) on delete cascade,
  set_number int not null,
  reps int,
  weight decimal,
  is_completed boolean not null default false,
  completed_at timestamptz,
  rpe decimal,
  notes text,
  created_at timestamptz not null default now(),
  unique (session_id, routine_exercise_id, set_number)
);

create index if not exists idx_workout_sets_session on public.workout_sets(session_id);

-- 7. Personal Records
create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  weight decimal not null,
  reps int not null,
  estimated_one_rm decimal,
  achieved_at timestamptz not null default now(),
  session_id uuid references public.workout_sessions(id) on delete set null
);

create index if not exists idx_pr_user_exercise on public.personal_records(user_id, exercise_id);
create index if not exists idx_pr_weight on public.personal_records(weight desc);

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger: profiles.updated_at
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- Trigger: routines.updated_at
create trigger trg_routines_updated_at
  before update on public.routines
  for each row execute function public.update_updated_at();

-- Trigger: exercises.updated_at
create trigger trg_exercises_updated_at
  before update on public.exercises
  for each row execute function public.update_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger trg_after_auth_signup
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Calculate estimated 1RM (Epley formula)
create or replace function public.calculate_one_rm(p_weight decimal, p_reps int)
returns decimal as $$
begin
  if p_reps = 1 then return p_weight; end if;
  return round((p_weight * (1 + p_reps::decimal / 30))::numeric, 1);
end;
$$ language plpgsql immutable;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

-- Profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Routines
alter table public.routines enable row level security;

create policy "Users can view own routines"
  on public.routines for select
  using (auth.uid() = user_id and deleted_at is null);

create policy "Users can create own routines"
  on public.routines for insert
  with check (auth.uid() = user_id);

create policy "Users can update own routines"
  on public.routines for update
  using (auth.uid() = user_id);

create policy "Users can soft-delete own routines"
  on public.routines for delete
  using (auth.uid() = user_id);

-- Exercises
alter table public.exercises enable row level security;

create policy "Anyone can view global exercises"
  on public.exercises for select
  using (is_global = true or auth.uid() = user_id);

create policy "Users can create exercises"
  on public.exercises for insert
  with check (auth.uid() = user_id);

create policy "Users can update own exercises"
  on public.exercises for update
  using (auth.uid() = user_id);

create policy "Users can delete own exercises"
  on public.exercises for delete
  using (auth.uid() = user_id);

-- Routine Exercises
alter table public.routine_exercises enable row level security;

create policy "Users can view own routine exercises"
  on public.routine_exercises for select
  using (exists (
    select 1 from public.routines where id = routine_id and user_id = auth.uid()
  ));

create policy "Users can manage own routine exercises"
  on public.routine_exercises for all
  using (exists (
    select 1 from public.routines where id = routine_id and user_id = auth.uid()
  ));

-- Workout Sessions
alter table public.workout_sessions enable row level security;

create policy "Users can view own sessions"
  on public.workout_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create sessions"
  on public.workout_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.workout_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.workout_sessions for delete
  using (auth.uid() = user_id);

-- Workout Sets
alter table public.workout_sets enable row level security;

create policy "Users can view own sets"
  on public.workout_sets for select
  using (exists (
    select 1 from public.workout_sessions where id = session_id and user_id = auth.uid()
  ));

create policy "Users can manage own sets"
  on public.workout_sets for all
  using (exists (
    select 1 from public.workout_sessions where id = session_id and user_id = auth.uid()
  ));

-- Personal Records
alter table public.personal_records enable row level security;

create policy "Users can view own PRs"
  on public.personal_records for select
  using (auth.uid() = user_id);

create policy "Users can create PRs"
  on public.personal_records for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own PRs"
  on public.personal_records for delete
  using (auth.uid() = user_id);

-- ================================================================
-- SEED DATA — GLOBAL EXERCISES
-- ================================================================

insert into public.exercises (name, description, category, equipment, muscle_group, instructions, is_global) values
  ('Bench Press', 'Classic chest press with barbell', 'strength', 'Barbell', 'Chest', 'Lie on bench, grip bar slightly wider than shoulder-width, lower to chest, press up', true),
  ('Incline Bench Press', 'Upper chest focused bench press', 'strength', 'Barbell', 'Chest', 'Lie on incline bench, press bar from upper chest', true),
  ('Dumbbell Fly', 'Isolation chest exercise', 'strength', 'Dumbbell', 'Chest', 'Lie on bench, arms extended, bring dumbbells together in arc motion', true),
  ('Pull Up', 'Compound back exercise', 'strength', 'Bodyweight', 'Back', 'Hang from bar, pull body up until chin over bar', true),
  ('Barbell Row', 'Compound back thickness', 'strength', 'Barbell', 'Back', 'Bend at hips, pull bar to lower chest', true),
  ('Lat Pulldown', 'Back width exercise', 'strength', 'Machine', 'Back', 'Pull bar down to upper chest', true),
  ('Overhead Press', 'Shoulder compound press', 'strength', 'Barbell', 'Shoulders', 'Press bar from shoulders to overhead', true),
  ('Lateral Raise', 'Side shoulder isolation', 'strength', 'Dumbbell', 'Shoulders', 'Raise dumbbells out to sides until parallel to floor', true),
  ('Barbell Curl', 'Bicep isolation', 'strength', 'Barbell', 'Biceps', 'Curl bar from hips to shoulders', true),
  ('Tricep Pushdown', 'Tricep isolation', 'strength', 'Cable', 'Triceps', 'Push cable attachment down until arms extended', true),
  ('Squat', 'Compound leg exercise', 'strength', 'Barbell', 'Legs', 'Squat down with bar on back, thighs parallel to ground', true),
  ('Romanian Deadlift', 'Hamstring focused deadlift', 'strength', 'Barbell', 'Hamstrings', 'Hinge at hips, lower bar along legs', true),
  ('Leg Press', 'Compound leg press machine', 'strength', 'Machine', 'Legs', 'Press platform away using legs', true),
  ('Leg Extension', 'Quad isolation', 'strength', 'Machine', 'Quadriceps', 'Extend legs against resistance', true),
  ('Leg Curl', 'Hamstring isolation', 'strength', 'Machine', 'Hamstrings', 'Curl legs against resistance', true),
  ('Calf Raise', 'Calf isolation', 'strength', 'Machine', 'Calves', 'Raise heels against resistance', true),
  ('Plank', 'Core stability', 'strength', 'Bodyweight', 'Core', 'Hold push-up position with straight body', true),
  ('Crunch', 'Ab isolation', 'strength', 'Bodyweight', 'Abs', 'Curl upper body toward knees', true),
  ('Deadlift', 'Full body compound', 'strength', 'Barbell', 'Full Body', 'Lift bar from floor to standing', true),
  ('Dumbbell Shoulder Press', 'Overhead press with dumbbells', 'strength', 'Dumbbell', 'Shoulders', 'Press dumbbells from shoulders to overhead', true)
on conflict do nothing;
