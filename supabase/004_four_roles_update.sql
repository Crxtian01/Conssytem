-- =====================================================================
-- UPDATE PROFILES TABLE TO USE THE 4 PROJECT ROLES:
-- 1. 'admin_engineer' (Admin / Engineer — All Modules)
-- 2. 'assistant'      (Assistant — All Modules)
-- 3. 'contractor'     (Contractor — Limited to Site Modules Only)
-- 4. 'client'         (Client — Limited to Read-Only Modules Only)
-- =====================================================================

-- 1. Convert profiles.role from old enum to text with a check constraint for the 4 roles
alter table public.profiles
  alter column role drop default;

alter table public.profiles
  alter column role type text using (
    case role::text
      when 'admin' then 'admin_engineer'
      when 'engineer' then 'admin_engineer'
      when 'project_manager' then 'assistant'
      when 'foreman' then 'contractor'
      when 'worker' then 'contractor'
      when 'client' then 'client'
      else 'contractor'
    end
  );

alter table public.profiles
  alter column role set default 'contractor';

alter table public.profiles
  drop constraint if exists profiles_four_roles_check;

alter table public.profiles
  add constraint profiles_four_roles_check
  check (role in ('admin_engineer', 'assistant', 'contractor', 'client'));

-- 2. Update the admin helper function to check for 'admin_engineer' or 'assistant'
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin_engineer', 'assistant')
  );
$$;
