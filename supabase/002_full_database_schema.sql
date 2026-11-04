-- =====================================================================
-- SECTION 4: COMPLETE DATABASE DESIGN (ALL 13 TABLES + INDEXES + RLS)
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENUMS FOR STATUSES & CATEGORIES
-- ---------------------------------------------------------------------
do $$ begin
  create type public.project_status as enum ('planning', 'active', 'on_hold', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_status as enum ('todo', 'in_progress', 'review', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.material_tx_type as enum ('in', 'out');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.equipment_status as enum ('available', 'in_use', 'maintenance', 'retired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.approval_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;


-- ---------------------------------------------------------------------
-- 2. TABLE: projects
--    Purpose: Name, location, budget, start and end dates, status
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  location    text not null,
  description text,
  budget      numeric(14, 2) not null default 0 check (budget >= 0),
  start_date  date,
  end_date    date,
  status      public.project_status not null default 'planning',
  progress    integer not null default 0 check (progress >= 0 and progress <= 100),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists projects_status_idx on public.projects(status);


-- ---------------------------------------------------------------------
-- 3. TABLE: project_members
--    Purpose: Which users belong to which project and their project role
-- ---------------------------------------------------------------------
create table if not exists public.project_members (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  project_role public.user_role not null default 'worker',
  assigned_at  timestamptz not null default now(),
  unique (project_id, user_id)
);

create index if not exists project_members_project_idx on public.project_members(project_id);
create index if not exists project_members_user_idx on public.project_members(user_id);


-- ---------------------------------------------------------------------
-- 4. TABLE: tasks
--    Purpose: Title, status, percent complete, assigned user, due date
-- ---------------------------------------------------------------------
create table if not exists public.tasks (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  title            text not null,
  description      text,
  status           public.task_status not null default 'todo',
  percent_complete integer not null default 0 check (percent_complete >= 0 and percent_complete <= 100),
  assigned_user_id uuid references public.profiles(id) on delete set null,
  due_date         date,
  photo_url        text,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists tasks_project_idx on public.tasks(project_id);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_assigned_user_idx on public.tasks(assigned_user_id);


-- ---------------------------------------------------------------------
-- 5. TABLE: materials
--    Purpose: Name, unit, current stock, reorder level
-- ---------------------------------------------------------------------
create table if not exists public.materials (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  unit          text not null default 'pcs', -- e.g. bags, kg, pcs, m3
  current_stock numeric(12, 2) not null default 0 check (current_stock >= 0),
  reorder_level numeric(12, 2) not null default 10 check (reorder_level >= 0),
  unit_cost     numeric(12, 2) not null default 0 check (unit_cost >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 6. TABLE: material_transactions
--    Purpose: Stock in and out, project, date, quantity
-- ---------------------------------------------------------------------
create table if not exists public.material_transactions (
  id               uuid primary key default gen_random_uuid(),
  material_id      uuid not null references public.materials(id) on delete cascade,
  project_id       uuid references public.projects(id) on delete set null,
  transaction_type public.material_tx_type not null, -- 'in' or 'out'
  quantity         numeric(12, 2) not null check (quantity > 0),
  transaction_date date not null default current_date,
  notes            text,
  recorded_by      uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now()
);

create index if not exists material_tx_material_idx on public.material_transactions(material_id);
create index if not exists material_tx_project_idx on public.material_transactions(project_id);
create index if not exists material_tx_date_idx on public.material_transactions(transaction_date);


-- ---------------------------------------------------------------------
-- 7. TABLE: workers
--    Purpose: Worker details and daily rate
-- ---------------------------------------------------------------------
create table if not exists public.workers (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name  text not null,
  trade      text not null default 'General Labor', -- e.g. Mason, Carpenter, Electrician
  phone      text,
  daily_rate numeric(10, 2) not null default 0 check (daily_rate >= 0),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 8. TABLE: attendance
--    Purpose: Worker, project, date, hours
-- ---------------------------------------------------------------------
create table if not exists public.attendance (
  id              uuid primary key default gen_random_uuid(),
  worker_id       uuid not null references public.workers(id) on delete cascade,
  project_id      uuid not null references public.projects(id) on delete cascade,
  attendance_date date not null default current_date,
  hours_worked    numeric(5, 2) not null default 8 check (hours_worked >= 0 and hours_worked <= 24),
  status          text not null default 'present', -- present, half_day, absent
  recorded_by     uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (worker_id, project_id, attendance_date)
);

create index if not exists attendance_project_idx on public.attendance(project_id);
create index if not exists attendance_date_idx on public.attendance(attendance_date);
create index if not exists attendance_worker_idx on public.attendance(worker_id);


-- ---------------------------------------------------------------------
-- 9. TABLE: equipment
--    Purpose: Equipment list and status
-- ---------------------------------------------------------------------
create table if not exists public.equipment (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  serial_code text,
  status      public.equipment_status not null default 'available',
  project_id  uuid references public.projects(id) on delete set null,
  notes       text,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index if not exists equipment_project_idx on public.equipment(project_id);
create index if not exists equipment_status_idx on public.equipment(status);


-- ---------------------------------------------------------------------
-- 10. TABLE: expenses
--     Purpose: Amount, category, project, approval status
-- ---------------------------------------------------------------------
create table if not exists public.expenses (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  category        text not null, -- Materials, Labor, Equipment, Permits, Other
  description     text not null,
  amount          numeric(14, 2) not null check (amount > 0),
  expense_date    date not null default current_date,
  approval_status public.approval_status not null default 'pending',
  submitted_by    uuid references public.profiles(id) on delete set null,
  approved_by     uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists expenses_project_idx on public.expenses(project_id);
create index if not exists expenses_status_idx on public.expenses(approval_status);
create index if not exists expenses_date_idx on public.expenses(expense_date);


-- ---------------------------------------------------------------------
-- 11. TABLE: daily_logs
--     Purpose: Date, weather, notes, photos, author
-- ---------------------------------------------------------------------
create table if not exists public.daily_logs (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  log_date   date not null default current_date,
  weather    text not null default 'Sunny', -- Sunny, Cloudy, Rainy, Stormy
  notes      text not null,
  photos     text[] not null default '{}',
  author_id  uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists daily_logs_project_idx on public.daily_logs(project_id);
create index if not exists daily_logs_date_idx on public.daily_logs(log_date);


-- ---------------------------------------------------------------------
-- 12. TABLE: documents
--     Purpose: Files linked to a project
-- ---------------------------------------------------------------------
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  file_url    text not null,
  file_type   text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists documents_project_idx on public.documents(project_id);


-- ---------------------------------------------------------------------
-- 13. TABLE: email_verifications
--     Purpose: Token, user, target email, expiry, used flag (Section 4 & 10)
-- ---------------------------------------------------------------------
create table if not exists public.email_verifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  target_email text not null,
  token        text not null unique,
  expires_at   timestamptz not null,
  used         boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists email_verifications_token_idx on public.email_verifications(token);
create index if not exists email_verifications_user_idx on public.email_verifications(user_id);


-- ---------------------------------------------------------------------
-- 14. ENABLE ROW LEVEL SECURITY FOR ALL TABLES
--     Authenticated team members can read; role checks enforced in API & policies
-- ---------------------------------------------------------------------
alter table public.projects              enable row level security;
alter table public.project_members       enable row level security;
alter table public.tasks                 enable row level security;
alter table public.materials             enable row level security;
alter table public.material_transactions enable row level security;
alter table public.workers               enable row level security;
alter table public.attendance            enable row level security;
alter table public.equipment             enable row level security;
alter table public.expenses              enable row level security;
alter table public.daily_logs            enable row level security;
alter table public.documents             enable row level security;
alter table public.email_verifications   enable row level security;

-- Allow authenticated users to read operational tables
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'projects', 'project_members', 'tasks', 'materials',
    'material_transactions', 'workers', 'attendance',
    'equipment', 'expenses', 'daily_logs', 'documents'
  ] loop
    execute format('drop policy if exists "Authenticated read %I" on public.%I', tbl, tbl);
    execute format(
      'create policy "Authenticated read %I" on public.%I for select to authenticated using (true)',
      tbl, tbl
    );
    execute format('drop policy if exists "Authenticated write %I" on public.%I', tbl, tbl);
    execute format(
      'create policy "Authenticated write %I" on public.%I for all to authenticated using (true) with check (true)',
      tbl, tbl
    );
  end loop;
end $$;

drop policy if exists "Own email verifications" on public.email_verifications;
create policy "Own email verifications" on public.email_verifications
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
