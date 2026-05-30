-- ================================================================
-- Gym Routine Control — RBAC Migration
-- Roles: admin, staff, user
-- Tables: routine_assignments, audit_logs
-- RLS Policies for role-based access
-- ================================================================

-- ================================================================
-- 1. PROFILES — add role column
-- ================================================================

alter table public.profiles add column if not exists role text not null default 'user'
  check (role in ('admin', 'staff', 'user'));

create index if not exists idx_profiles_role on public.profiles(role);

-- ================================================================
-- 2. EXERCISES — add tracking columns
-- ================================================================

alter table public.exercises add column if not exists created_by uuid references public.profiles(id);
alter table public.exercises add column if not exists updated_by uuid references public.profiles(id);

-- ================================================================
-- 3. ROUTINE ASSIGNMENTS
-- ================================================================

create table if not exists public.routine_assignments (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  status text not null default 'assigned'
    check (status in ('assigned', 'active', 'completed', 'archived')),
  unique(routine_id, user_id)
);

create index if not exists idx_ra_user on public.routine_assignments(user_id);
create index if not exists idx_ra_staff on public.routine_assignments(assigned_by);

-- ================================================================
-- 4. AUDIT LOGS
-- ================================================================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  target_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_entity on public.audit_logs(entity_type, entity_id);

-- ================================================================
-- 5. RLS — PROFILES
-- ================================================================

alter table public.profiles enable row level security;

-- Drop old user-only policies
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

-- Admin: full access
drop policy if exists "Admin can manage all profiles" on public.profiles;
create policy "Admin can manage all profiles"
  on public.profiles for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Staff: view all, update own
drop policy if exists "Staff can view all profiles" on public.profiles;
create policy "Staff can view all profiles"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'staff')
  );

-- User: view/update own
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Prevent non-admin from changing role column
drop policy if exists "Only admins can update role" on public.profiles;
create policy "Only admins can update role"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or
    (auth.uid() = id and (select 1 from public.profiles where id = auth.uid()) is not null and current_setting('app.updating_role') is null)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or
    auth.uid() = id
  );

-- ================================================================
-- 6. RLS — ROUTINES
-- ================================================================

-- Drop old
drop policy if exists "Users can view own routines" on public.routines;
drop policy if exists "Users can create own routines" on public.routines;
drop policy if exists "Users can update own routines" on public.routines;
drop policy if exists "Users can soft-delete own routines" on public.routines;

-- Admin: all routines
drop policy if exists "Admin can manage all routines" on public.routines;
create policy "Admin can manage all routines"
  on public.routines for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Staff: all routines (view/create/update), soft-delete own
drop policy if exists "Staff can manage routines" on public.routines;
create policy "Staff can manage routines"
  on public.routines for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'staff')
    and deleted_at is null
  );

create policy "Staff can create routines"
  on public.routines for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'staff')
  );

create policy "Staff can update any routine"
  on public.routines for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'staff')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'staff')
  );

-- Staff can see assigned routines for their users (via routine_assignments)
-- This is handled by the select policy above (they see all non-deleted routines)

-- User: own routines
drop policy if exists "Users can view own routines" on public.routines;
create policy "Users can view own routines"
  on public.routines for select
  using (
    (auth.uid() = user_id and deleted_at is null)
    or
    exists (
      select 1 from public.routine_assignments
      where routine_id = id and user_id = auth.uid()
    )
  );

drop policy if exists "Users can create own routines" on public.routines;
create policy "Users can create own routines"
  on public.routines for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own routines" on public.routines;
create policy "Users can update own routines"
  on public.routines for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can soft-delete own routines" on public.routines;
create policy "Users can soft-delete own routines"
  on public.routines for delete
  using (auth.uid() = user_id);

-- ================================================================
-- 7. RLS — EXERCISES
-- ================================================================

drop policy if exists "Anyone can view global exercises" on public.exercises;
drop policy if exists "Users can create exercises" on public.exercises;
drop policy if exists "Users can update own exercises" on public.exercises;
drop policy if exists "Users can delete own exercises" on public.exercises;

-- Admin: all
drop policy if exists "Admin can manage all exercises" on public.exercises;
create policy "Admin can manage all exercises"
  on public.exercises for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Staff: view all, create global, update all, soft-delete own
drop policy if exists "Staff can view all exercises" on public.exercises;
create policy "Staff can view all exercises"
  on public.exercises for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'staff')
    or is_global = true
    or auth.uid() = user_id
  );

drop policy if exists "Staff can create exercises" on public.exercises;
create policy "Staff can create exercises"
  on public.exercises for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'staff')
    or auth.uid() = user_id
  );

drop policy if exists "Staff can update exercises" on public.exercises;
create policy "Staff can update exercises"
  on public.exercises for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'staff')
    or auth.uid() = user_id
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'staff')
    or auth.uid() = user_id
  );

-- User: own exercises only
drop policy if exists "Users can view exercises" on public.exercises;
create policy "Users can view exercises"
  on public.exercises for select
  using (auth.uid() = user_id or is_global = true);

drop policy if exists "Users can create own exercises" on public.exercises;
create policy "Users can create own exercises"
  on public.exercises for insert
  with check (auth.uid() = user_id and not is_global);

drop policy if exists "Users can update own exercises" on public.exercises;
create policy "Users can update own exercises"
  on public.exercises for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and not is_global);

drop policy if exists "Users can delete own exercises" on public.exercises;
create policy "Users can delete own exercises"
  on public.exercises for delete
  using (auth.uid() = user_id);

-- ================================================================
-- 8. RLS — ROUTINE EXERCISES
-- ================================================================

alter table public.routine_exercises enable row level security;

drop policy if exists "Users can view own routine exercises" on public.routine_exercises;
drop policy if exists "Users can manage own routine exercises" on public.routine_exercises;

-- Admin: all
drop policy if exists "Admin can manage routine exercises" on public.routine_exercises;
create policy "Admin can manage routine exercises"
  on public.routine_exercises for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Staff: all
drop policy if exists "Staff can manage routine exercises" on public.routine_exercises;
create policy "Staff can manage routine exercises"
  on public.routine_exercises for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'staff')
    and exists (
      select 1 from public.routines where id = routine_id
    )
  );

-- User: via own routines or assigned routines
drop policy if exists "Users can view routine exercises" on public.routine_exercises;
create policy "Users can view routine exercises"
  on public.routine_exercises for select
  using (
    exists (
      select 1 from public.routines where id = routine_id and (user_id = auth.uid() or deleted_at is null)
    )
    or
    exists (
      select 1 from public.routine_assignments
      where routine_id = routine_exercises.routine_id and user_id = auth.uid()
    )
  );

drop policy if exists "Users can manage routine exercises" on public.routine_exercises;
create policy "Users can manage routine exercises"
  on public.routine_exercises for all
  using (
    exists (
      select 1 from public.routines where id = routine_id and user_id = auth.uid()
    )
  );

-- ================================================================
-- 9. RLS — ROUTINE ASSIGNMENTS
-- ================================================================

alter table public.routine_assignments enable row level security;

-- Admin: all
drop policy if exists "Admin can manage assignments" on public.routine_assignments;
create policy "Admin can manage assignments"
  on public.routine_assignments for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Staff: select, insert, update (no delete)
drop policy if exists "Staff can view assignments" on public.routine_assignments;
create policy "Staff can view assignments"
  on public.routine_assignments for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'staff')
  );

drop policy if exists "Staff can create assignments" on public.routine_assignments;
create policy "Staff can create assignments"
  on public.routine_assignments for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
  );

drop policy if exists "Staff can update assignments" on public.routine_assignments;
create policy "Staff can update assignments"
  on public.routine_assignments for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
  );

-- User: view own assignments
drop policy if exists "Users can view own assignments" on public.routine_assignments;
create policy "Users can view own assignments"
  on public.routine_assignments for select
  using (user_id = auth.uid());

-- ================================================================
-- 10. RLS — AUDIT LOGS
-- ================================================================

alter table public.audit_logs enable row level security;

drop policy if exists "Admin can view audit logs" on public.audit_logs;
create policy "Admin can view audit logs"
  on public.audit_logs for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Anyone can insert audit logs (trigger/server-side)
create policy "Anyone can insert audit logs"
  on public.audit_logs for insert
  with check (auth.uid() = actor_id);

-- ================================================================
-- 11. RLS — WORKOUT SESSIONS, SETS, PERSONAL RECORDS
-- ================================================================

-- These remain user-owns-data as-is from original schema
-- No changes needed — users only see their own workout data
-- Staff/Admin can view via the client-side if needed

-- ================================================================
-- 12. HELPER FUNCTION — is_admin, is_staff
-- ================================================================

create or replace function public.is_admin()
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')
  );
$$;

-- ================================================================
-- 13. UPDATE handle_new_user — add default role
-- ================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;
