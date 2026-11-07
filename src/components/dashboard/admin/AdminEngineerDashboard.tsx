'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import AdminDashboardFilters from '@/components/dashboard/admin/AdminDashboardFilters'
import AnimatedKpiCard from '@/components/dashboard/admin/AnimatedKpiCard'
import AdminDashboardCharts from '@/components/dashboard/admin/AdminDashboardCharts'
import {
  createKpiGridVariants,
  getDashboardAnimationTimings,
  type AnimationMode,
} from '@/lib/admin-dashboard-animation'
import { ROLES } from '@/lib/roles'
import type {
  AdminDashboardPayload,
  DateRangePreset,
} from '@/types/database.types'

interface AdminEngineerDashboardProps {
  initialPayload: AdminDashboardPayload
}

export default function AdminEngineerDashboard({
  initialPayload,
}: AdminEngineerDashboardProps) {
  const router = useRouter()
  const systemReducedMotion = Boolean(useReducedMotion())

  const [payload, setPayload] = useState<AdminDashboardPayload>(initialPayload)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialPayload.filters.projectId || 'all'
  )
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangePreset>(
    initialPayload.filters.dateRange || 'this_quarter'
  )
  const [customStartDate, setCustomStartDate] = useState<string>(
    initialPayload.filters.startDate
  )
  const [customEndDate, setCustomEndDate] = useState<string>(
    initialPayload.filters.endDate
  )

  // Animation & QA states (plays on every mount/navigation/refresh — no localStorage/sessionStorage flags)
  const [animMode, setAnimMode] = useState<AnimationMode>('initial')
  const [animCycleKey, setAnimCycleKey] = useState<number>(1)
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [isFetchingFilter, setIsFetchingFilter] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [busyApprovalId, setBusyApprovalId] = useState<string | null>(null)

  // Optional QA simulation toggles for testing skeleton, empty state, and reduced-motion fallback
  const [showQaChecklist, setShowQaChecklist] = useState<boolean>(false)
  const [simulateSkeleton, setSimulateSkeleton] = useState<boolean>(false)
  const [simulateEmpty, setSimulateEmpty] = useState<boolean>(false)
  const [forceReducedMotion, setForceReducedMotion] = useState<boolean>(false)

  const reducedMotion = systemReducedMotion || forceReducedMotion

  useEffect(() => {
    function checkViewport() {
      setIsMobile(window.innerWidth < 640)
    }
    checkViewport()
    window.addEventListener('resize', checkViewport, { passive: true })
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  const effectiveMode: AnimationMode = reducedMotion ? 'reduced' : animMode
  const timings = getDashboardAnimationTimings(effectiveMode, isMobile)
  const kpiGridVariants = createKpiGridVariants(timings)

  async function applyFiltersAndFetch(
    nextProjectId: string,
    nextRange: DateRangePreset,
    nextStart: string,
    nextEnd: string
  ) {
    setIsFetchingFilter(true)
    setErrorMessage(null)

    try {
      const qs = new URLSearchParams({
        projectId: nextProjectId,
        dateRange: nextRange,
        startDate: nextStart,
        endDate: nextEnd,
      })
      const res = await fetch(`/api/dashboard/admin?${qs.toString()}`, {
        cache: 'no-store',
      })
      const data = (await res.json()) as {
        payload?: AdminDashboardPayload
        error?: string
      }
      setIsFetchingFilter(false)

      if (!res.ok || !data.payload) {
        setErrorMessage(data.error || 'Failed to load filtered dashboard data.')
        return
      }

      // Replay the shorter filter-change animation sequence once data arrives
      setAnimMode('filter')
      setPayload(data.payload)
      setAnimCycleKey((k) => k + 1)
    } catch {
      setIsFetchingFilter(false)
      setErrorMessage('Network error while updating dashboard filters.')
    }
  }

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId)
    void applyFiltersAndFetch(
      projectId,
      selectedDateRange,
      customStartDate,
      customEndDate
    )
  }

  function handleDateRangeChange(range: DateRangePreset) {
    setSelectedDateRange(range)
    void applyFiltersAndFetch(
      selectedProjectId,
      range,
      customStartDate,
      customEndDate
    )
  }

  function handleCustomDatesChange(start: string, end: string) {
    setCustomStartDate(start)
    setCustomEndDate(end)
    void applyFiltersAndFetch(selectedProjectId, 'custom', start, end)
  }

  function handleReplayFullAnimation() {
    setAnimMode('initial')
    setAnimCycleKey((k) => k + 1)
  }

  function handleExportCsv() {
    const rows: string[][] = [
      ['CONSTRUCTMS — ADMIN / ENGINEER EXECUTIVE DASHBOARD REPORT'],
      [
        `Project Scope: ${payload.filters.projectName}`,
        `Period: ${payload.filters.startDate} to ${payload.filters.endDate}`,
      ],
      [],
      ['KPI METRIC', 'VALUE', 'CHANGE VS PRIOR PERIOD', 'DIRECTION'],
      ...payload.kpis.map((k) => [
        k.title,
        String(k.value),
        `${k.changePct}%`,
        k.direction.toUpperCase(),
      ]),
      [],
      ['PROJECT PROGRESS & BUDGET UTILIZATION'],
      [
        'Project Name',
        'Location',
        'Status',
        'Actual Progress %',
        'Planned Progress %',
        'Approved Spend (PHP)',
        'Budget (PHP)',
      ],
      ...payload.charts.progressPerProject.map((p) => [
        p.name,
        p.location,
        p.status,
        `${p.actualProgress}%`,
        `${p.plannedProgress}%`,
        String(p.spent),
        String(p.budget),
      ]),
    ]

    const csv = rows
      .map((r) => r.map((c) => `"${(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `constructms-admin-dashboard-${payload.filters.startDate}.csv`
    link.click()
  }

  async function handleExpenseApproval(id: string, action: 'approve' | 'reject') {
    setBusyApprovalId(id)
    const res = await fetch('/api/modules/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    })
    setBusyApprovalId(null)
    if (res.ok) {
      await applyFiltersAndFetch(
        selectedProjectId,
        selectedDateRange,
        customStartDate,
        customEndDate
      )
      router.refresh()
    }
  }

  async function handleMaterialRequestApproval(
    id: string,
    action: 'approve_request' | 'reject_request'
  ) {
    setBusyApprovalId(id)
    const res = await fetch('/api/modules/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    })
    setBusyApprovalId(null)
    if (res.ok) {
      await applyFiltersAndFetch(
        selectedProjectId,
        selectedDateRange,
        customStartDate,
        customEndDate
      )
      router.refresh()
    }
  }

  async function handleRoleRequestApproval(
    requestId: string,
    action: 'approve_request' | 'reject_request'
  ) {
    setBusyApprovalId(requestId)
    const res = await fetch('/api/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, requestId }),
    })
    setBusyApprovalId(null)
    if (res.ok) {
      await applyFiltersAndFetch(
        selectedProjectId,
        selectedDateRange,
        customStartDate,
        customEndDate
      )
      router.refresh()
    }
  }

  const projectMap = Object.fromEntries(
    payload.projectsList.map((p) => [p.id, p.name])
  )
  const isShowingSkeleton = isFetchingFilter || simulateSkeleton

  return (
    <div className="min-w-0 space-y-6">
      {/* 1. HEADER & INTERACTIVE FILTER BAR */}
      <AdminDashboardFilters
        projects={payload.projectsList}
        selectedProjectId={selectedProjectId}
        selectedDateRange={selectedDateRange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onProjectChange={handleProjectChange}
        onDateRangeChange={handleDateRangeChange}
        onCustomDatesChange={handleCustomDatesChange}
        onExportCsv={handleExportCsv}
        onReplayAnimations={handleReplayFullAnimation}
        isFetchingFilter={isFetchingFilter}
        timings={timings}
        reducedMotion={reducedMotion}
      />

      {/* 2. TOP ROW: 6 KPI CARDS (2-Column Grid on Phones, 3 on Tablet, 6 on Desktop) */}
      <motion.section
        key={`kpi-grid-${animCycleKey}`}
        variants={kpiGridVariants}
        initial="hidden"
        animate="visible"
        aria-label="Key Performance Indicators"
        className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6"
      >
        {payload.kpis.map((metric) => (
          <AnimatedKpiCard
            key={metric.id}
            metric={metric}
            timings={timings}
            animationKey={animCycleKey}
            reducedMotion={reducedMotion}
            isLoading={isShowingSkeleton}
            errorMessage={errorMessage}
          />
        ))}
      </motion.section>

      {/* 3. ALL 8 RECHARTS & PROGRESS VISUALIZATIONS */}
      <AdminDashboardCharts
        charts={payload.charts}
        timings={timings}
        animationKey={animCycleKey}
        reducedMotion={reducedMotion}
        isLoading={isShowingSkeleton}
        errorMessage={errorMessage}
        forceEmptyState={simulateEmpty}
      />

      {/* 4. ADMIN / ENGINEER EXCLUSIVE APPROVAL QUEUES (EXPENSES, MATERIALS, ROLES) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pending Expense Approvals */}
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Pending Expenses ({payload.approvalsQueue.pendingExpenses.length})
              </h3>
              <p className="text-xs text-gray-500">
                Encoded by Assistants — requires Engineer sign-off
              </p>
            </div>
            <Link
              href="/expenses"
              className="text-xs font-semibold text-amber-700 hover:underline"
            >
              View All →
            </Link>
          </div>
          {payload.approvalsQueue.pendingExpenses.length === 0 ? (
            <p className="rounded-xl bg-gray-50 p-4 text-xs text-gray-500">
              All submitted expenses have been reviewed.
            </p>
          ) : (
            <div className="space-y-2.5">
              {payload.approvalsQueue.pendingExpenses.map((ex) => (
                <div
                  key={ex.id}
                  className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-xs sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-gray-900">
                      {ex.description} — ₱{ex.amount.toLocaleString('en-PH')}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      {projectMap[ex.project_id] || 'Site'} • {ex.category}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={busyApprovalId === ex.id}
                      onClick={() => handleExpenseApproval(ex.id, 'approve')}
                      className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyApprovalId === ex.id}
                      onClick={() => handleExpenseApproval(ex.id, 'reject')}
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

        {/* Pending Material Requests */}
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Material Requests ({payload.approvalsQueue.pendingMaterialRequests.length})
              </h3>
              <p className="text-xs text-gray-500">
                Approving automatically restocks site inventory
              </p>
            </div>
            <Link
              href="/materials"
              className="text-xs font-semibold text-amber-700 hover:underline"
            >
              Materials →
            </Link>
          </div>
          {payload.approvalsQueue.pendingMaterialRequests.length === 0 ? (
            <p className="rounded-xl bg-gray-50 p-4 text-xs text-gray-500">
              No pending material restock requests.
            </p>
          ) : (
            <div className="space-y-2.5">
              {payload.approvalsQueue.pendingMaterialRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/40 p-3 text-xs sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-gray-900">
                      {req.quantity} {req.unit} × {req.material_name}{' '}
                      <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
                        {req.urgency}
                      </span>
                    </p>
                    <p className="text-[11px] text-gray-600">
                      {projectMap[req.project_id] || 'Site'} • {req.notes}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={busyApprovalId === req.id}
                      onClick={() =>
                        handleMaterialRequestApproval(req.id, 'approve_request')
                      }
                      className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyApprovalId === req.id}
                      onClick={() =>
                        handleMaterialRequestApproval(req.id, 'reject_request')
                      }
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

        {/* Pending Role Upgrade Requests */}
        <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Role Requests ({payload.approvalsQueue.pendingRoleRequests.length})
              </h3>
              <p className="text-xs text-gray-500">
                Team role upgrade requests awaiting Admin sign-off
              </p>
            </div>
            <Link
              href="/users"
              className="text-xs font-semibold text-amber-700 hover:underline"
            >
              Users &amp; Roles →
            </Link>
          </div>
          {payload.approvalsQueue.pendingRoleRequests.length === 0 ? (
            <p className="rounded-xl bg-gray-50 p-4 text-xs text-gray-500">
              No pending role upgrade requests.
            </p>
          ) : (
            <div className="space-y-2.5">
              {payload.approvalsQueue.pendingRoleRequests.map((rr) => (
                <div
                  key={rr.id}
                  className="flex flex-col gap-2 rounded-xl border border-purple-200 bg-purple-50/40 p-3 text-xs sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-gray-900">{rr.user_email}</p>
                    <p className="text-[11px] text-gray-600">
                      {ROLES[rr.current_role]?.label} →{' '}
                      <strong className="text-purple-900">
                        {ROLES[rr.requested_role]?.label}
                      </strong>
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={busyApprovalId === rr.id}
                      onClick={() =>
                        handleRoleRequestApproval(rr.id, 'approve_request')
                      }
                      className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyApprovalId === rr.id}
                      onClick={() =>
                        handleRoleRequestApproval(rr.id, 'reject_request')
                      }
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
      </section>

      {/* 5. INTERACTIVE QA & VERIFICATION TEST CHECKLIST DRAWER */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Admin / Engineer Dashboard — Interactive Verification &amp; Test Checklist
            </h3>
            <p className="text-xs text-gray-500">
              Use the simulation toggles below to test skeleton loading, empty states, reduced
              motion, and animation replays.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSimulateSkeleton((v) => !v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                simulateSkeleton
                  ? 'border-amber-500 bg-amber-100 text-amber-900'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {simulateSkeleton ? 'Stop Skeleton Loader' : 'Simulate Slow Network (Skeletons)'}
            </button>
            <button
              type="button"
              onClick={() => setSimulateEmpty((v) => !v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                simulateEmpty
                  ? 'border-amber-500 bg-amber-100 text-amber-900'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {simulateEmpty ? 'Restore Chart Data' : 'Simulate Empty Data State'}
            </button>
            <button
              type="button"
              onClick={() => {
                setForceReducedMotion((v) => !v)
                setAnimCycleKey((k) => k + 1)
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                forceReducedMotion
                  ? 'border-purple-500 bg-purple-100 text-purple-900'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {forceReducedMotion ? 'Disable Reduced Motion' : 'Test Reduced-Motion Fallback'}
            </button>
            <button
              type="button"
              onClick={() => setShowQaChecklist((v) => !v)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
            >
              {showQaChecklist ? 'Hide Test Checklist ▲' : 'Show 11-Point Test Checklist ▼'}
            </button>
          </div>
        </div>

        {showQaChecklist && (
          <div className="grid gap-2.5 border-t border-gray-100 pt-3.5 text-xs sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: '1. First Open',
                desc: 'Header slides down, 6 KPI cards stagger fade-up (~85ms), numbers count up, ▲/▼ badges pop in, sparklines & 8 charts animate (~1.7s total).',
              },
              {
                title: '2. Returning from Another Page',
                desc: 'Click Projects in the sidebar and return to Dashboard — full animation sequence plays every time (no localStorage/sessionStorage flags).',
              },
              {
                title: '3. Page Refresh (F5)',
                desc: 'Reloading the browser re-runs the server fetch and plays the complete entrance choreography.',
              },
              {
                title: '4. Filter Change',
                desc: 'Select a specific project or switch period (This Week / This Month / Custom) — replays a snappier (~0.9s) animation with updated KPIs & charts.',
              },
              {
                title: '5. Slow Network Skeletons',
                desc: 'Click "Simulate Slow Network (Skeletons)" above — reserves exact card & chart dimensions (no layout shift) and starts animation only after data arrives.',
              },
              {
                title: '6. Empty Data State',
                desc: 'Click "Simulate Empty Data State" above — displays friendly empty states inside each chart card without broken axes.',
              },
              {
                title: '7. Negative & Positive Trends',
                desc: 'Switch project to "Metro Commercial Tower" (cost ▲ is red) vs "All Projects" (cost ▼ is green; progress ▲ is green). Always shows ▲/▼ + %. ',
              },
              {
                title: '8. Low-Stock Highlighting',
                desc: 'In Chart #4, items at or below reorder threshold render in red (#dc2626), reveal the red reorder reference line after bars grow, and pulse once subtly.',
              },
              {
                title: '9. Non-Admin Access Denied',
                desc: 'Switch role preview in sidebar or visit /admin-dashboard as Assistant/Contractor/Client — server enforces verified role check and shows Access Denied.',
              },
              {
                title: '10. Reduced-Motion On',
                desc: 'Enable OS prefers-reduced-motion or click "Test Reduced-Motion Fallback" — disables count-up and chart sweeps, showing final values immediately.',
              },
              {
                title: '11. Phone Screen (< 640px)',
                desc: 'KPI cards arrange in a 2-column grid (grid-cols-2), charts stack in 1 column, stagger durations shorten by 28%, and there is zero horizontal scroll.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-3 space-y-1"
              >
                <p className="font-bold text-gray-900">✅ {item.title}</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

