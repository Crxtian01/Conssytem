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
import type { CooperationRequestRecord } from '@/lib/module-store'
import type {
  AdminDashboardPayload,
  DateRangePreset,
} from '@/types/database.types'

interface AdminEngineerDashboardProps {
  initialPayload: AdminDashboardPayload
  initialCooperationRequests?: CooperationRequestRecord[]
}

export default function AdminEngineerDashboard({
  initialPayload,
  initialCooperationRequests = [],
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
  const [cooperationRequests, setCooperationRequests] = useState<CooperationRequestRecord[]>(
    initialCooperationRequests
  )
  const [coopNotice, setCoopNotice] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/cooperation')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.cooperation_requests)) {
          setCooperationRequests(d.cooperation_requests)
        }
      })
      .catch(() => {
        // Keep initialCooperationRequests
      })
  }, [])

  async function handleCooperationApproval(
    requestId: string,
    decision: 'approve_request' | 'reject_request'
  ) {
    setBusyApprovalId(requestId)
    setCoopNotice(null)
    try {
      const res = await fetch('/api/cooperation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: decision, requestId }),
      })
      const data = await res.json()
      setBusyApprovalId(null)
      if (res.ok && data.request) {
        setCooperationRequests((prev) =>
          prev.map((item) => (item.id === requestId ? data.request : item))
        )
        setCoopNotice(
          decision === 'approve_request'
            ? `Approved ${data.request.full_name} (${data.request.email}) to join ${data.request.project_name}!`
            : `Rejected request from ${data.request.email}.`
        )
        router.refresh()
      }
    } catch {
      setBusyApprovalId(null)
    }
  }

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

  const activeProjectsKpi = payload.kpis.find((k) => k.id === 'active_projects')
  const overallProgressKpi = payload.kpis.find((k) => k.id === 'overall_progress')
  const openBidsKpi = payload.kpis.find((k) => k.id === 'open_bids')

  const progressRingPct = Math.min(
    100,
    Math.max(0, Math.round(overallProgressKpi?.value ?? 68))
  )
  const ringCircumference = 2 * Math.PI * 44
  const ringStrokeDashoffset =
    ringCircumference - (progressRingPct / 100) * ringCircumference

  const today = new Date()
  const dayNum = String(today.getDate()).padStart(2, '0')
  const weekdayName = today.toLocaleDateString('en-US', { weekday: 'long' })
  const monthYearName = today.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const totalPendingAttention =
    payload.approvalsQueue.pendingExpenses.length +
    payload.approvalsQueue.pendingMaterialRequests.length +
    payload.approvalsQueue.pendingRoleRequests.length

  return (
    <div className="min-w-0 space-y-6">
      {/* 0. CODE XR TOP BENTO HERO ROW: Terracotta Studio Banner + Schedule Calendar Card */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Terracotta Hero Card ("Your site operations are on a roll this week") */}
        <div className="codexr-terracotta-card flex flex-col justify-between rounded-[28px] p-6 sm:p-7 lg:col-span-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3 max-w-md">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wide text-amber-50">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                <span>
                  Engineering Sprint · {payload.filters.projectName}
                </span>
              </span>

              <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
                Your site operations are on a{' '}
                <span className="font-serif italic font-normal text-amber-100">
                  roll
                </span>{' '}
                this week
              </h2>

              <p className="text-xs leading-relaxed text-amber-50/85 sm:text-sm">
                {progressRingPct}% of scheduled milestones accomplished across{' '}
                {activeProjectsKpi?.value ?? 3} active construction sites and{' '}
                {openBidsKpi?.value ?? 3} RA 12009 bid packages.
              </p>

              {/* 3 Stat Callouts (Matches 12 / 7 / 98% in Code XR Video) */}
              <div className="grid grid-cols-3 gap-4 border-t border-white/20 pt-3.5">
                <div>
                  <p className="text-xl font-extrabold text-white">
                    {activeProjectsKpi?.value ?? 3}
                  </p>
                  <p className="text-[11px] font-medium text-amber-100/80">
                    Active sites
                  </p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-white">
                    {totalPendingAttention}
                  </p>
                  <p className="text-[11px] font-medium text-amber-100/80">
                    For approval
                  </p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-white">
                    {openBidsKpi?.value ?? 3}
                  </p>
                  <p className="text-[11px] font-medium text-amber-100/80">
                    RA 12009 bids
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Circular Radial Progress Ring (Matches 68% Ring in Code XR Video) */}
            <div className="relative mx-auto flex h-34 w-34 shrink-0 items-center justify-center sm:mx-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 108 108">
                <circle
                  cx="54"
                  cy="54"
                  r="44"
                  fill="none"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="10"
                />
                <circle
                  cx="54"
                  cy="54"
                  r="44"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringStrokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-white">
                  {progressRingPct}%
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-100/85">
                  completed
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Action Pills (Matches "View sprint ->" + "+ Add member" in Code XR Video) */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Link
              href="/projects"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#1e1512] shadow-sm transition hover:bg-amber-50"
            >
              <span>View projects</span>
              <span>→</span>
            </Link>
            <Link
              href="/bidding"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/25"
            >
              <span>+ RA 12009 Bidding</span>
            </Link>
          </div>
        </div>

        {/* Right: Schedule & Site Milestones Card */}
        <div className="rounded-3xl border border-white/10 bg-[#121624]/85 p-6 backdrop-blur-xl flex flex-col justify-between lg:col-span-5 text-white shadow-lg">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span className="text-4xl font-extrabold tracking-tight text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                  {dayNum}
                </span>
                <div>
                  <p className="text-sm font-extrabold text-white">
                    {weekdayName}
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    {monthYearName} · {totalPendingAttention} pending reviews
                  </p>
                </div>
              </div>
              <Link
                href="/tasks"
                className="rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-white/10 hover:text-white transition"
              >
                Schedule →
              </Link>
            </div>

            {/* 5-Day Week Strip */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {[
                { day: 'Mo', num: '09', active: false },
                { day: 'Tu', num: '10', active: true },
                { day: 'We', num: '11', active: false },
                { day: 'Th', num: '12', active: false },
                { day: 'Fr', num: '13', active: false },
              ].map((d) => (
                <div
                  key={d.day}
                  className={`flex flex-col items-center rounded-2xl py-2 text-xs font-bold transition ${
                    d.active
                      ? 'bg-cyan-500/25 border border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'border border-white/10 bg-white/[0.04] text-slate-400'
                  }`}
                >
                  <span className="text-[10px] opacity-75">{d.day}</span>
                  <span className="mt-0.5 text-sm font-extrabold">{d.num}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Site Inspections & Milestones */}
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-xs hover:border-cyan-400/30 transition">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-[11px] font-bold text-slate-400">
                  09:30
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">
                    RA 12009 Bid &amp; BOQ Review
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    Engineering Office · Envelope 1 &amp; 2
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-cyan-400 font-bold">→</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-xs hover:border-cyan-400/30 transition">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-[11px] font-bold text-slate-400">
                  13:30
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">
                    Structural Rebar &amp; Slab Inspection
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    Metro Commercial Tower · 8th Floor
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-cyan-400 font-bold">→</span>
            </div>
          </div>
        </div>
      </section>

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

      {/* 2.5 CODE XR 6 QUICK ACTION BENTO PILLS (Matches 00:01 in Video) */}
      <section
        aria-label="Quick workspace actions"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {[
          {
            title: 'Review material requests',
            sub: `${payload.approvalsQueue.pendingMaterialRequests.length} waiting for approval`,
            href: '/materials',
            badge: '🧱',
          },
          {
            title: 'Approve site expenses',
            sub: `${payload.approvalsQueue.pendingExpenses.length} pending sign-off`,
            href: '/expenses',
            badge: '💰',
          },
          {
            title: 'RA 12009 Bid packages',
            sub: `${openBidsKpi?.value ?? 3} active procurement bids`,
            href: '/bidding',
            badge: '🔨',
          },
          {
            title: 'Daily site logs & photos',
            sub: 'Inspect weather & field notes',
            href: '/daily-logs',
            badge: '📝',
          },
          {
            title: 'Workers & attendance',
            sub: 'Daily payroll & site check-in',
            href: '/attendance',
            badge: '👷',
          },
          {
            title: 'Team & role requests',
            sub: `${payload.approvalsQueue.pendingRoleRequests.length} role requests`,
            href: '/users',
            badge: '🛡️',
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="bg-white rounded-2xl flex items-center justify-between gap-3 px-4 py-3.5 transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#ede3da] text-base">
                {item.badge}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold text-[#1e1512]">
                  {item.title}
                </p>
                <p className="truncate text-[11px] font-medium text-[#6e5a52]">
                  {item.sub}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-sm font-bold text-[#6e5a52]">→</span>
          </Link>
        ))}
      </section>

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
        <div className="rounded-2xl border border-white/10 bg-[#121624]/85 p-5 shadow-lg backdrop-blur-xl space-y-3.5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Pending Expenses ({payload.approvalsQueue.pendingExpenses.length})
              </h3>
              <p className="text-xs text-slate-400">
                Encoded by Assistants — requires Engineer sign-off
              </p>
            </div>
            <Link
              href="/expenses"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
            >
              View All →
            </Link>
          </div>
          {payload.approvalsQueue.pendingExpenses.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400">
              All submitted expenses have been reviewed.
            </p>
          ) : (
            <div className="space-y-2.5">
              {payload.approvalsQueue.pendingExpenses.map((ex) => (
                <div
                  key={ex.id}
                  className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs sm:flex-row sm:items-center sm:justify-between text-white"
                >
                  <div>
                    <p className="font-bold text-white">
                      {ex.description} — ₱{ex.amount.toLocaleString('en-PH')}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      {projectMap[ex.project_id] || 'Site'} • {ex.category}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={busyApprovalId === ex.id}
                      onClick={() => handleExpenseApproval(ex.id, 'approve')}
                      className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-2.5 py-1 text-xs font-bold text-slate-950 disabled:opacity-50 transition"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyApprovalId === ex.id}
                      onClick={() => handleExpenseApproval(ex.id, 'reject')}
                      className="rounded-lg border border-red-500/40 bg-red-950/40 hover:bg-red-900/60 px-2.5 py-1 text-xs font-semibold text-red-300 disabled:opacity-50 transition"
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
        <div className="rounded-2xl border border-white/10 bg-[#121624]/85 p-5 shadow-lg backdrop-blur-xl space-y-3.5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Material Requests ({payload.approvalsQueue.pendingMaterialRequests.length})
              </h3>
              <p className="text-xs text-slate-400">
                Approving automatically restocks site inventory
              </p>
            </div>
            <Link
              href="/materials"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
            >
              Materials →
            </Link>
          </div>
          {payload.approvalsQueue.pendingMaterialRequests.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400">
              No pending material restock requests.
            </p>
          ) : (
            <div className="space-y-2.5">
              {payload.approvalsQueue.pendingMaterialRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col gap-2 rounded-xl border border-blue-500/30 bg-blue-950/20 p-3 text-xs sm:flex-row sm:items-center sm:justify-between text-white"
                >
                  <div>
                    <p className="font-bold text-white">
                      {req.quantity} {req.unit} × {req.material_name}{' '}
                      <span className="ml-1 rounded bg-red-500/30 border border-red-400/40 px-1.5 py-0.5 text-[10px] font-bold text-red-200">
                        {req.urgency}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-300">
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
                      className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-2.5 py-1 text-xs font-bold text-slate-950 disabled:opacity-50 transition"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyApprovalId === req.id}
                      onClick={() =>
                        handleMaterialRequestApproval(req.id, 'reject_request')
                      }
                      className="rounded-lg border border-red-500/40 bg-red-950/40 hover:bg-red-900/60 px-2.5 py-1 text-xs font-semibold text-red-300 disabled:opacity-50 transition"
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
        <div className="rounded-2xl border border-white/10 bg-[#121624]/85 p-5 shadow-lg backdrop-blur-xl space-y-3.5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Role Requests ({payload.approvalsQueue.pendingRoleRequests.length})
              </h3>
              <p className="text-xs text-slate-400">
                Team role upgrade requests awaiting Admin sign-off
              </p>
            </div>
            <Link
              href="/users"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
            >
              Users &amp; Roles →
            </Link>
          </div>
          {payload.approvalsQueue.pendingRoleRequests.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400">
              No pending role upgrade requests.
            </p>
          ) : (
            <div className="space-y-2.5">
              {payload.approvalsQueue.pendingRoleRequests.map((rr) => (
                <div
                  key={rr.id}
                  className="flex flex-col gap-2 rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 text-xs sm:flex-row sm:items-center sm:justify-between text-white"
                >
                  <div>
                    <p className="font-bold text-white">{rr.user_email}</p>
                    <p className="text-[11px] text-slate-300">
                      {ROLES[rr.current_role]?.label} →{' '}
                      <strong className="text-cyan-300">
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
                      className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-2.5 py-1 text-xs font-bold text-slate-950 disabled:opacity-50 transition"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyApprovalId === rr.id}
                      onClick={() =>
                        handleRoleRequestApproval(rr.id, 'reject_request')
                      }
                      className="rounded-lg border border-red-500/40 bg-red-950/40 hover:bg-red-900/60 px-2.5 py-1 text-xs font-semibold text-red-300 disabled:opacity-50 transition"
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

      {/* 4.5 PROJECT COOPERATION REQUESTS (Contractors / Team members requesting to join projects) */}
      <section className="rounded-2xl border border-white/10 bg-[#121624]/85 p-5 shadow-lg backdrop-blur-xl space-y-3.5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-white">
              Project Join &amp; Cooperation Requests ({cooperationRequests.filter((r) => r.status === 'pending').length} Pending)
            </h3>
            <p className="text-xs text-slate-400">
              Contractors and team members requesting to join specific projects
            </p>
          </div>
          {coopNotice && (
            <span className="rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              {coopNotice}
            </span>
          )}
        </div>

        {cooperationRequests.filter((r) => r.status === 'pending').length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400">
            No pending project cooperation requests.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cooperationRequests
              .filter((r) => r.status === 'pending')
              .map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 text-xs text-white space-y-2.5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-extrabold text-sm text-white">{req.full_name}</p>
                      <span className="rounded-full bg-cyan-500/20 border border-cyan-400/40 px-2 py-0.5 text-[10px] font-bold text-cyan-300 uppercase">
                        {req.requested_role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">{req.email}</p>
                    <p className="mt-1 text-xs font-semibold text-cyan-200">
                      Project: <span className="text-white">{req.project_name}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 pt-1 border-t border-white/10">
                    <button
                      type="button"
                      disabled={busyApprovalId === req.id}
                      onClick={() => handleCooperationApproval(req.id, 'approve_request')}
                      className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition disabled:opacity-50"
                    >
                      Approve &amp; Grant Access
                    </button>
                    <button
                      type="button"
                      disabled={busyApprovalId === req.id}
                      onClick={() => handleCooperationApproval(req.id, 'reject_request')}
                      className="rounded-lg border border-red-400/40 bg-red-950/40 hover:bg-red-900/60 px-3 py-1.5 text-xs font-semibold text-red-300 transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
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

