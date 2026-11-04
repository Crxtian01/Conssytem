-- ============================================================================
-- UPDATE ROLES & SECURITY TO STRICT 4-ROLE MODEL:
-- 1. admin_engineer (Admin / Engineer - All Modules)
-- 2. assistant      (Assistant - All Modules)
-- 3. contractor     (Contractor - Field & Site Modules Only)
-- 4. client         (Client - Project Monitoring Modules Only)
-- ============================================================================

-- 1. Convert profiles.role to text so it cleanly supports the 4 roles
alter table public.profiles
  alter column role drop default;

alter table public.profiles
  alter column role type text using role::text;

-- 2. Migrate any existing rows to the 4 allowed roles
update public.profiles
set role = case
  when role in ('admin', 'engineer', 'admin_engineer') then 'admin_engineer'
  when role in ('project_manager', 'assistant') then 'assistant'
  when role in ('foreman', 'worker', 'contractor') then 'contractor'
  when role = 'client' then 'client'
  else 'contractor'
end;

-- 3. Enforce only the 4 roles at the database level
alter table public.profiles
  drop constraint if exists profiles_four_roles_check;

alter table public.profiles
  add constraint profiles_four_roles_check
  check (role in ('admin_engineer', 'assistant', 'contractor', 'client'));

alter table public.profiles
  alter column role set default 'contractor';

-- 4. Update SECURITY helper function so Admin/Engineer & Assistant have admin access
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin_engineer', 'assistant')
  );
$$;
