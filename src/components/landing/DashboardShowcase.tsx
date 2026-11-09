'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export default function DashboardShowcase() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'sites' | 'bids' | 'approvals'>('all')
  const [hoveredPoint, setHoveredPoint] = useState<{
    month: string
    planned: number
    actual: number
    variance: number
  } | null>(null)

  // Subtle interactive 3D perspective tilt on mouse move
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onPointerMove(e: PointerEvent) {
      const rect = el!.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      el!.style.setProperty('--rx', `${(-y * 5).toFixed(2)}deg`)
      el!.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`)
    }

    function onPointerLeave() {
      el!.style.setProperty('--rx', '0deg')
      el!.style.setProperty('--ry', '0deg')
    }

    el.addEventListener('pointermove', onPointerMove, { passive: true })
    el.addEventListener('pointerleave', onPointerLeave, { passive: true })
    return () => {
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  const PROJECTS = [
    {
      id: '1',
      title: 'Metro Commercial Tower — Phase 1',
      code: 'PRJ-MCT-01',
      loc: 'Bonifacio Global City, Taguig',
      budget: '₱24,500,000',
      progress: '74%',
      variance: '+4.0%',
      status: 'Ahead of Schedule',
      statusType: 'ahead',
      category: 'sites',
      tag: 'Vertical High-Rise',
    },
    {
      id: '2',
      title: 'Riverside Warehouse & Logistics Hub',
      code: 'PRJ-RWL-02',
      loc: 'Navotas Industrial Port Zone',
      budget: '₱14,800,000',
      progress: '62%',
      variance: '+2.1%',
      status: 'On Track',
      statusType: 'ahead',
      category: 'sites',
      tag: 'Steel Frame',
    },
    {
      id: '3',
      title: 'Greenview Residential Townhomes',
      code: 'PRJ-GRT-03',
      loc: 'Barangka Ilaya, Pasig City',
      budget: '₱9,200,000',
      progress: '88%',
      variance: '+1.5%',
      status: 'Finishing Phase',
      statusType: 'ahead',
      category: 'sites',
      tag: 'Residential',
    },
    {
      id: '4',
      title: 'RA 12009 Package: Northern Bypass Viaduct',
      code: 'BID-2026-08',
      loc: 'DPWH Region III Infra Package',
      budget: '₱38,000,000 (ABC)',
      progress: '100% Tech',
      variance: 'NFCC Pass',
      status: 'For Lead Engineer Sign-off',
      statusType: 'bids',
      category: 'bids',
      tag: 'RA 12009 Public Bid',
    },
  ]

  const filteredProjects =
    activeTab === 'all'
      ? PROJECTS
      : activeTab === 'approvals'
        ? PROJECTS.filter((p) => p.category === 'bids')
        : PROJECTS.filter((p) => p.category === activeTab)

  // Real S-Curve data points (Baseline Planned vs Verified Field Actual)
  const SCURVE_DATA = [
    { month: 'Jan', planned: 12, actual: 14, variance: 2.0, cx: 30, cyPlanned: 138, cyActual: 135 },
    { month: 'Feb', planned: 24, actual: 28, variance: 4.0, cx: 80, cyPlanned: 122, cyActual: 116 },
    { month: 'Mar', planned: 38, actual: 43, variance: 5.0, cx: 130, cyPlanned: 102, cyActual: 95 },
    { month: 'Apr', planned: 52, actual: 57, variance: 5.0, cx: 180, cyPlanned: 82, cyActual: 74 },
    { month: 'May', planned: 64, actual: 68, variance: 4.0, cx: 230, cyPlanned: 64, cyActual: 58 },
    { month: 'Jun', planned: 76, actual: 80, variance: 4.0, cx: 280, cyPlanned: 46, cyActual: 40 },
    { month: 'Jul', planned: 88, actual: 92, variance: 4.2, cx: 330, cyPlanned: 28, cyActual: 22 },
  ]

  return (
    <div
      ref={containerRef}
      style={{
        transform: 'perspective(1400px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className="relative mx-auto w-full max-w-[1340px] rounded-2xl sm:rounded-[32px] border border-cyan-500/30 bg-[#090e1c]/95 p-3.5 sm:p-6 md:p-8 shadow-[0_32px_120px_rgba(0,180,216,0.22)] backdrop-blur-3xl text-white selection:bg-cyan-500/30"
    >
      {/* Top Specular Glint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-24 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
      />

      {/* Top Window Bar: Admin / Lead Engineer Executive Cockpit */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          </div>
          <div className="h-4 w-px bg-white/15" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-tight text-white">
              ConstructMS Executive Command Center
            </span>
            <span className="hidden sm:inline text-xs text-slate-500">•</span>
            <span className="hidden sm:inline text-xs font-semibold text-cyan-300">
              Admin / Lead Engineer Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live Field Sync • 3 Active Jobsites
          </span>

          <Link
            href="/admin-dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/20 px-3.5 py-1 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/30 hover:text-white"
          >
            <span>Live Admin Dashboard</span>
            <span className="text-cyan-400">↗</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Key Construction KPIs (Matching Real Admin / Engineer Dashboard) */}
      <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
        {/* Metric 1: Total Contract Value */}
        <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-slate-900/70 p-3 sm:p-4 backdrop-blur-xl transition hover:border-cyan-400/40 hover:bg-slate-900/90 shadow-lg">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-300">
            <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 text-xs">
              ₱
            </span>
            <span className="truncate">Contract Value</span>
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl font-black tracking-tight text-white sm:text-3xl">
            ₱48.5M
          </p>
          <div className="mt-0.5 sm:mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-400">
            <span>+₱12.4M</span>
            <span>↑ 15%</span>
          </div>
        </div>

        {/* Metric 2: S-Curve Overall Completion */}
        <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-slate-900/70 p-3 sm:p-4 backdrop-blur-xl transition hover:border-emerald-400/40 hover:bg-slate-900/90 shadow-lg">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-300">
            <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 text-xs">
              📈
            </span>
            <span className="truncate">S-Curve Progress</span>
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl font-black tracking-tight text-white sm:text-3xl">
            68.4%
          </p>
          <div className="mt-0.5 sm:mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-400">
            <span>Ahead</span>
            <span>+4.2%</span>
          </div>
        </div>

        {/* Metric 3: Disbursed Budget vs Actual */}
        <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-slate-900/70 p-3 sm:p-4 backdrop-blur-xl transition hover:border-amber-400/40 hover:bg-slate-900/90 shadow-lg">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-300">
            <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 text-xs">
              🏗️
            </span>
            <span className="truncate">Disbursed</span>
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl font-black tracking-tight text-white sm:text-3xl">
            ₱32.1M
          </p>
          <div className="mt-0.5 sm:mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-cyan-300">
            <span>66% of Budget</span>
          </div>
        </div>

        {/* Metric 4: RA 12009 Procurement Compliance */}
        <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-slate-900/70 p-3 sm:p-4 backdrop-blur-xl transition hover:border-purple-400/40 hover:bg-slate-900/90 shadow-lg">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-300">
            <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 text-xs">
              ⚖️
            </span>
            <span className="truncate">RA 12009</span>
          </div>
          <p className="mt-1.5 sm:mt-2 text-xl font-black tracking-tight text-white sm:text-3xl">
            100%
          </p>
          <div className="mt-0.5 sm:mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-emerald-400">
            <span>Verified</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Real Project Portfolio (Left) + Real S-Curve & Budget Progress (Right) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left: Active Projects & Procurement Packages */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-extrabold text-white">Project Operations Portfolio</h4>
              <span className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                3 Active Sites • 1 RA 12009 Bid
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] p-1 text-[11px] font-bold">
              {[
                { id: 'all', label: 'All Operations' },
                { id: 'sites', label: 'Sites' },
                { id: 'bids', label: 'RA 12009' },
                { id: 'approvals', label: 'Approvals' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`rounded-lg px-2.5 py-1 transition ${
                    activeTab === tab.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="group relative rounded-2xl border border-white/10 bg-[#0c1220]/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-[#0c1220]/95 hover:shadow-xl hover:shadow-cyan-500/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded-md bg-white/[0.08] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 border border-white/10">
                      {p.tag}
                    </span>
                    <h5 className="mt-2 text-sm font-black text-white group-hover:text-cyan-300 transition">
                      {p.title}
                    </h5>
                    <p className="text-[11px] font-medium text-slate-400">
                      {p.code} • {p.loc}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border ${
                      p.statusType === 'ahead'
                        ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
                        : 'border-cyan-400/40 bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    ● {p.status}
                  </span>
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-slate-400">
                  <span>
                    Contract: <strong className="text-white">{p.budget}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-white">{p.progress}</span>
                    <span className="text-emerald-400 text-[10px]">({p.variance})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Approvals Notice Banner */}
          <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs backdrop-blur-xl">
            <div className="flex items-center gap-2 text-amber-200">
              <span className="text-base">⚠️</span>
              <span><strong>4 Pending Approvals:</strong> 2 Expense Sign-Offs, 1 Material Stock-Out, 1 Contractor Join Request</span>
            </div>
            <Link href="/admin-dashboard" className="font-bold text-amber-300 hover:text-white underline">
              Review Queue →
            </Link>
          </div>
        </div>

        {/* Right: Real S-Curve Progress Chart + Budget Spend Allocation */}
        <div className="space-y-4 lg:col-span-5">
          {/* Chart 1: S-Curve Planned vs Actual Line Chart */}
          <div className="rounded-2xl border border-white/10 bg-[#0c1220]/80 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Planned vs. Actual Progress (S-Curve)
                </h4>
                <p className="text-[10px] text-slate-400">Cumulative baseline schedule vs. verified field completion</p>
              </div>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                ▲ +4.2% Ahead
              </span>
            </div>

            {/* SVG S-Curve Chart */}
            <div className="relative mt-3 h-40 w-full">
              <svg viewBox="0 0 360 160" className="h-full w-full overflow-visible">
                <defs>
                  <linearGradient id="scurveActualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="30" y1="30" x2="340" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="30" y1="75" x2="340" y2="75" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="30" y1="120" x2="340" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                {/* Shaded Area for Actual Completion */}
                <path
                  d="M 30 135 C 80 116, 130 95, 180 74 C 230 58, 280 40, 330 22 L 330 150 L 30 150 Z"
                  fill="url(#scurveActualGrad)"
                />

                {/* Planned Baseline (Dashed Purple-Cyan) */}
                <path
                  d="M 30 138 C 80 122, 130 102, 180 82 C 230 64, 280 46, 330 28"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  className="opacity-80"
                />

                {/* Actual Progress Curve (Electric Cyan Solid Glow) */}
                <path
                  d="M 30 135 C 80 116, 130 95, 180 74 C 230 58, 280 40, 330 22"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3.5"
                  className="drop-shadow-[0_0_10px_#06b6d4]"
                />

                {/* Interactive Points on S-Curve */}
                {SCURVE_DATA.map((pt) => (
                  <g
                    key={pt.month}
                    className="cursor-pointer group"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        month: pt.month,
                        planned: pt.planned,
                        actual: pt.actual,
                        variance: pt.variance,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={pt.cx}
                      cy={pt.cyActual}
                      r="4.5"
                      className="fill-[#0c1220] stroke-cyan-400 stroke-2 transition-transform duration-200 group-hover:scale-150"
                    />
                    <text
                      x={pt.cx}
                      y="160"
                      textAnchor="middle"
                      className="fill-slate-500 text-[10px] font-bold"
                    >
                      {pt.month}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Tooltip on Hover */}
              {hoveredPoint && (
                <div className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 rounded-xl border border-cyan-400/40 bg-[#0c1220]/95 px-3 py-1.5 shadow-2xl backdrop-blur-xl text-center">
                  <p className="text-[10px] font-extrabold uppercase text-cyan-300">
                    {hoveredPoint.month} S-Curve Telemetry
                  </p>
                  <p className="text-xs font-bold text-white">
                    Actual: <span className="text-cyan-300">{hoveredPoint.actual}%</span> • Planned: {hoveredPoint.planned}% (
                    <span className="text-emerald-400">+{hoveredPoint.variance}%</span>)
                  </p>
                </div>
              )}
            </div>

            {/* S-Curve Legend */}
            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <strong>Actual Verified Progress</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-3 border-b-2 border-dashed border-purple-400" />
                <strong>Planned Baseline</strong>
              </span>
            </div>
          </div>

          {/* Chart 2: Budget Utilization by Trade & Physical Completion Ring */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Trade Budget Allocation */}
            <div className="rounded-2xl border border-white/10 bg-[#0c1220]/80 p-3.5 backdrop-blur-xl space-y-2.5">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                Budget Spend by Trade
              </span>
              {[
                { name: 'Structural Works', pct: 78, color: 'bg-cyan-400' },
                { name: 'MEPFS Utilities', pct: 54, color: 'bg-amber-400' },
                { name: 'Architectural Finish', pct: 38, color: 'bg-blue-400' },
                { name: 'Equipment Logistics', pct: 65, color: 'bg-purple-400' },
              ].map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-300">
                    <span>{item.name}</span>
                    <span>{item.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Milestones Ring */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0c1220]/80 p-3.5 text-center backdrop-blur-xl">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                Milestones
              </span>
              <div className="relative my-2 flex h-20 w-20 items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90 transform">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="3.2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3.5"
                    strokeDasharray="68, 100"
                    className="drop-shadow-[0_0_8px_#06b6d4]"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-white">68.4%</span>
                  <span className="text-[9px] font-semibold text-cyan-300">Ahead</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">32 / 48 Milestones Done</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
