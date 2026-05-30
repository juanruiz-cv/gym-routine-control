-- ================================================================
-- Pre-flight Verification Script
-- Run this BEFORE 00000_complete_schema.sql
-- Copy-paste into SQL Editor and run
-- ================================================================

-- 1. Tables that exist in public schema
select table_name, table_type
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- 2. Row count for each expected table (only if table exists)
select 'public.profiles' as table_name, count(*) as row_count from public.profiles
union all
select 'public.routines', count(*) from public.routines
union all
select 'public.exercises', count(*) from public.exercises
union all
select 'public.routine_exercises', count(*) from public.routine_exercises
union all
select 'public.workout_sessions', count(*) from public.workout_sessions
union all
select 'public.workout_sets', count(*) from public.workout_sets
union all
select 'public.personal_records', count(*) from public.personal_records;

-- 3. Existing RLS policies
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 4. Existing triggers on public tables
select trigger_name, event_manipulation, event_object_table, action_timing
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;

-- 5. Existing triggers on auth.users
select trigger_name, event_manipulation, event_object_table, action_timing
from information_schema.triggers
where event_object_schema = 'auth' and event_object_table = 'users'
order by trigger_name;

-- 6. Existing functions in public schema
select routine_name, routine_type, data_type as return_type
from information_schema.routines
where specific_schema = 'public'
order by routine_name;

-- 7. Check if pgcrypto extension exists
select extname, extversion from pg_extension where extname = 'pgcrypto';
