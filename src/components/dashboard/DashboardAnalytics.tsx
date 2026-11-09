'use client'

import { useState } from 'react'
import Link from 'next/link'
import AdminEngineerDashboard from '@/components/dashboard/admin/AdminEngineerDashboard'
import type { StoreData } from '@/lib/module-store'
import type { BiddingStoreData } from '@/lib/bidding-store'
import { ROLES, type UserRole } from '@/lib/roles'
import type { AdminDashboardPayload } from '@/types/database.types'

export default function DashboardAnalytics({
  store: initialStore,
  biddingStore,
  role,
  userEmail = '',
  adminDashboardPayload,
}: {
  store: StoreData
  biddingStore?: BiddingStoreData
  role: UserRole
  userEmail?: string
  adminDashboardPayload?: AdminDashboardPayload
}) {
  const [store] = useState(initialStore)
  const perms = ROLES[role].permissions

  const bids = biddingStore?.bids ?? []
  const userChosenProjects = (store.cooperation_requests ?? [])
    .filter(
      (r) =>
        userEmail &&
        r.email.toLowerCase() === userEmail.toLowerCase() &&
        r.status === 'approved'
    )
    .map((r) => r.project_name.toLowerCase())

  // 1. ADMIN / ENGINEER DASHBOARD (Recharts + Framer Motion Command Center)
  if (role === 'admin_engineer' && adminDashboardPayload) {
    return (
      <AdminEngineerDashboard
        initialPayload={adminDashboardPayload}
        initialCooperationRequests={store.cooperation_requests}
      />
    )
  }

  function handleExportProgressCsv() {
    const lines: string[][] = [
      [`CONSTRUCTMS — ${ROLES[role].label.toUpperCase()} DASHBOARD REPORT`],
      [],
      ['PROJECT PROGRESS SUMMARY'],
      perms.viewFinancialSummaries
        ? [
            'Project Name',
            'Location',
            'Status',
            'Progress %',
            'Budget (PHP)',
            'Approved Cost (PHP)',
            'Variance (PHP)',
          ]
        : ['Project Name', 'Location', 'Status', 'Progress %', 'Start Date', 'Target Completion'],
      ...store.projects.map((p) => {
        const spent = store.expenses
          .filter((e) => e.project_id === p.id && e.approval_status === 'approved')
          .reduce((s, e) => s + e.amount, 0)
        return perms.viewFinancialSummaries
          ? [
              p.name,
              p.location,
              p.status,
              `${p.progress}%`,
              `${p.budget}`,
              `${spent}`,
              `${p.budget - spent}`,
            ]
          : [p.name, p.location, p.status, `${p.progress}%`, p.start_date, p.end_date || 'TBD']
      }),
    ]

    const csv = lines
      .map((row) => row.map((cell) => `"${(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `constructms-${role}-dashboard-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  // ===========================================================================
  // 2. ASSISTANT DASHBOARD (Assigned Projects, Operations & Draft Preparation)
  // ===========================================================================
  if (role === 'assistant') {
    const assignedProjects = store.projects.filter((p) =>
      userChosenProjects.length > 0
        ? userChosenProjects.includes(p.name.toLowerCase())
        : p.assigned_assistant !== false
    )
    const draftBids = bids.filter((b) =>
      ['draft', 'estimating', 'checklist'].includes(b.status)
    )
    const pendingMaterialReqs = store.material_requests.filter(
      (r) => r.approval_status === 'pending'
    )
    const myPendingExpenses = store.expenses.filter((e) => e.approval_status === 'pending')

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Assistant Operations Workspace</span>
            </span>
            <h2 className="text-xl font-extrabold text-white sm:text-2xl">
              Assigned Projects, Bid Preparation &amp; Site Encoding
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Update assigned projects &amp; tasks, encode stock in/out &amp; material requests,
              record attendance, submit pending expenses, and prepare bid drafts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              href="/bidding"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition"
            >
              Prepare Bid Drafts ({draftBids.length}) →
            </Link>
            <Link
              href="/materials"
              className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white transition"
            >
              + Request Materials
            </Link>
          </div>
        </div>

        {/* 4 Assistant KPI Cards (No Financial Budget Totals) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#121624]/85 p-5 shadow-lg backdrop-blur-xl text-white">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Projects</p>
            <p className="mt-2 text-2xl font-extrabold text-white">{assignedProjects.length}</p>
            <p className="mt-1 text-xs text-cyan-300 font-semibold">
              View &amp; update progress
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121624]/85 p-5 shadow-lg backdrop-blur-xl text-white">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Draft Bids in Prep</p>
            <p className="mt-2 text-2xl font-extrabold text-white">{draftBids.length}</p>
            <p className="mt-1 text-xs text-slate-300">
              Drafts, BOQ &amp; documents (Admin issues/awards)
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121624]/85 p-5 shadow-lg backdrop-blur-xl text-white">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Material Requests</p>
            <p className="mt-2 text-2xl font-extrabold text-amber-400">
              {pendingMaterialReqs.length} Pending
            </p>
            <p className="mt-1 text-xs text-slate-300">
              Awaiting Admin / Engineer approval
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121624]/85 p-5 shadow-lg backdrop-blur-xl text-white">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Expenses</p>
            <p className="mt-2 text-2xl font-extrabold text-white">{myPendingExpenses.length}</p>
            <p className="mt-1 text-xs text-slate-300">
              Encoded as pending for Engineer sign-off
            </p>
          </div>
        </div>

        {/* Assigned Projects List (Progress Only — No Financial Summary) */}
        <div className="rounded-2xl border border-white/10 bg-[#121624]/85 p-6 shadow-lg backdrop-blur-xl space-y-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white">
              Assigned Projects ({assignedProjects.length})
            </h3>
            <Link href="/projects" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">
              Update Project Progress →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {assignedProjects.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-white/[0.08] p-4 space-y-3 bg-white/[0.03] hover:border-cyan-400/30 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-white text-sm">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.location}</p>
                  </div>
                  <span className="rounded-full bg-cyan-500/20 border border-cyan-400/40 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-300">
                    {p.status}
                  </span>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-slate-300">
                    <span>Site Progress</span>
                    <span className="text-cyan-300 font-bold">{p.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] transition-all duration-1000 ease-out"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Schedule: {p.start_date} → {p.end_date || 'TBD'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ===========================================================================
  // 3. CONTRACTOR DASHBOARD (Own Bids/Projects, Assigned Tasks, Own Daily Logs)
  // ===========================================================================
  if (role === 'contractor') {
    const assignedProjects = store.projects.filter((p) =>
      userChosenProjects.length > 0
        ? userChosenProjects.includes(p.name.toLowerCase())
        : p.assigned_contractor !== false
    )
    const openBids = bids.filter((b) =>
      ['estimating', 'checklist', 'approved', 'submitted', 'awarded'].includes(b.status)
    )
    const mySubmittedProposals = (biddingStore?.contractor_proposals ?? []).filter(
      (cp) => !userEmail || cp.contractor_email.toLowerCase() === userEmail.toLowerCase()
    )
    const ownDailyLogs = store.daily_logs.filter(
      (l) => !userEmail || l.author_email.toLowerCase() === userEmail.toLowerCase()
    )

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Contractor Portal &amp; Field Hub</span>
            </span>
            <h2 className="text-xl font-extrabold text-white sm:text-2xl">
              My Bids, Assigned Projects, Site Tasks &amp; Daily Logs
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              View open invitations to bid, submit your own bid &amp; track status, update assigned
              site tasks, and submit your own daily logs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              href="/bidding"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition"
            >
              View Open Bids &amp; Submit Bid →
            </Link>
            <Link
              href="/daily-logs"
              className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white transition"
            >
              + Submit My Daily Log
            </Link>
          </div>
        </div>

        {/* 4 Contractor KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Open Bids Available</p>
            <p className="mt-2 text-2xl font-black text-amber-400">{openBids.length}</p>
            <p className="mt-1 text-xs text-slate-300">
              {mySubmittedProposals.length} own bid submission(s) tracked
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Projects</p>
            <p className="mt-2 text-2xl font-black text-white">{assignedProjects.length}</p>
            <p className="mt-1 text-xs text-cyan-300">Active contractor site assignments</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Site Tasks</p>
            <p className="mt-2 text-2xl font-black text-emerald-400">{store.tasks.length}</p>
            <p className="mt-1 text-xs text-emerald-300 font-semibold">
              Update task progress % on site
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">My Daily Logs</p>
            <p className="mt-2 text-2xl font-black text-indigo-300">{ownDailyLogs.length}</p>
            <p className="mt-1 text-xs text-slate-300">Submitted site reports &amp; photos</p>
          </div>
        </div>

        {/* Contractor Assigned Projects & Open Bids */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">
                Open Invitations to Bid &amp; My Bid Status
              </h3>
              <Link href="/bidding" className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline">
                Open Bidding Portal →
              </Link>
            </div>
            <div className="space-y-2.5">
              {openBids.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/70 p-3.5 text-xs shadow-md"
                >
                  <div>
                    <p className="font-bold text-white">{b.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {b.reference_no} • Deadline: {b.submission_deadline}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-500/20 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                    {b.status === 'awarded' ? 'Awarded' : 'Open for Bid'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">
                My Assigned Projects ({assignedProjects.length})
              </h3>
              <Link href="/projects" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline">
                View Assigned Sites →
              </Link>
            </div>
            <div className="space-y-3">
              {assignedProjects.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-white/10 bg-slate-900/80 p-4 text-xs space-y-3 shadow-lg backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-sm text-white">{p.name}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        {p.status === 'active' ? 'Active Site' : p.status}
                      </span>
                      <span className="font-black text-sm text-cyan-400">{p.progress}%</span>
                    </div>
                  </div>

                  {/* High-Contrast Recessed Channel + Glowing Progress Bar */}
                  <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-slate-950/90 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 shadow-[0_0_14px_rgba(34,211,238,0.65)] transition-all duration-700"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-white/5">
                    <span>Schedule: {p.start_date} → {p.end_date || 'TBD'}</span>
                    <span className="text-emerald-400 font-semibold">{p.progress}% • On Track</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ===========================================================================
  // 4. CLIENT DASHBOARD (Read-Only Progress, Approved Daily Logs, Shared Docs)
  // ===========================================================================
  const clientProjects = store.projects.filter((p) =>
    userChosenProjects.length > 0
      ? userChosenProjects.includes(p.name.toLowerCase())
      : true
  )
  const approvedLogs = store.daily_logs.filter((l) => l.approval_status === 'approved')
  const sharedDocs = store.documents.filter((d) => d.shared_with_client !== false)
  const avgProgress =
    clientProjects.length > 0
      ? Math.round(
          clientProjects.reduce((s, p) => s + p.progress, 0) / clientProjects.length
        )
      : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-purple-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Client Read-Only Project Portal</span>
          </span>
          <h2 className="text-xl font-extrabold text-white sm:text-2xl">
            Project Progress, Approved Site Logs &amp; Shared Documents
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Read-only monitoring of construction completion milestones, Engineer-approved site logs,
            and shared blueprints.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportProgressCsv}
            className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500 transition"
          >
            Export Progress Report (CSV) →
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white transition"
          >
            Print / Save Progress PDF
          </button>
        </div>
      </div>

      {/* 3 Client Read-Only KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Completion</p>
          <p className="mt-2 text-2xl font-black text-white">{avgProgress}% Avg</p>
          <p className="mt-1 text-xs text-purple-300 font-medium">
            Across {store.projects.length} monitored projects
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved Daily Logs</p>
          <p className="mt-2 text-2xl font-black text-emerald-400">{approvedLogs.length}</p>
          <p className="mt-1 text-xs text-slate-300">Verified site updates &amp; photos</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Shared Documents</p>
          <p className="mt-2 text-2xl font-black text-cyan-400">{sharedDocs.length}</p>
          <p className="mt-1 text-xs text-slate-300">Approved blueprints &amp; permits</p>
        </div>
      </div>

      {/* Read-Only Project Progress Cards */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white">Project Progress Milestones</h3>
          <Link href="/projects" className="text-xs font-bold text-purple-300 hover:text-purple-200 hover:underline">
            View Projects →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {clientProjects.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-white/10 bg-slate-900/80 p-4 space-y-3 shadow-md backdrop-blur-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-extrabold text-white text-sm">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.location}</p>
                </div>
                <span className="rounded-full bg-purple-500/20 border border-purple-400/30 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-300">
                  {p.status}
                </span>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs font-bold text-slate-300">
                  <span>Completion</span>
                  <span className="text-cyan-400">{p.progress}%</span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-950/90 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 shadow-[0_0_12px_rgba(168,85,247,0.6)] transition-all duration-700"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-white/5">
                Target Completion: {p.end_date || 'TBD'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
