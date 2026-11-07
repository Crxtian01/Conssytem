'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { StoreData } from '@/lib/module-store'
import type { BiddingStoreData } from '@/lib/bidding-store'
import { ROLES, type UserRole } from '@/lib/roles'

export default function DashboardAnalytics({
  store: initialStore,
  biddingStore,
  role,
  userEmail = '',
}: {
  store: StoreData
  biddingStore?: BiddingStoreData
  role: UserRole
  userEmail?: string
}) {
  const router = useRouter()
  const [store, setStore] = useState(initialStore)
  const [busyId, setBusyId] = useState<string | null>(null)
  const perms = ROLES[role].permissions

  const bids = biddingStore?.bids ?? []
  const projectMap = Object.fromEntries(store.projects.map((p) => [p.id, p.name]))

  async function handleExpenseDecision(id: string, action: 'approve' | 'reject') {
    setBusyId(id)
    const res = await fetch('/api/modules/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    })
    const data = await res.json()
    setBusyId(null)
    if (res.ok) {
      setStore({
        ...store,
        expenses: store.expenses.map((e) => (e.id === id ? data.item : e)),
      })
      router.refresh()
    }
  }

  async function handleMaterialReqDecision(
    id: string,
    action: 'approve_request' | 'reject_request'
  ) {
    setBusyId(id)
    const res = await fetch('/api/modules/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    })
    const data = await res.json()
    setBusyId(null)
    if (res.ok) {
      setStore({
        ...store,
        material_requests: store.material_requests.map((r) =>
          r.id === id ? data.item : r
        ),
        materials: data.updatedMaterial
          ? store.materials.map((m) =>
              m.id === data.updatedMaterial.id ? data.updatedMaterial : m
            )
          : store.materials,
      })
      router.refresh()
    }
  }

  async function handleRoleReqDecision(
    requestId: string,
    action: 'approve_request' | 'reject_request'
  ) {
    setBusyId(requestId)
    const res = await fetch('/api/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, requestId }),
    })
    const data = await res.json()
    setBusyId(null)
    if (res.ok && data.role_requests) {
      setStore({
        ...store,
        role_requests: data.role_requests,
      })
      router.refresh()
    }
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
  // 1. ADMIN / ENGINEER DASHBOARD (Full Access + Exclusive Approvals Queue)
  // ===========================================================================
  if (role === 'admin_engineer') {
    const totalProjects = store.projects.length
    const avgProgress =
      totalProjects > 0
        ? Math.round(store.projects.reduce((s, p) => s + p.progress, 0) / totalProjects)
        : 0
    const totalBudget = store.projects.reduce((s, p) => s + p.budget, 0)
    const totalApprovedSpent = store.expenses
      .filter((e) => e.approval_status === 'approved')
      .reduce((s, e) => s + e.amount, 0)

    const pendingExpenses = store.expenses.filter((e) => e.approval_status === 'pending')
    const pendingMaterialReqs = store.material_requests.filter(
      (r) => r.approval_status === 'pending'
    )
    const pendingRoleReqs = store.role_requests.filter((r) => r.status === 'pending')
    const lowStockMaterials = store.materials.filter(
      (m) => m.current_stock <= m.reorder_level
    )

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-block rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-purple-800">
              Admin / Engineer Command Center
            </span>
            <h2 className="mt-1 text-lg font-bold text-gray-900">
              Full Executive Dashboard, Financial Oversight &amp; Approvals
            </h2>
            <p className="text-xs text-gray-500">
              Only Admin / Engineer can approve expenses &amp; material requests, delete records,
              issue/award bids, manage users, and approve role requests.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportProgressCsv}
              className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Export Executive CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-700"
            >
              Save as PDF
            </button>
          </div>
        </div>

        {/* 4 Admin KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-400">All Projects Progress</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{avgProgress}% Avg</p>
            <p className="mt-1 text-xs text-amber-700 font-medium">
              {totalProjects} total construction projects
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-400">Budget vs. Approved Spend</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              ₱{totalApprovedSpent.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              of ₱{totalBudget.toLocaleString()} total budget
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-400">Pending Admin Approvals</p>
            <p className="mt-2 text-2xl font-bold text-purple-700">
              {pendingExpenses.length + pendingMaterialReqs.length + pendingRoleReqs.length}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {pendingExpenses.length} expenses • {pendingMaterialReqs.length} material reqs •{' '}
              {pendingRoleReqs.length} role reqs
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-400">Bidding &amp; Low Stock</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {bids.length} Bids / {lowStockMaterials.length} Alerts
            </p>
            <p className="mt-1 text-xs text-emerald-700 font-medium">
              RA 12009 Award &amp; Inventory Control
            </p>
          </div>
        </div>

        {/* Admin Exclusive Approvals Center */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Expenses Approval */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Pending Expense Approvals ({pendingExpenses.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Submitted by Assistants as pending — requires your sign-off
                </p>
              </div>
              <Link href="/expenses" className="text-xs font-semibold text-amber-600 hover:underline">
                All Expenses →
              </Link>
            </div>
            {pendingExpenses.length === 0 ? (
              <p className="rounded-xl bg-gray-50 p-4 text-xs text-gray-500">
                All submitted expenses have been reviewed.
              </p>
            ) : (
              <div className="space-y-2.5">
                {pendingExpenses.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 text-xs sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-bold text-gray-900">
                        {ex.description} — ₱{ex.amount.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-gray-600">
                        {projectMap[ex.project_id] || 'Project'} • {ex.category} • By{' '}
                        {ex.submitted_by_email}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === ex.id}
                        onClick={() => handleExpenseDecision(ex.id, 'approve')}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === ex.id}
                        onClick={() => handleExpenseDecision(ex.id, 'reject')}
                        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Material Requests Approval */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Pending Material Requests ({pendingMaterialReqs.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Requested by Assistants — approving restocks site inventory
                </p>
              </div>
              <Link href="/materials" className="text-xs font-semibold text-amber-600 hover:underline">
                Materials →
              </Link>
            </div>
            {pendingMaterialReqs.length === 0 ? (
              <p className="rounded-xl bg-gray-50 p-4 text-xs text-gray-500">
                No pending material requests at this time.
              </p>
            ) : (
              <div className="space-y-2.5">
                {pendingMaterialReqs.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 text-xs sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-bold text-gray-900">
                        {req.quantity} {req.unit} × {req.material_name}{' '}
                        <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
                          {req.urgency}
                        </span>
                      </p>
                      <p className="text-[11px] text-gray-600">
                        {projectMap[req.project_id] || 'Project'} • {req.notes}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => handleMaterialReqDecision(req.id, 'approve_request')}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => handleMaterialReqDecision(req.id, 'reject_request')}
                        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Role Requests Banner (if any) */}
        {pendingRoleReqs.length > 0 && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-purple-950">
                Pending User Role Requests ({pendingRoleReqs.length})
              </h3>
              <Link href="/users" className="text-xs font-bold text-purple-800 hover:underline">
                Open User &amp; Role Management →
              </Link>
            </div>
            <div className="space-y-2">
              {pendingRoleReqs.map((rr) => (
                <div
                  key={rr.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 text-xs shadow-2xs"
                >
                  <div>
                    <span className="font-bold text-gray-900">{rr.user_email}</span> requested role
                    upgrade from <strong>{ROLES[rr.current_role]?.label}</strong> to{' '}
                    <strong className="text-purple-800">{ROLES[rr.requested_role]?.label}</strong>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={busyId === rr.id}
                      onClick={() => handleRoleReqDecision(rr.id, 'approve_request')}
                      className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve Role
                    </button>
                    <button
                      type="button"
                      disabled={busyId === rr.id}
                      onClick={() => handleRoleReqDecision(rr.id, 'reject_request')}
                      className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Projects Progress & Budget vs Actual */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              Project Progress &amp; Budget vs. Actual Cost
            </h3>
            <Link href="/projects" className="text-xs font-semibold text-amber-600 hover:underline">
              Manage All Projects →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {store.projects.map((p) => {
              const spent = store.expenses
                .filter((e) => e.project_id === p.id && e.approval_status === 'approved')
                .reduce((s, e) => s + e.amount, 0)
              const budgetPct =
                p.budget > 0 ? Math.min(100, Math.round((spent / p.budget) * 100)) : 0
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.location}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                      {p.status}
                    </span>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs font-semibold text-gray-700">
                      <span>Completion</span>
                      <span>{p.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-gray-600">
                      <span>Spent: ₱{spent.toLocaleString()}</span>
                      <span>Budget: ₱{p.budget.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${
                          budgetPct > 90 ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${budgetPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ===========================================================================
  // 2. ASSISTANT DASHBOARD (Assigned Projects, Operations & Draft Preparation)
  // ===========================================================================
  if (role === 'assistant') {
    const assignedProjects = store.projects.filter((p) => p.assigned_assistant !== false)
    const draftBids = bids.filter((b) =>
      ['draft', 'estimating', 'checklist'].includes(b.status)
    )
    const pendingMaterialReqs = store.material_requests.filter(
      (r) => r.approval_status === 'pending'
    )
    const myPendingExpenses = store.expenses.filter((e) => e.approval_status === 'pending')

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-blue-800">
              Assistant Operations Dashboard
            </span>
            <h2 className="mt-1 text-lg font-bold text-gray-900">
              Assigned Projects, Bid Preparation &amp; Site Encoding Workspace
            </h2>
            <p className="text-xs text-gray-500">
              Update assigned projects &amp; tasks, encode stock in/out &amp; material requests,
              record attendance, submit pending expenses, and prepare bid drafts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/bidding"
              className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Prepare Bid Drafts ({draftBids.length})
            </Link>
            <Link
              href="/materials"
              className="rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
            >
              Request Materials
            </Link>
          </div>
        </div>

        {/* 4 Assistant KPI Cards (No Financial Budget Totals) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-400">Assigned Projects</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{assignedProjects.length}</p>
            <p className="mt-1 text-xs text-blue-700 font-medium">
              View &amp; update progress
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-400">Draft Bids in Prep</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{draftBids.length}</p>
            <p className="mt-1 text-xs text-gray-500">
              Drafts, BOQ &amp; documents (Admin issues/awards)
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-400">Material Requests</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">
              {pendingMaterialReqs.length} Pending
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Awaiting Admin / Engineer approval
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-400">Pending Expenses</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{myPendingExpenses.length}</p>
            <p className="mt-1 text-xs text-gray-500">
              Encoded as pending for Engineer sign-off
            </p>
          </div>
        </div>

        {/* Assigned Projects List (Progress Only — No Financial Summary) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              Assigned Projects ({assignedProjects.length})
            </h3>
            <Link href="/projects" className="text-xs font-semibold text-amber-600 hover:underline">
              Update Project Progress →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {assignedProjects.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.location}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-900">
                    {p.status}
                  </span>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-gray-700">
                    <span>Site Progress</span>
                    <span>{p.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500">
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
    const assignedProjects = store.projects.filter((p) => p.assigned_contractor !== false)
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
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-amber-900">
              Contractor Portal &amp; Field Hub
            </span>
            <h2 className="mt-1 text-lg font-bold text-gray-900">
              My Bids, Assigned Projects, Site Tasks &amp; Daily Logs
            </h2>
            <p className="text-xs text-gray-500">
              View open invitations to bid, submit your own bid &amp; track status, update assigned
              site tasks, and submit your own daily logs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/bidding"
              className="rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
            >
              View Open Bids &amp; Submit Bid →
            </Link>
            <Link
              href="/daily-logs"
              className="rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-700"
            >
              + Submit My Daily Log
            </Link>
          </div>
        </div>

        {/* 4 Contractor KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-400">Open Bids Available</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">{openBids.length}</p>
            <p className="mt-1 text-xs text-gray-500">
              {mySubmittedProposals.length} own bid submission(s) tracked
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-400">Assigned Projects</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{assignedProjects.length}</p>
            <p className="mt-1 text-xs text-gray-500">Active contractor site assignments</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-400">Assigned Site Tasks</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{store.tasks.length}</p>
            <p className="mt-1 text-xs text-emerald-700 font-medium">
              Update task progress % on site
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-400">My Daily Logs</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{ownDailyLogs.length}</p>
            <p className="mt-1 text-xs text-gray-500">Submitted site reports &amp; photos</p>
          </div>
        </div>

        {/* Contractor Assigned Projects & Open Bids */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                Open Invitations to Bid &amp; My Bid Status
              </h3>
              <Link href="/bidding" className="text-xs font-semibold text-amber-600 hover:underline">
                Open Bidding Portal →
              </Link>
            </div>
            <div className="space-y-2.5">
              {openBids.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-gray-900">{b.title}</p>
                    <p className="text-[11px] text-gray-500">
                      {b.reference_no} • Deadline: {b.submission_deadline}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                    {b.status === 'awarded' ? 'Awarded' : 'Open for Bid'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                My Assigned Projects ({assignedProjects.length})
              </h3>
              <Link href="/projects" className="text-xs font-semibold text-amber-600 hover:underline">
                View Assigned Sites →
              </Link>
            </div>
            <div className="space-y-2.5">
              {assignedProjects.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{p.name}</span>
                    <span className="font-semibold text-amber-700">{p.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${p.progress}%` }}
                    />
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
  const approvedLogs = store.daily_logs.filter((l) => l.approval_status === 'approved')
  const sharedDocs = store.documents.filter((d) => d.shared_with_client !== false)
  const avgProgress =
    store.projects.length > 0
      ? Math.round(
          store.projects.reduce((s, p) => s + p.progress, 0) / store.projects.length
        )
      : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-indigo-900">
            Client Read-Only Project Portal
          </span>
          <h2 className="mt-1 text-lg font-bold text-gray-900">
            Project Progress, Approved Site Logs &amp; Shared Documents
          </h2>
          <p className="text-xs text-gray-500">
            Read-only monitoring of construction completion milestones, Engineer-approved site logs,
            and shared blueprints.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportProgressCsv}
            className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Export Progress Report (CSV)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-700"
          >
            Print / Save Progress PDF
          </button>
        </div>
      </div>

      {/* 3 Client Read-Only KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">Overall Completion</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{avgProgress}% Avg</p>
          <p className="mt-1 text-xs text-indigo-700 font-medium">
            Across {store.projects.length} monitored projects
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">Approved Daily Logs</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{approvedLogs.length}</p>
          <p className="mt-1 text-xs text-gray-500">Verified site updates &amp; photos</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">Shared Documents</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{sharedDocs.length}</p>
          <p className="mt-1 text-xs text-gray-500">Approved blueprints &amp; permits</p>
        </div>
      </div>

      {/* Read-Only Project Progress Cards */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Project Progress Milestones</h3>
          <Link href="/projects" className="text-xs font-semibold text-indigo-600 hover:underline">
            View Projects →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {store.projects.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.location}</p>
                </div>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-900">
                  {p.status}
                </span>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs font-semibold text-gray-700">
                  <span>Completion</span>
                  <span>{p.progress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                Target Completion: {p.end_date || 'TBD'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
