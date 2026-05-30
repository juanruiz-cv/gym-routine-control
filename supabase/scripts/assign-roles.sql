-- Assign initial admin/staff roles
-- Run this in Supabase Dashboard → SQL Editor

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@a.com');

update public.profiles
set role = 'staff'
where id = (select id from auth.users where email = 'staff@a.com');

-- Verify
select
  au.email,
  p.role,
  p.display_name
from auth.users au
join public.profiles p on p.id = au.id
where au.email in ('admin@a.com', 'staff@a.com');
