-- =====================================================================
-- Step 2: Profiles table & 4-Role Model
-- Roles: admin_engineer, assistant, contractor, client
-- =====================================================================

-- 1. Profiles table (1 row per auth user, strictly restricted to the 4 roles)
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text not null,
  full_name      text,
  avatar_url     text,
  role           text not null default 'contractor'
                   check (role in ('admin_engineer', 'assistant', 'contractor', 'client')),
  email_verified boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);

-- 2. Auto-create a profile whenever a new user signs up (Google or email).
--    Google accounts are marked verified because Google already verified the address.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role, email_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    case
      when (new.raw_user_meta_data->>'role') in ('admin_engineer', 'assistant', 'contractor', 'client')
        then new.raw_user_meta_data->>'role'
      else 'contractor'
    end,
    coalesce(new.raw_app_meta_data->>'provider', 'email') = 'google'
      or new.email_confirmed_at is not null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Keep email_verified in sync when a user confirms their email later
create or replace function public.handle_user_email_confirmed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.profiles set email_verified = true, updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row execute function public.handle_user_email_confirmed();

-- 4. Row Level Security: users can read their own profile, Admin/Engineer & Assistant can read/update all.
alter table public.profiles enable row level security;

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

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles" on public.profiles
  for update using (public.is_admin());
