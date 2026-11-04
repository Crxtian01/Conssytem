-- ============================================================================
-- ConstructMS - BIDDING MANAGEMENT MODULE (RA 12009 WORKFLOW & STRICT RLS)
-- Paste this into Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. ROLE HELPER FUNCTIONS FOR STRICT BIDDING RLS
-- ============================================================================

-- Only Admin / Engineer has full approval, submission, award, conversion & rules access
create or replace function public.is_admin_engineer()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role::text in ('admin_engineer', 'admin', 'engineer')
  );
$$;

-- Only Admin / Engineer and Assistant can access the Bidding module (Contractor & Client blocked)
create or replace function public.can_access_bidding()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role::text in ('admin_engineer', 'assistant', 'admin', 'engineer', 'project_manager')
  );
$$;

-- ============================================================================
-- 2. TABLE: bidding_rules (RA 12009 Defaults & Markup Rules - Admin/Engineer Only)
-- ============================================================================
create table if not exists public.bidding_rules (
  id                       text primary key default 'default-rules',
  procurement_law          text not null default 'RA 12009 (New Government Procurement Act)',
  default_ocm_pct          numeric(5,2) not null default 12.00,
  default_profit_pct       numeric(5,2) not null default 8.00,
  default_vat_pct          numeric(5,2) not null default 5.00,
  nfcc_multiplier          integer not null default 15,
  max_bid_abc_pct          numeric(5,2) not null default 100.00,
  reminder_days_before     integer not null default 3,
  require_philgeps         boolean not null default true,
  require_pcab             boolean not null default true,
  require_nfcc             boolean not null default true,
  require_bid_security     boolean not null default true,
  require_omnibus_sworn    boolean not null default true,
  updated_by_email         text,
  updated_at               timestamptz not null default now()
);

-- ============================================================================
-- 3. TABLE: bids (Core RA 12009 Bid Pipeline)
-- ============================================================================
create table if not exists public.bids (
  id                       text primary key default gen_random_uuid()::text,
  reference_no             text not null,
  title                    text not null,
  procuring_entity         text not null,
  location                 text not null default '',
  procurement_mode         text not null default 'Competitive Bidding (RA 12009)',
  pcab_category            text not null default 'Category B - Medium A',
  abc_amount               numeric(14,2) not null default 0,
  bid_amount               numeric(14,2) not null default 0,
  current_assets           numeric(14,2) not null default 0,
  current_liabilities      numeric(14,2) not null default 0,
  ongoing_contracts_value  numeric(14,2) not null default 0,
  nfcc_computed            numeric(14,2) not null default 0,
  bid_security_type        text not null default 'Bid Securing Declaration (BSD)',
  bid_security_amount      numeric(14,2) not null default 0,
  pre_bid_date             date,
  submission_deadline      date not null,
  opening_date             date,
  contract_duration_days   integer not null default 180,
  status                   text not null default 'draft'
                             check (status in ('draft', 'estimating', 'checklist', 'approved', 'submitted', 'awarded', 'lost', 'converted')),
  prepared_by_email        text not null default '',
  approved_by_email        text,
  approved_at              timestamptz,
  submitted_at             timestamptz,
  award_notice_no          text,
  award_date               date,
  award_remarks            text,
  converted_project_id     text,
  notes                    text not null default '',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ============================================================================
-- 4. TABLE: bid_estimates (BOQ / Bill of Quantities & Cost Breakdown)
-- ============================================================================
create table if not exists public.bid_estimates (
  id                       text primary key default gen_random_uuid()::text,
  bid_id                   text not null references public.bids(id) on delete cascade,
  item_no                  text not null,
  category                 text not null default 'Materials'
                             check (category in ('Materials', 'Labor', 'Equipment', 'Mobilization & Overhead')),
  description              text not null,
  unit                     text not null default 'lot',
  quantity                 numeric(12,2) not null default 1,
  unit_cost                numeric(14,2) not null default 0,
  direct_cost              numeric(14,2) not null default 0,
  ocm_pct                  numeric(5,2) not null default 12.00,
  profit_pct               numeric(5,2) not null default 8.00,
  vat_pct                  numeric(5,2) not null default 5.00,
  total_amount             numeric(14,2) not null default 0,
  created_at               timestamptz not null default now()
);

-- ============================================================================
-- 5. TABLE: bid_checklist_items (RA 12009 2-Envelope Checklist)
-- ============================================================================
create table if not exists public.bid_checklist_items (
  id                       text primary key default gen_random_uuid()::text,
  bid_id                   text not null references public.bids(id) on delete cascade,
  envelope                 text not null default 'technical'
                             check (envelope in ('technical', 'financial')),
  code                     text not null,
  label                    text not null,
  ra12009_clause           text not null,
  beginner_tip             text not null,
  is_required              boolean not null default true,
  is_completed             boolean not null default false,
  document_url             text,
  verified_by_email        text,
  updated_at               timestamptz not null default now()
);

-- ============================================================================
-- 6. TABLE: bid_documents (Uploaded Eligibility, Technical & Financial Files)
-- ============================================================================
create table if not exists public.bid_documents (
  id                       text primary key default gen_random_uuid()::text,
  bid_id                   text not null references public.bids(id) on delete cascade,
  envelope                 text not null default 'technical'
                             check (envelope in ('technical', 'financial')),
  title                    text not null,
  file_url                 text not null,
  file_type                text not null default 'PDF',
  uploaded_by_email        text not null,
  created_at               timestamptz not null default now()
);

-- ============================================================================
-- 7. STRICT ROW LEVEL SECURITY (RLS) POLICIES
--    - Contractor & Client: NO ACCESS (cannot read or write any bidding tables)
--    - Assistant: Can read all bidding tables; can insert/update bids ONLY when
--      status is in ('draft', 'estimating', 'checklist'). Cannot approve, submit,
--      record award, convert to project, or edit bidding_rules.
--    - Admin / Engineer: Full access to all stages and bidding_rules.
-- ============================================================================

alter table public.bidding_rules enable row level security;
alter table public.bids enable row level security;
alter table public.bid_estimates enable row level security;
alter table public.bid_checklist_items enable row level security;
alter table public.bid_documents enable row level security;

-- bidding_rules policies
drop policy if exists "Bidding roles can read bidding_rules" on public.bidding_rules;
create policy "Bidding roles can read bidding_rules" on public.bidding_rules
  for select using (public.can_access_bidding());

drop policy if exists "Only Admin/Engineer can modify bidding_rules" on public.bidding_rules;
create policy "Only Admin/Engineer can modify bidding_rules" on public.bidding_rules
  for all using (public.is_admin_engineer())
  with check (public.is_admin_engineer());

-- bids policies
drop policy if exists "Bidding roles can read bids" on public.bids;
create policy "Bidding roles can read bids" on public.bids
  for select using (public.can_access_bidding());

drop policy if exists "Admin/Engineer full access on bids" on public.bids;
create policy "Admin/Engineer full access on bids" on public.bids
  for all using (public.is_admin_engineer())
  with check (public.is_admin_engineer());

drop policy if exists "Assistant can insert draft/estimating/checklist bids" on public.bids;
create policy "Assistant can insert draft/estimating/checklist bids" on public.bids
  for insert with check (
    public.can_access_bidding()
    and status in ('draft', 'estimating', 'checklist')
  );

drop policy if exists "Assistant can update draft/estimating/checklist bids only" on public.bids;
create policy "Assistant can update draft/estimating/checklist bids only" on public.bids
  for update using (
    public.can_access_bidding()
    and status in ('draft', 'estimating', 'checklist')
  )
  with check (
    public.can_access_bidding()
    and status in ('draft', 'estimating', 'checklist')
  );

-- bid_estimates policies
drop policy if exists "Bidding roles can read bid_estimates" on public.bid_estimates;
create policy "Bidding roles can read bid_estimates" on public.bid_estimates
  for select using (public.can_access_bidding());

drop policy if exists "Bidding roles can write bid_estimates in early stages" on public.bid_estimates;
create policy "Bidding roles can write bid_estimates in early stages" on public.bid_estimates
  for all using (
    public.is_admin_engineer() or (
      public.can_access_bidding() and exists (
        select 1 from public.bids b
        where b.id = bid_estimates.bid_id
          and b.status in ('draft', 'estimating', 'checklist')
      )
    )
  )
  with check (
    public.is_admin_engineer() or (
      public.can_access_bidding() and exists (
        select 1 from public.bids b
        where b.id = bid_estimates.bid_id
          and b.status in ('draft', 'estimating', 'checklist')
      )
    )
  );

-- bid_checklist_items policies
drop policy if exists "Bidding roles can read bid_checklist_items" on public.bid_checklist_items;
create policy "Bidding roles can read bid_checklist_items" on public.bid_checklist_items
  for select using (public.can_access_bidding());

drop policy if exists "Bidding roles can write bid_checklist_items in early stages" on public.bid_checklist_items;
create policy "Bidding roles can write bid_checklist_items in early stages" on public.bid_checklist_items
  for all using (
    public.is_admin_engineer() or (
      public.can_access_bidding() and exists (
        select 1 from public.bids b
        where b.id = bid_checklist_items.bid_id
          and b.status in ('draft', 'estimating', 'checklist')
      )
    )
  )
  with check (
    public.is_admin_engineer() or (
      public.can_access_bidding() and exists (
        select 1 from public.bids b
        where b.id = bid_checklist_items.bid_id
          and b.status in ('draft', 'estimating', 'checklist')
      )
    )
  );

-- bid_documents policies
drop policy if exists "Bidding roles can read bid_documents" on public.bid_documents;
create policy "Bidding roles can read bid_documents" on public.bid_documents
  for select using (public.can_access_bidding());

drop policy if exists "Bidding roles can write bid_documents in early stages" on public.bid_documents;
create policy "Bidding roles can write bid_documents in early stages" on public.bid_documents
  for all using (
    public.is_admin_engineer() or (
      public.can_access_bidding() and exists (
        select 1 from public.bids b
        where b.id = bid_documents.bid_id
          and b.status in ('draft', 'estimating', 'checklist')
      )
    )
  )
  with check (
    public.is_admin_engineer() or (
      public.can_access_bidding() and exists (
        select 1 from public.bids b
        where b.id = bid_documents.bid_id
          and b.status in ('draft', 'estimating', 'checklist')
      )
    )
  );

-- ============================================================================
-- 8. INITIAL SEED DATA FOR BIDDING MODULE
-- ============================================================================
insert into public.bidding_rules (
  id, procurement_law, default_ocm_pct, default_profit_pct, default_vat_pct,
  nfcc_multiplier, max_bid_abc_pct, reminder_days_before, updated_by_email
) values (
  'default-rules', 'RA 12009 (New Government Procurement Act)', 12.00, 8.00, 5.00,
  15, 100.00, 3, 'lacuatachristian01@gmail.com'
) on conflict (id) do nothing;

insert into public.bids (
  id, reference_no, title, procuring_entity, location, procurement_mode,
  pcab_category, abc_amount, bid_amount, current_assets, current_liabilities,
  ongoing_contracts_value, nfcc_computed, bid_security_type, bid_security_amount,
  pre_bid_date, submission_deadline, opening_date, contract_duration_days,
  status, prepared_by_email, approved_by_email, notes
) values
  (
    'bid-1',
    'ITB-2026-DPWH-014',
    'Construction of 4-Storey Municipal Disaster Operations Center',
    'DPWH Regional Office IV-A / LGU Cavite',
    'Imus City, Cavite',
    'Competitive Bidding (RA 12009)',
    'Category B - Medium A',
    18500000.00,
    17480000.00,
    9500000.00,
    2200000.00,
    24500000.00,
    85000000.00,
    'Bid Securing Declaration (BSD)',
    0.00,
    '2026-11-01',
    '2026-11-07',
    '2026-11-07',
    240,
    'checklist',
    'christianlacuata83@gmail.com',
    null,
    'Envelope 1 & 2 nearly complete. Waiting for final Engineer review before sealing.'
  ),
  (
    'bid-2',
    'ITB-2026-DEPED-089',
    'Rehabilitation & Seismic Retrofitting of Science Building',
    'DepEd Division of Quezon City',
    'Quezon City, Metro Manila',
    'Competitive Bidding (RA 12009)',
    'Category C - Small B',
    9200000.00,
    8795000.00,
    6000000.00,
    1500000.00,
    12000000.00,
    55500000.00,
    'Surety Bond (5% of ABC)',
    460000.00,
    '2026-10-18',
    '2026-10-29',
    '2026-10-29',
    150,
    'awarded',
    'lacuatachristian01@gmail.com',
    'lacuatachristian01@gmail.com',
    'Lowest Calculated & Responsive Bid (LCRB). Notice of Award received — ready to convert into an active project!'
  ),
  (
    'bid-3',
    'ITB-2026-LGU-112',
    'Drainage & Concrete Road Widening along Barangay San Isidro',
    'City Government of Santa Rosa',
    'Santa Rosa, Laguna',
    'Competitive Bidding (RA 12009)',
    'Category B - Medium A',
    14000000.00,
    13125000.00,
    9500000.00,
    2200000.00,
    24500000.00,
    85000000.00,
    'Bid Securing Declaration (BSD)',
    0.00,
    '2026-11-05',
    '2026-11-16',
    '2026-11-16',
    180,
    'estimating',
    'christianlacuata83@gmail.com',
    null,
    'Computing BOQ concrete & rebar quantities and equipment rental rates.'
  )
on conflict (id) do nothing;
