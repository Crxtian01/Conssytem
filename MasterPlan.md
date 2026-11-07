# ConstructMS — Master Plan (`MasterPlan.md`)

**Project Title:** ConstructMS — Construction Management & RA 12009 Bidding System  
**Course:** CS PC 12 — Interactive Design and Prototyping (Final Laboratory Project)  
**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Recharts, Framer Motion, Supabase (PostgreSQL + Auth + RLS)

---

## 1. Executive Summary & Vision

**ConstructMS** is an interactive, role-based Construction Management and Republic Act No. 12009 (New Government Procurement Act) Bidding System designed for Philippine engineering firms, site assistants, contractors, and project clients.

### Core Problem Solved
Construction teams frequently rely on disconnected spreadsheets, paper delivery receipts, chat messages, and manual bid folders. This causes:
1. Delayed material requisitions and surprise stockouts on site.
2. Unverified site expenses and budget overruns discovered too late.
3. Opaque contractor bidding workflows that struggle to comply with RA 12009 stages (`Draft → Open → Evaluation → Awarded`).
4. Lack of real-time S-curve schedule and financial visibility for project owners/clients.

### Core Solution
ConstructMS unifies **15 specialized modules** under a **4-Role Access Control Matrix** with a **Liquid Glass UI**, a **viewport-locked responsive shell (`h-dvh`)**, and an **animated Executive Dashboard** powered by Supabase SQL views and Recharts.

---

## 2. Four-Role Permission Matrix

All routes, sidebar navigation items, API endpoints, and UI action buttons enforce the verified 4-role model:

| Capability / Module | Admin / Engineer (`admin_engineer`) | Assistant (`assistant`) | Contractor (`contractor`) | Client (`client`) |
| :--- | :---: | :---: | :---: | :---: |
| **Permitted Modules Count** | **15 Modules (Full Access)** | **10 Modules** | **6 Modules** | **5 Modules (Read-Only)** |
| **1. Dashboard (`/`)** | Full Executive KPIs & 8 Charts | Assigned projects overview | Own bids & assigned projects | Read-only progress dashboard |
| **2. Projects & Sites (`/projects`)** | Create, edit, delete, update progress | View & update assigned projects | View assigned projects only | Read-only project progress |
| **3. RA 12009 Bidding (`/bidding`)** | Prepare drafts, issue, evaluate & award bids | Prepare bid drafts & documents only | View open bids, submit own bid & view status | Restricted |
| **4. Tasks & Progress (`/tasks`)** | Create, assign, update & delete tasks | Update task status & progress (%) | View & update assigned tasks | Restricted |
| **5. Daily Logs (`/daily-logs`)** | Create, view & approve site logs | Create & submit daily site logs | Create & view own daily logs | View approved daily logs only |
| **6. Materials & Inventory (`/materials`)** | Full stock control + approve requests | Encode stock in/out & create material requests | Restricted | Restricted |
| **7. Workers & Attendance (`/attendance`)** | Manage workers, rates & attendance | Record worker attendance & hours | Restricted | Restricted |
| **8. Equipment (`/equipment`)** | Full heavy machinery & maintenance control | Restricted | Restricted | Restricted |
| **9. Expenses & Budget (`/expenses`)** | Log expenses + approve/reject pending expenses | Create expenses as `pending` only | Restricted | Restricted |
| **10. Documents (`/documents`)** | Upload, share & delete project documents | Upload & view assigned documents | Upload & view assigned documents | View shared documents only |
| **11. Reports (`/reports`)** | Full progress + financial summaries | Progress reports only (no financial summaries) | Restricted | Progress reports only |
| **12. Email Notifications (`/notifications`)** | Configure & send system email alerts | Restricted | Restricted | Restricted |
| **13. Users & Roles (`/users`)** | Manage users, assign roles & approve role requests | Restricted | Restricted | Restricted |
| **14. Requirements & ERD (`/architecture`)** | View user stories & live 13-table DB check | Restricted | Restricted | Restricted |
| **15. Screens & Setup (`/screen-design`)** | View phone-first wireframes & stack guide | Restricted | Restricted | Restricted |

---

## 3. System Architecture & Key Directories

```text
ConstructionSystem/
├── supabase/
│   ├── 001_profiles.sql                        # User profiles & auth sync triggers
│   ├── 002_full_database_schema.sql            # 13 core relational tables + RLS policies
│   ├── 003_bidding_and_seed_data.sql           # RA 12009 bidding tables & realistic seed data
│   └── 004_admin_dashboard_views_and_rpcs.sql  # 6 SQL aggregation views + KPI comparison RPC
├── src/
│   ├── app/
│   │   ├── page.tsx                            # Role-aware Home / Dashboard entry point
│   │   ├── admin-dashboard/page.tsx            # Dedicated Admin/Engineer Executive Dashboard route
│   │   ├── login/page.tsx                      # Splash / Welcome + Email & Google OAuth Login
│   │   ├── projects/page.tsx                   # Projects & Sites module
│   │   ├── bidding/page.tsx                    # RA 12009 Bidding & Contractor Proposal portal
│   │   ├── tasks/page.tsx                      # Tasks & Progress tracking
│   │   ├── daily-logs/page.tsx                 # Daily Site Logs & photo documentation
│   │   ├── materials/page.tsx                  # Materials Inventory & Requisition workflow
│   │   ├── attendance/page.tsx                 # Workers & Site Attendance
│   │   ├── equipment/page.tsx                  # Heavy Equipment & Maintenance tracking
│   │   ├── expenses/page.tsx                   # Expenses & Budget approval workflow
│   │   ├── documents/page.tsx                  # Blueprints, Contracts & Shared Documents
│   │   ├── reports/page.tsx                    # Progress & Financial Reports
│   │   ├── notifications/page.tsx              # Email Notifications & Alerts
│   │   ├── users/page.tsx                      # User Management & Role Upgrade Approvals
│   │   └── api/                                # Role-protected Next.js Route Handlers
│   ├── components/
│   │   ├── layout/AppShell.tsx                 # Viewport-locked layout, Sidebar, Mobile Drawer & Profile Modal
│   │   └── dashboard/admin/                    # Animated KPI Cards, Recharts & Filter components
│   ├── lib/
│   │   ├── auth.ts                             # Server-side session & role verification
│   │   ├── roles.ts                            # 4-role definitions, permissions & route guards
│   │   ├── admin-dashboard-service.ts          # Server-side Supabase aggregation service
│   │   └── admin-dashboard-animation.ts        # Shared Framer Motion & Recharts timing config
│   └── types/
│       └── database.types.ts                   # Strict TypeScript definitions (zero `any`)
├── MasterPlan.md                               # Project Master Plan (this document)
└── All_Needed_Documents.md                     # Complete CS PC 12 Final Project Documentation Report
```

---

## 4. Database & Aggregation Layer (Supabase PostgreSQL)

### 4.1 Core Tables (16 Tables Total)
1. `profiles` — User identity, `role`, `full_name`, `avatar_url`, `email_verified`
2. `projects` — Project name, location, budget, progress (%), start/target dates, status
3. `project_members` — Assigns Assistants, Contractors, and Clients to specific projects
4. `tasks` — Project tasks, priority, status (`todo`, `in_progress`, `completed`, `blocked`), completion (%)
5. `materials` — Inventory catalog, unit cost, stock quantity, reorder level
6. `material_transactions` — Stock-in and stock-out audit trail
7. `material_requests` — Assistant requisitions awaiting Admin/Engineer approval
8. `workers` — Site workforce roster, trade/specialty, daily wage rate
9. `attendance` — Daily worker check-in (`present`, `late`, `absent`) and hours worked
10. `equipment` — Heavy equipment registry, assigned project, maintenance status
11. `expenses` — Project expenditures by category, approval status (`pending`, `approved`, `rejected`)
12. `daily_logs` — Site weather, manpower count, work summary, approval status
13. `documents` — Project blueprints, permits, contracts, and visibility flags
14. `bids` — RA 12009 bid packages (`draft`, `open`, `under_evaluation`, `awarded`)
15. `contractor_proposals` — Contractor bid submissions, proposed amount, technical notes
16. `role_requests` — User requests to upgrade roles, reviewed by Admin/Engineer

### 4.2 Executive Dashboard SQL Views & RPC (`004_admin_dashboard_views_and_rpcs.sql`)
- `v_admin_monthly_expenses` — Monthly approved vs. pending expense aggregations
- `v_admin_expenses_by_category` — Category-level expense breakdown sorted highest to lowest
- `v_admin_material_stock_levels` — Current stock vs. reorder level with low-stock flags
- `v_admin_tasks_by_status` — Task counts grouped into `done`, `ongoing`, and `delayed`
- `v_admin_attendance_trend` — Daily/weekly `present`, `late`, and `absent` counts
- `v_admin_bids_by_stage` — RA 12009 funnel counts (`draft`, `open`, `evaluation`, `awarded`)
- `get_admin_dashboard_kpi_comparison(p_project_id, p_start_date, p_end_date)` — Server-side RPC computing current vs. previous period percentage deltas.

---

## 5. UI, Layout & Animation Standards

1. **Shared Dashboard Layout (`AppShell.tsx`)**
   - Outer container locked to `flex h-dvh w-full overflow-hidden` so the browser page never double-scrolls.
   - Fixed left `<aside>` on desktop (`w-72 shrink-0 overflow-y-auto`) that preserves its own scroll position across route changes.
   - Slide-out mobile drawer (`< md`) with backdrop lock and `>= 48px` touch targets (`min-h-12`).
   - Fixed top `<header>` with active module title, role badge, quick role switcher, and clickable **My Profile** trigger.
   - Independent `<main>` scroll container (`flex-1 min-w-0 overflow-y-auto p-4 md:p-6`) that resets scroll to top on navigation.

2. **Executive Dashboard Animations**
   - Plays on every dashboard visit and replays a shorter sequence (`filter` mode) when filters change.
   - Respects `prefers-reduced-motion` automatically.
   - Semantic color + directional arrows (`▲` / `▼`): cost increases show red (`▲`), while progress and attendance increases show green (`▲`).

---

## 6. CS PC 12 Final Submission Roadmap

| Deliverable | Status | Reference Location |
| :--- | :---: | :--- |
| **Part 1. User Research (Persona, 3+ Needs, 3+ Pain Points, Evidence)** | ✅ Ready | `All_Needed_Documents.md` (Section 1) |
| **Part 2. User Scenarios (3+ Realistic Scenarios)** | ✅ Ready | `All_Needed_Documents.md` (Section 2) |
| **Part 3. Navigation Design (Navigation Map + 2+ User Flows)** | ✅ Ready | `All_Needed_Documents.md` (Section 3) |
| **Part 4. Interface Design (Minimum 8 Required Screens)** | ✅ Ready | Built in App + Documented in `All_Needed_Documents.md` (Section 4) |
| **Part 5. Interactive Prototype (2+ Complete Tasks)** | ✅ Ready | Working Next.js App + `All_Needed_Documents.md` (Section 5) |
| **Part 6. Usability Testing (3+ Participants & Findings Table)** | ✅ Ready | `All_Needed_Documents.md` (Section 6) |
| **Part 7. Prototype Iteration (V1 vs. V2 + 3+ Improvements)** | ✅ Ready | `All_Needed_Documents.md` (Section 7) |
| **Part 8. Compiled Project Documentation Report** | ✅ Ready | `All_Needed_Documents.md` (Exportable to PDF/Word) |
| **Part 9. Final Presentation (10-Slide Structure & Script)** | ✅ Ready | `All_Needed_Documents.md` (Section 8) |

