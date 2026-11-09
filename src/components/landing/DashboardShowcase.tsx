'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export default function DashboardShowcase() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'machinery' | 'it' | 'vehicles'>('all')
  const [hoveredPoint, setHoveredPoint] = useState<{ month: string; active: number; maint: number } | null>(null)

  // Subtle interactive 3D perspective tilt on mouse move
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onPointerMove(e: PointerEvent) {
      const rect = el!.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      el!.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`)
      el!.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`)
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

  const ASSETS = [
    {
      id: '1',
      title: 'Laptop Pro 16',
      sn: 'SN: LT-90428',
      loc: 'HQ • Floor 3',
      val: '$2,100',
      status: 'Active',
      type: 'IT Equipment',
      category: 'it',
      color: 'cyan',
    },
    {
      id: '2',
      title: 'Machinery CX-22',
      sn: 'SN: MC-77812',
      loc: 'Warehouse B',
      val: '$14,500',
      status: 'Maintenance',
      type: 'Equipment',
      category: 'machinery',
      color: 'amber',
    },
    {
      id: '3',
      title: 'Vehicle FL-204',
      sn: 'SN: VH-33109',
      loc: 'Site North',
      val: '$28,900',
      status: 'Active',
      type: 'Vehicle',
      category: 'vehicles',
      color: 'blue',
    },
    {
      id: '4',
      title: 'Monitor 4K Display',
      sn: 'SN: MN-55011',
      loc: 'HQ • Floor 2',
      val: '$650',
      status: 'Active',
      type: 'IT Equipment',
      category: 'it',
      color: 'cyan',
    },
  ]

  const filteredAssets = activeTab === 'all' ? ASSETS : ASSETS.filter((a) => a.category === activeTab)

  const MONTHS_DATA = [
    { month: 'Jan', active: 620, maint: 40, cx: 30, cyActive: 130, cyMaint: 145 },
    { month: 'Feb', active: 750, maint: 58, cx: 80, cyActive: 105, cyMaint: 135 },
    { month: 'Mar', active: 790, maint: 52, cx: 130, cyActive: 100, cyMaint: 138 },
    { month: 'Apr', active: 870, maint: 65, cx: 180, cyActive: 80, cyMaint: 130 },
    { month: 'May', active: 940, maint: 72, cx: 230, cyActive: 60, cyMaint: 125 },
    { month: 'Jun', active: 1010, maint: 85, cx: 280, cyActive: 45, cyMaint: 115 },
    { month: 'Jul', active: 1062, maint: 97, cx: 330, cyActive: 32, cyMaint: 105 },
  ]

  return (
    <div
      ref={containerRef}
      style={{
        transform: 'perspective(1400px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className="relative mx-auto w-full max-w-[1320px] rounded-[32px] border border-cyan-500/30 bg-[#090e1c]/95 p-5 shadow-[0_32px_120px_rgba(0,180,216,0.22)] backdrop-blur-3xl sm:p-7 md:p-9 text-white selection:bg-cyan-500/30"
    >
      {/* Specular Glint Top Border */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-24 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
      />

      {/* Top Window Bar */}
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
              ConstructMS Operations
            </span>
            <span className="hidden sm:inline text-xs text-slate-500">•</span>
            <span className="hidden sm:inline text-xs font-semibold text-slate-400">
              Metro Commercial Tower Phase 1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live Sync • All Locations
          </span>

          <Link
            href="/register"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/20 px-3.5 py-1 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/30 hover:text-white"
          >
            <span>Live Interactive Preview</span>
            <span className="text-cyan-400">↗</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Key Metrics Bar (Matches User Dashboard Design) */}
      <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-4">
        {/* Metric 1: Total Assets */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 backdrop-blur-xl transition hover:border-cyan-400/40 hover:bg-slate-900/90 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 text-xs">
              📊
            </span>
            <span>Total Assets</span>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            1,248
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <span>+32 this month</span>
            <span>↑ 2.6%</span>
          </div>
        </div>

        {/* Metric 2: Active Assets */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 backdrop-blur-xl transition hover:border-emerald-400/40 hover:bg-slate-900/90 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 text-xs">
              ✓
            </span>
            <span>Active Assets</span>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            1,062
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <span>85.1% operational</span>
            <span>↑ 1.3%</span>
          </div>
        </div>

        {/* Metric 3: In Maintenance */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 backdrop-blur-xl transition hover:border-amber-400/40 hover:bg-slate-900/90 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 text-xs">
              🔧
            </span>
            <span>In Maintenance</span>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            97
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-400">
            <span>7.8% of total</span>
            <span>↓ 1.2%</span>
          </div>
        </div>

        {/* Metric 4: RA 12009 Compliance / Depreciation */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 backdrop-blur-xl transition hover:border-purple-400/40 hover:bg-slate-900/90 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 text-xs">
              ⚖️
            </span>
            <span>RA 12009 Bidding</span>
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            100%
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-cyan-400">
            <span>All 15 Modules Passed</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Asset Grid (Left) + High-Tech Charts (Right) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left: Asset Grid */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-extrabold text-white">Asset Grid</h4>
              <span className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                42 Assets Filtered
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] p-1 text-[11px] font-bold">
              {[
                { id: 'all', label: 'All' },
                { id: 'machinery', label: 'Equipment' },
                { id: 'it', label: 'IT' },
                { id: 'vehicles', label: 'Vehicles' },
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
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="group relative rounded-2xl border border-white/10 bg-[#0c1220]/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-[#0c1220]/95 hover:shadow-xl hover:shadow-cyan-500/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded-md bg-white/[0.08] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 border border-white/10">
                      {asset.type}
                    </span>
                    <h5 className="mt-2 text-sm font-black text-white group-hover:text-cyan-300 transition">
                      {asset.title}
                    </h5>
                    <p className="text-[11px] font-medium text-slate-400">
                      {asset.sn} • {asset.loc}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border ${
                      asset.status === 'Active'
                        ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
                        : 'border-amber-400/40 bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    ● {asset.status}
                  </span>
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-slate-400">
                  <span>Val: <strong className="text-white">{asset.val}</strong></span>
                  <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                    Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Real-time Charts & Lifecycle Status Ring */}
        <div className="space-y-4 lg:col-span-5">
          {/* Chart 1: Asset Lifecycle Overview Area Chart */}
          <div className="rounded-2xl border border-white/10 bg-[#0c1220]/80 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Asset Lifecycle Overview
              </h4>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-cyan-300">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" /> Active
                </span>
                <span className="flex items-center gap-1 text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> Maint
                </span>
              </div>
            </div>

            {/* SVG Interactive Multi-Line Curve */}
            <div className="relative mt-3 h-36 w-full">
              <svg viewBox="0 0 360 160" className="h-full w-full overflow-visible">
                <defs>
                  <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="30" y1="30" x2="340" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="30" y1="75" x2="340" y2="75" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="30" y1="120" x2="340" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                {/* Shaded Area for Active Assets */}
                <path
                  d="M 30 130 C 80 105, 130 100, 180 80 C 230 60, 280 45, 330 32 L 330 150 L 30 150 Z"
                  fill="url(#cyanGradient)"
                />

                {/* Active Line (Cyan) */}
                <path
                  d="M 30 130 C 80 105, 130 100, 180 80 C 230 60, 280 45, 330 32"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  className="drop-shadow-[0_0_8px_#06b6d4]"
                />

                {/* Maintenance Line (Amber) */}
                <path
                  d="M 30 145 C 80 135, 130 138, 180 130 C 230 125, 280 115, 330 105"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  className="drop-shadow-[0_0_6px_#f59e0b]"
                />

                {/* Interactive Points */}
                {MONTHS_DATA.map((pt) => (
                  <g
                    key={pt.month}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredPoint({ month: pt.month, active: pt.active, maint: pt.maint })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={pt.cx}
                      cy={pt.cyActive}
                      r="4"
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

              {/* Hover Tooltip Popover */}
              {hoveredPoint && (
                <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-xl border border-cyan-400/40 bg-[#0c1220]/95 px-3 py-1.5 shadow-xl backdrop-blur-xl text-center">
                  <p className="text-[10px] font-extrabold uppercase text-cyan-300">{hoveredPoint.month} Summary</p>
                  <p className="text-xs font-bold text-white">Active: {hoveredPoint.active} • Maint: {hoveredPoint.maint}</p>
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Category Breakdown & Status Ring */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Progress Bars */}
            <div className="rounded-2xl border border-white/10 bg-[#0c1220]/80 p-3.5 backdrop-blur-xl space-y-2.5">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                By Category
              </span>
              {[
                { name: 'Machinery', pct: 42, color: 'bg-cyan-400' },
                { name: 'Equipment', pct: 28, color: 'bg-amber-400' },
                { name: 'Vehicles', pct: 20, color: 'bg-blue-400' },
                { name: 'Tools', pct: 10, color: 'bg-purple-400' },
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

            {/* Lifecycle Status Ring */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0c1220]/80 p-3.5 text-center backdrop-blur-xl">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                Operational
              </span>
              <div className="relative my-2 flex h-20 w-20 items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90 transform">
                  {/* Background ring */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="3.2"
                  />
                  {/* Cyan arc: 85% */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3.5"
                    strokeDasharray="85, 100"
                    className="drop-shadow-[0_0_6px_#06b6d4]"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-white">85.1%</span>
                  <span className="text-[9px] font-semibold text-cyan-300">Active</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">1,062 / 1,248 Units</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
