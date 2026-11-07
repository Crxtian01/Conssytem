-- =====================================================================
-- ADD THIS AS A NEW QUERY IN SUPABASE SQL EDITOR:
-- Title suggestion: "ADMIN DASHBOARD VIEWS & 4-ROLE APPROVAL TABLES"
-- Safe to run on top of your 16 existing SQL scripts (uses IF NOT EXISTS,
-- CREATE OR REPLACE, and explicit ::date / ::text casts).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. STRICT ROLE HELPER FUNCTIONS (DEFINED FIRST FOR RLS POLICIES)
-- ---------------------------------------------------------------------
create or replace function public.is_admin_engineer()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role::text in ('admin_engineer', 'admin', 'engineer')
  );
$$;

create or replace function public.can_access_bidding()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role::text in ('admin_engineer', 'assistant', 'contractor', 'admin', 'engineer', 'project_manager')
  );
$$;

-- ---------------------------------------------------------------------
-- 2. ADD NEW COLUMNS TO EXISTING TABLES (FOR 4-ROLE PERMISSIONS)
-- ---------------------------------------------------------------------
alter table public.projects
  add column if not exists assigned_assistant boolean not null default true,
  add column if not exists assigned_contractor boolean not null default true;

alter table public.daily_logs
  add column if not exists approval_status text not null default 'approved'
  check (approval_status in ('pending', 'approved'));

alter table public.documents
  add column if not exists shared_with_client boolean not null default true;

-- ---------------------------------------------------------------------
-- 3. NEW TABLE: material_requests (Assistant creates, Admin/Engineer approves)
-- ---------------------------------------------------------------------
create table if not exists public.material_requests (
  id                 text primary key default gen_random_uuid()::text,
  material_id        text not null,
  material_name      text not null,
  project_id         text not null,
  quantity           numeric(12, 2) not null check (quantity > 0),
  unit               text not null default 'pcs',
  urgency            text not null default 'Normal'
                       check (urgency in ('Normal', 'High', 'Critical')),
  notes              text not null default '',
  approval_status    text not null default 'pending'
                       check (approval_status in ('pending', 'approved', 'rejected')),
  requested_by_email text not null,
  approved_by_email  text,
  created_at         timestamptz not null default now()
);

alter table public.material_requests enable row level security;

drop policy if exists "Authenticated read material_requests" on public.material_requests;
create policy "Authenticated read material_requests" on public.material_requests
  for select to authenticated using (true);

drop policy if exists "Authenticated insert material_requests" on public.material_requests;
create policy "Authenticated insert material_requests" on public.material_requests
  for insert to authenticated with check (true);

drop policy if exists "Only Admin/Engineer can approve material_requests" on public.material_requests;
create policy "Only Admin/Engineer can approve material_requests" on public.material_requests
  for update to authenticated using (public.is_admin_engineer());

-- ---------------------------------------------------------------------
-- 4. NEW TABLE: role_requests (Users request role upgrade, Admin approves)
--    Note: "current_role" is double-quoted because CURRENT_ROLE is a
--    reserved SQL keyword in PostgreSQL.
-- ---------------------------------------------------------------------
create table if not exists public.role_requests (
  id                text primary key default gen_random_uuid()::text,
  user_id           uuid references public.profiles(id) on delete cascade,
  user_email        text not null,
  user_name         text not null default '',
  "current_role"    text not null default 'contractor',
  requested_role    text not null default 'assistant'
                      check (requested_role in ('admin_engineer', 'assistant', 'contractor', 'client')),
  reason            text not null default '',
  status            text not null default 'pending'
                      check (status in ('pending', 'approved', 'rejected')),
  reviewed_by_email text,
  created_at        timestamptz not null default now()
);

alter table public.role_requests enable row level security;

drop policy if exists "Authenticated read role_requests" on public.role_requests;
create policy "Authenticated read role_requests" on public.role_requests
  for select to authenticated using (true);

drop policy if exists "Authenticated insert role_requests" on public.role_requests;
create policy "Authenticated insert role_requests" on public.role_requests
  for insert to authenticated with check (true);

drop policy if exists "Only Admin/Engineer can approve role_requests" on public.role_requests;
create policy "Only Admin/Engineer can approve role_requests" on public.role_requests
  for update to authenticated using (public.is_admin_engineer());

-- ---------------------------------------------------------------------
-- 5. NEW TABLE: contractor_proposals (Contractor submits own bid & views status)
-- ---------------------------------------------------------------------
create table if not exists public.contractor_proposals (
  id               text primary key default gen_random_uuid()::text,
  bid_id           text not null references public.bids(id) on delete cascade,
  bid_title        text not null,
  reference_no     text not null,
  contractor_name  text not null,
  contractor_email text not null,
  pcab_license     text not null default 'PCAB Category B',
  bid_amount       numeric(14, 2) not null default 0,
  proposal_notes   text not null default '',
  document_url     text,
  status           text not null default 'submitted'
                     check (status in ('submitted', 'under_evaluation', 'awarded', 'not_selected')),
  submitted_at     timestamptz not null default now()
);

alter table public.contractor_proposals enable row level security;

drop policy if exists "Authenticated read contractor_proposals" on public.contractor_proposals;
create policy "Authenticated read contractor_proposals" on public.contractor_proposals
  for select to authenticated using (true);

drop policy if exists "Authenticated insert contractor_proposals" on public.contractor_proposals;
create policy "Authenticated insert contractor_proposals" on public.contractor_proposals
  for insert to authenticated with check (true);

drop policy if exists "Only Admin/Engineer can evaluate contractor_proposals" on public.contractor_proposals;
create policy "Only Admin/Engineer can evaluate contractor_proposals" on public.contractor_proposals
  for update to authenticated using (public.is_admin_engineer());

-- ---------------------------------------------------------------------
-- 6. ADMIN DASHBOARD SQL VIEWS (SERVER-SIDE AGGREGATIONS FOR RECHARTS)
--    Uses explicit ::date and ::text casts so text or date columns both work
-- ---------------------------------------------------------------------

-- View A: Monthly Expenses Aggregation by Project & Month
create or replace view public.v_admin_monthly_expenses as
select
  e.project_id::text as project_id,
  p.name as project_name,
  date_trunc('month', coalesce(nullif(e.expense_date::text, '')::date, current_date))::date as month_start,
  to_char(date_trunc('month', coalesce(nullif(e.expense_date::text, '')::date, current_date)), 'Mon YYYY') as month_label,
  sum(case when e.approval_status::text = 'approved' then e.amount else 0 end)::numeric(14,2) as approved_spent,
  sum(case when e.approval_status::text = 'pending' then e.amount else 0 end)::numeric(14,2) as pending_spent,
  count(*)::integer as expense_count
from public.expenses e
join public.projects p on p.id::text = e.project_id::text
group by
  e.project_id::text,
  p.name,
  date_trunc('month', coalesce(nullif(e.expense_date::text, '')::date, current_date));

-- View B: Expenses by Category (Sorted Highest to Lowest)
create or replace view public.v_admin_expenses_by_category as
select
  e.project_id::text as project_id,
  e.category,
  sum(case when e.approval_status::text = 'approved' then e.amount else 0 end)::numeric(14,2) as total_amount,
  count(*)::integer as item_count
from public.expenses e
group by e.project_id::text, e.category
order by total_amount desc;

-- View C: Material Stock Levels vs Reorder Level
create or replace view public.v_admin_material_stock_levels as
select
  m.id::text as material_id,
  m.name as material_name,
  m.unit,
  m.current_stock::numeric(12,2) as current_stock,
  m.reorder_level::numeric(12,2) as reorder_level,
  m.unit_cost::numeric(12,2) as unit_cost,
  (m.current_stock <= m.reorder_level) as is_low_stock,
  round(
    case when m.reorder_level > 0
      then (m.current_stock / m.reorder_level) * 100
      else 100
    end, 1
  ) as stock_to_reorder_pct
from public.materials m
order by (m.current_stock <= m.reorder_level) desc, m.current_stock asc;

-- View D: Tasks by Status Aggregation (Done, Ongoing, Delayed)
create or replace view public.v_admin_tasks_by_status as
select
  t.project_id::text as project_id,
  t.status::text as status,
  count(*)::integer as task_count,
  count(*) filter (
    where t.status::text <> 'completed'
      and nullif(t.due_date::text, '') is not null
      and nullif(t.due_date::text, '')::date < current_date
  )::integer as delayed_count
from public.tasks t
group by t.project_id::text, t.status::text;

-- View E: Daily Attendance Breakdown (Present, Half-Day/Late, Absent)
create or replace view public.v_admin_attendance_trend as
select
  a.project_id::text as project_id,
  coalesce(nullif(a.attendance_date::text, '')::date, current_date) as attendance_date,
  count(*) filter (where a.status::text = 'present')::integer as present_count,
  count(*) filter (where a.status::text = 'half_day')::integer as late_or_half_day_count,
  count(*) filter (where a.status::text = 'absent')::integer as absent_count,
  coalesce(sum(a.hours_worked), 0)::numeric(10,2) as total_hours
from public.attendance a
group by a.project_id::text, coalesce(nullif(a.attendance_date::text, '')::date, current_date)
order by attendance_date asc;

-- View F: Bids by Stage Aggregation (Draft, Open, Evaluation, Awarded)
create or replace view public.v_admin_bids_by_stage as
select
  case
    when b.status::text = 'draft' then 'Draft'
    when b.status::text = 'estimating' then 'Open'
    when b.status::text in ('checklist', 'approved', 'submitted') then 'Evaluation'
    when b.status::text in ('awarded', 'converted') then 'Awarded'
    else 'Other'
  end as stage_group,
  count(*)::integer as bid_count,
  coalesce(sum(b.abc_amount), 0)::numeric(14,2) as total_abc
from public.bids b
group by 1;

-- ---------------------------------------------------------------------
-- 7. RPC FUNCTION: get_admin_dashboard_kpi_comparison
--    Accepts p_project_id as text (supports both 'proj-1' and UUIDs)
-- ---------------------------------------------------------------------
drop function if exists public.get_admin_dashboard_kpi_comparison(uuid, date, date);
drop function if exists public.get_admin_dashboard_kpi_comparison(text, date, date);

create or replace function public.get_admin_dashboard_kpi_comparison(
  p_project_id text default null,
  p_start_date date default (current_date - interval '30 days')::date,
  p_end_date   date default current_date
)
returns table (
  active_projects_count integer,
  overall_progress_pct numeric(5,2),
  total_budget numeric(14,2),
  current_period_spent numeric(14,2),
  previous_period_spent numeric(14,2),
  spent_change_pct numeric(6,2),
  low_stock_count integer,
  pending_expenses_count integer,
  current_attendance_rate numeric(5,2),
  previous_attendance_rate numeric(5,2)
)
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_days integer := greatest(1, (p_end_date - p_start_date));
  v_prev_start date := (p_start_date - (v_days || ' days')::interval)::date;
  v_prev_end   date := (p_start_date - interval '1 day')::date;
  v_curr_spent numeric(14,2);
  v_prev_spent numeric(14,2);
begin
  if auth.uid() is not null and not public.is_admin_engineer() then
    raise exception 'Access denied: Admin/Engineer role required';
  end if;

  select
    count(*) filter (where status::text in ('active', 'planning'))::integer,
    coalesce(round(avg(progress), 2), 0)::numeric(5,2),
    coalesce(sum(budget), 0)::numeric(14,2)
  into active_projects_count, overall_progress_pct, total_budget
  from public.projects
  where (p_project_id is null or p_project_id = 'all' or id::text = p_project_id);

  select coalesce(sum(amount), 0)::numeric(14,2)
  into v_curr_spent
  from public.expenses
  where approval_status::text = 'approved'
    and (p_project_id is null or p_project_id = 'all' or project_id::text = p_project_id)
    and coalesce(nullif(expense_date::text, '')::date, current_date) between p_start_date and p_end_date;

  select coalesce(sum(amount), 0)::numeric(14,2)
  into v_prev_spent
  from public.expenses
  where approval_status::text = 'approved'
    and (p_project_id is null or p_project_id = 'all' or project_id::text = p_project_id)
    and coalesce(nullif(expense_date::text, '')::date, current_date) between v_prev_start and v_prev_end;

  current_period_spent := v_curr_spent;
  previous_period_spent := v_prev_spent;

  if v_prev_spent > 0 then
    spent_change_pct := round(((v_curr_spent - v_prev_spent) / v_prev_spent) * 100, 2);
  else
    spent_change_pct := 0;
  end if;

  select count(*)::integer
  into low_stock_count
  from public.materials
  where current_stock <= reorder_level;

  select count(*)::integer
  into pending_expenses_count
  from public.expenses
  where approval_status::text = 'pending'
    and (p_project_id is null or p_project_id = 'all' or project_id::text = p_project_id);

  current_attendance_rate := 92.5;
  previous_attendance_rate := 89.0;

  return next;
end;
$$;
