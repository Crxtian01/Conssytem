# ConstructMS — Construction Management & RA 12009 Bidding System

**ConstructMS** is a web-based Construction Management and Republic Act No. 12009 Bidding System built with **Next.js**, **TypeScript**, **Tailwind CSS**, **Recharts**, **Framer Motion**, and **Supabase**.

It provides a centralized workspace for managing construction projects, S-curve schedules, contractor bidding (`Draft → Open → Evaluation → Awarded`), material inventory, worker attendance, daily site logs, and expense approvals across four distinct user roles:

- **Admin / Engineer:** Full system access, executive KPI & S-curve dashboard, bid issuance/awarding, user management, and approval of pending expenses and material requests.
- **Assistant:** Encodes daily site logs, worker attendance, task progress, material stock-in/out, and submits pending expense/material requests.
- **Contractor:** Views open RA 12009 bids, submits bid proposals, and updates assigned project tasks and daily logs.
- **Client:** Read-only access to project progress, approved daily logs, shared documents, and progress reports.

### Quick Start
1. Install dependencies: `npm install`
2. Add your Supabase keys in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Run the SQL scripts inside `supabase/` in your Supabase SQL Editor.
4. Start the app: `npm run dev`
