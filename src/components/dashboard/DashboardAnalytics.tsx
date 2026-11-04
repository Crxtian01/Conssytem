'use client'

import Link from 'next/link'
import type { StoreData } from '@/lib/module-store'
import { ROLES, type UserRole } from '@/lib/roles'

export default function DashboardAnalytics({
  store,
  role,
}: {
  store: StoreData
  role: UserRole
}) {
  const perms = ROLES[role].permissions

  const totalProjects = store.projects.length
  const avgProgress =
    totalProjects > 0
      ? Math.round(store.projects.reduce((s, p) => s + p.progress, 0) / totalProjects)
      : 0

  const totalBudget = store.projects.reduce((s, p) => s + p.budget, 0)
  const totalApprovedSpent = store.expenses
    .filter((e) => e.approval_status === 'approved')
    .reduce((s, e) => s + e.amount, 0)
  const pendingExpensesCount = store.expenses.filter(
    (e) => e.approval_status === 'pending'
  ).length

  const lowStockMaterials = store.materials.filter(
    (m) => m.current_stock <= m.reorder_level
  )

  const totalAttendanceHours = store.attendance.reduce(
    (s, a) => s + a.hours_worked,
    0
  )
  const presentRecords = store.attendance.filter((a) => a.status !== 'absent').length

  function handleExportExcel() {
    const lines: string[][] = [
      ['CONSTRUCTMS — DASHBOARD & EXECUTIVE REPORT'],
      [],
      ['1. PROJECT PROGRESS & BUDGET VS ACTUAL'],
      ['Project Name', 'Location', 'Status', 'Progress %', 'Budget (PHP)', 'Approved Cost (PHP)', 'Variance (PHP)'],
      ...store.projects.map((p) => {
        const spent = store.expenses
          .filter((e) => e.project_id === p.id && e.approval_status === 'approved')
          .reduce((s, e) => s + e.amount, 0)
        return [
          p.name,
          p.location,
          p.status,
          `${p.progress}%`,
          perms.viewBudgets ? `${p.budget}` : 'Restricted',
          perms.viewBudgets ? `${spent}` : 'Restricted',
          perms.viewBudgets ? `${p.budget - spent}` : 'Restricted',
        ]
      }),
      [],
      ['2. LOW-STOCK MATERIALS ALERT'],
      ['Material', 'Current Stock', 'Reorder Level', 'Unit', 'Status'],
      ...store.materials.map((m) => [
        m.name,
        `${m.current_stock}`,
        `${m.reorder_level}`,
        m.unit,
        m.current_stock <= m.reorder_level ? 'LOW STOCK' : 'OK',
      ]),
      [],
      ['3. WORKER ATTENDANCE SUMMARY'],
      ['Worker', 'Date', 'Hours Worked', 'Status'],
      ...store.attendance.map((a) => [
        a.worker_name,
        a.attendance_date,
        `${a.hours_worked}`,
        a.status,
      ]),
    ]

    const csv = lines
      .map((row) => row.map((cell) => `"${(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `constructms-dashboard-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  const projectMap = Object.fromEntries(store.projects.map((p) => [p.id, p.name]))

  return (
    <div className="space-y-6">
      {/* Top Action Bar with Export to Excel & PDF (Section 13) */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Section 13: Executive Dashboard &amp; Live Site Metrics
          </h2>
          <p className="text-xs text-gray-500">
            Real-time project progress, budget vs. actual cost, low-stock alerts, and attendance
            summaries.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            📥 Export to Excel (CSV)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-700"
          >
            🖨️ Export / Save as PDF
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">Project Progress</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{avgProgress}% Avg</p>
          <p className="mt-1 text-xs text-amber-700 font-medium">
            Across {totalProjects} active construction sites
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">Budget vs. Actual</p>
          {perms.viewBudgets ? (
            <>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                ₱{totalApprovedSpent.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                of ₱{totalBudget.toLocaleString()} total budget ({pendingExpensesCount} pending)
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-bold text-gray-400">Restricted</p>
              <p className="mt-1 text-xs text-gray-400">
                Hidden for {ROLES[role].label} role
              </p>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">Low-Stock Materials</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              lowStockMaterials.length > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {lowStockMaterials.length} Alert{lowStockMaterials.length === 1 ? '' : 's'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Out of {store.materials.length} tracked inventory items
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-400">Attendance Summary</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{totalAttendanceHours} hrs</p>
          <p className="mt-1 text-xs text-emerald-700 font-medium">
            {presentRecords} shift logs • {store.workers.length} active workers
          </p>
        </div>
      </div>

      {/* 1. Project Progress & 2. Budget vs Actual per Project */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">
            1. Project Progress &amp; Budget vs. Actual Cost
          </h3>
          <Link href="/projects" className="text-xs font-semibold text-amber-600 hover:underline">
            Manage Projects →
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
                    <p className="text-xs text-gray-500">📍 {p.location}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                    {p.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-gray-700">
                    <span>Site Completion</span>
                    <span>{p.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>

                {/* Budget vs Actual Bar */}
                {perms.viewBudgets ? (
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
                ) : (
                  <p className="text-[11px] italic text-gray-400">
                    Budget metrics restricted for {ROLES[role].label}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Low-Stock Materials & 4. Attendance Summaries Side-by-Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low-Stock Materials */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              2. Low-Stock Materials Watchlist
            </h3>
            <Link
              href="/materials"
              className="text-xs font-semibold text-amber-600 hover:underline"
            >
              Open Inventory →
            </Link>
          </div>

          <div className="space-y-2.5">
            {store.materials.map((m) => {
              const isLow = m.current_stock <= m.reorder_level
              return (
                <div
                  key={m.id}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs ${
                    isLow
                      ? 'border-red-200 bg-red-50/70 text-red-900'
                      : 'border-gray-100 bg-gray-50 text-gray-800'
                  }`}
                >
                  <div>
                    <p className="font-bold">{m.name}</p>
                    <p className="text-[11px] opacity-75">
                      Reorder level: {m.reorder_level} {m.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      {m.current_stock} {m.unit}
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isLow
                          ? 'bg-red-200 text-red-900'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {isLow ? 'LOW STOCK ⚠️' : 'OK ✅'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              3. Worker Attendance Summary
            </h3>
            <Link
              href="/attendance"
              className="text-xs font-semibold text-amber-600 hover:underline"
            >
              Log Attendance →
            </Link>
          </div>

          <div className="space-y-2.5">
            {store.attendance.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs"
              >
                <div>
                  <p className="font-bold text-gray-900">{a.worker_name}</p>
                  <p className="text-[11px] text-gray-500">
                    {projectMap[a.project_id] || 'Site'} • {a.attendance_date}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-gray-900">{a.hours_worked} hrs</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                    {a.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
