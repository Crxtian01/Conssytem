'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { StoreData } from '@/lib/module-store'
import type { BiddingStoreData } from '@/lib/bidding-store'
import type { UserRole } from '@/lib/roles'

interface AssetManagementDashboardProps {
  store?: StoreData
  biddingStore?: BiddingStoreData
  role?: UserRole
  userEmail?: string
}

interface MonthlyData {
  month: string
  year: string
  active: number
  activePct: string
  maintenance: number
  maintPct: string
  retired: number
  total: number
  x: number // SVG X coordinate
  yActive: number // SVG Y coordinate
  yMaint: number
  yRetired: number
}

export default function AssetManagementDashboard({
  role = 'admin_engineer',
}: AssetManagementDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'Active' | 'Maintenance'>('all')

  // Mount animation trigger — runs every time the dashboard opens or remounts
  const [animReady, setAnimReady] = useState(false)
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    setAnimReady(false)
    setAnimKey((k) => k + 1)
    const t = setTimeout(() => setAnimReady(true), 40)
    return () => clearTimeout(t)
  }, [])

  // Line Chart Interactive Hover State
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null)
  const [chartCursorX, setChartCursorX] = useState<number | null>(null)
  const chartSvgRef = useRef<SVGSVGElement | null>(null)

  // Category Bar Hover State
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  // Donut Chart Hover State
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<'Active' | 'Maintenance' | 'Retired' | null>(null)

  // 7 Months Data matching the graph in the picture (Jan to Jul)
  const chartData: MonthlyData[] = [
    { month: 'Jan', year: '2026', active: 310, activePct: '+2.1%', maintenance: 45, maintPct: '3.6%', retired: 18, total: 373, x: 40, yActive: 122, yMaint: 130, yRetired: 138 },
    { month: 'Feb', year: '2026', active: 520, activePct: '+4.5%', maintenance: 60, maintPct: '4.8%', retired: 22, total: 602, x: 95, yActive: 98, yMaint: 118, yRetired: 130 },
    { month: 'Mar', year: '2026', active: 780, activePct: '+6.2%', maintenance: 88, maintPct: '7.1%', retired: 32, total: 900, x: 155, yActive: 74, yMaint: 104, yRetired: 120 },
    { month: 'Apr', year: '2026', active: 890, activePct: '+3.4%', maintenance: 92, maintPct: '7.4%', retired: 48, total: 1030, x: 215, yActive: 62, yMaint: 98, yRetired: 110 },
    { month: 'May', year: '2026', active: 940, activePct: '+2.8%', maintenance: 95, maintPct: '7.6%', retired: 62, total: 1097, x: 275, yActive: 54, yMaint: 94, yRetired: 98 },
    { month: 'Jun', year: '2026', active: 1010, activePct: '+3.9%', maintenance: 96, maintPct: '7.7%', retired: 75, total: 1181, x: 330, yActive: 44, yMaint: 88, yRetired: 86 },
    { month: 'Jul', year: '2026', active: 1062, activePct: '+1.3%', maintenance: 97, maintPct: '7.8%', retired: 89, total: 1248, x: 385, yActive: 34, yMaint: 82, yRetired: 76 },
  ]

  const activeHoveredData = hoveredMonthIndex !== null ? chartData[hoveredMonthIndex] : null

  function handleChartMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!chartSvgRef.current) return
    const rect = chartSvgRef.current.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * 400
    setChartCursorX(svgX)

    // Find closest month along X coordinate
    let closestIdx = 0
    let minDiff = Infinity
    chartData.forEach((d, i) => {
      const diff = Math.abs(d.x - svgX)
      if (diff < minDiff) {
        minDiff = diff
        closestIdx = i
      }
    })
    setHoveredMonthIndex(closestIdx)
  }

  function handleChartMouseLeave() {
    setHoveredMonthIndex(null)
    setChartCursorX(null)
  }

  const assets = [
    {
      id: 'ast-1',
      name: 'Laptop Pro 16',
      tag: 'IT EQUIPMENT',
      tagColor: 'cyan',
      serial: 'SN: LT-90428 · HQ · Floor 3',
      status: 'Active',
      purchased: 'Mar 12, 2024',
      value: '$2,100',
      condition: 'Condition: Good',
      icon: (
        <svg className="h-4 w-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
      ),
    },
    {
      id: 'ast-2',
      name: 'Machinery CX-22',
      tag: 'EQUIPMENT',
      tagColor: 'amber',
      serial: 'SN: MC-77812 · Warehouse B',
      status: 'Maintenance',
      purchased: 'Jan 08, 2023',
      value: '$14,500',
      condition: 'Condition: Service due',
      icon: (
        <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      id: 'ast-3',
      name: 'Vehicle FL-204',
      tag: 'VEHICLE',
      tagColor: 'blue',
      serial: 'SN: VH-33109 · Site North',
      status: 'Active',
      purchased: 'Jul 24, 2023',
      value: '$28,900',
      condition: 'Mileage: 12,430 mi',
      icon: (
        <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    {
      id: 'ast-4',
      name: 'Monitor 4K Display',
      tag: 'IT EQUIPMENT',
      tagColor: 'cyan',
      serial: 'SN: MN-55011 · HQ · Floor 2',
      status: 'Active',
      purchased: 'May 05, 2024',
      value: '$650',
      condition: 'Condition: Good',
      icon: (
        <svg className="h-4 w-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
  ]

  const filteredAssets = assets.filter((a) => {
    if (filter !== 'all' && a.status !== filter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        a.name.toLowerCase().includes(q) ||
        a.serial.toLowerCase().includes(q) ||
        a.tag.toLowerCase().includes(q)
      )
    }
    return true
  })

  function handleExportReport() {
    const csvContent = [
      'Asset Name,Tag,Serial Number,Status,Purchased Date,Value,Condition',
      ...assets.map(
        (a) =>
          `"${a.name}","${a.tag}","${a.serial}","${a.status}","${a.purchased}","${a.value}","${a.condition}"`
      ),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Asset_Management_Report_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 text-white">
      {/* 1. TOP TITLE BAR (Exact match to reference photo) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Asset Management Dashboard
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-400">
            Monitor and manage your assets · Last updated today at 09:42 AM · All locations
          </p>
        </div>

        {/* Right Tools: Search, Notification Bell, Export Report */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg
              className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="h-10 w-44 rounded-xl border border-white/10 bg-[#121623]/80 pl-9 pr-3 text-xs text-white placeholder-slate-400 backdrop-blur-xl transition-all focus:w-56 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <button
            type="button"
            title="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#121623]/80 text-slate-300 hover:border-white/20 hover:text-white transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0c0e16]" />
          </button>

          <button
            type="button"
            onClick={handleExportReport}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 text-xs font-bold text-white shadow-sm hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-200 transition"
          >
            <svg className="h-4 w-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. TOP ROW: 4 METRIC KPI CARDS */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Total Assets (Cyan / Teal) */}
        <div className="group relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/40 via-[#101726]/85 to-[#0e1422]/90 p-4 shadow-lg backdrop-blur-xl transition hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-300 tracking-wide">Total Assets</span>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-white">1,248</span>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-cyan-300/90">
            +32 this month · <span className="text-cyan-400">↑ 2.6%</span>
          </p>
        </div>

        {/* KPI 2: Active Assets (Green / Emerald) */}
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 via-[#101726]/85 to-[#0e1422]/90 p-4 shadow-lg backdrop-blur-xl transition hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-300 tracking-wide">Active Assets</span>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-white">1,062</span>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-emerald-300/90">
            85.1% operational · <span className="text-emerald-400">↑ 1.3%</span>
          </p>
        </div>

        {/* KPI 3: In Maintenance (Orange / Amber) */}
        <div className="group relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/40 via-[#101726]/85 to-[#0e1422]/90 p-4 shadow-lg backdrop-blur-xl transition hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-300 tracking-wide">In Maintenance</span>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-white">97</span>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-amber-300/90">
            7.8% of total · <span className="text-amber-400">↓ 1.2%</span>
          </p>
        </div>

        {/* KPI 4: Depreciation YTD (Purple / Violet) */}
        <div className="group relative overflow-hidden rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-950/40 via-[#101726]/85 to-[#0e1422]/90 p-4 shadow-lg backdrop-blur-xl transition hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-300 tracking-wide">Depreciation (YTD)</span>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-white">$184.3k</span>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-purple-300/90">
            -$12.4k vs last quarter · <span className="text-emerald-400">↓ 6.3%</span>
          </p>
        </div>
      </div>

      {/* 3. MAIN SECTION: Asset Grid (Left) & High-Tech Visualizations (Right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* ==============================================================
            LEFT COLUMN: Asset Grid (7 cols on lg, matching 2x2 cards)
           ============================================================== */}
        <div className="space-y-3 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white tracking-tight sm:text-lg">
              Asset Grid
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{filteredAssets.length} assets</span>
              <span>·</span>
              <button
                type="button"
                onClick={() => setFilter(filter === 'all' ? 'Active' : filter === 'Active' ? 'Maintenance' : 'all')}
                className="hover:text-cyan-300 transition"
              >
                Filters: <span className="font-semibold text-cyan-400 capitalize">{filter}</span>
              </button>
              <span>·</span>
              <span className="hover:text-white cursor-pointer">Sort</span>
              <span>·</span>
              <Link href="/equipment" className="font-semibold text-cyan-400 hover:text-cyan-300">
                View all →
              </Link>
            </div>
          </div>

          {/* 2x2 Grid of dark frosted cards */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#121624]/85 p-4 shadow-md backdrop-blur-xl transition hover:border-cyan-400/40 hover:bg-[#151a2b]/95"
              >
                <div className="space-y-2.5">
                  {/* Top Row: Icon + Category Badge */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10">
                      {asset.icon}
                    </div>

                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                        asset.tagColor === 'cyan'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                          : asset.tagColor === 'amber'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                      }`}
                    >
                      {asset.tag}
                    </span>
                  </div>

                  {/* Name & Serial / Location */}
                  <div>
                    <h3 className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition">
                      {asset.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                      {asset.serial}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        asset.status === 'Active'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          asset.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                      <span>{asset.status} •</span>
                    </span>
                  </div>
                </div>

                {/* Details row at bottom */}
                <div className="mt-3 pt-2.5 border-t border-white/[0.06] text-[10px] text-slate-400">
                  <p className="truncate">
                    Purchased: {asset.purchased} · Value: <strong className="text-slate-200">{asset.value}</strong> · {asset.condition}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ==============================================================
            RIGHT COLUMN: High-Tech Visualizations with Animation & Hover Details
           ============================================================== */}
        <div className="space-y-3.5 lg:col-span-5">
          {/* 1. Asset Lifecycle Overview (Animated Line Chart + Interactive Tooltip) */}
          <div className="relative rounded-2xl border border-white/[0.08] bg-[#121624]/85 p-4 shadow-md backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white tracking-wide">
                Asset Lifecycle Overview
              </h3>
              <span className="text-[10px] font-medium text-cyan-400/80">
                Hover graph for details
              </span>
            </div>

            {/* Chart SVG Canvas with Keyed Mount Animation & Mouse Interaction */}
            <div className="relative mt-2 h-44 w-full select-none cursor-crosshair">
              <svg
                key={`line-chart-${animKey}`}
                ref={chartSvgRef}
                onMouseMove={handleChartMouseMove}
                onMouseLeave={handleChartMouseLeave}
                className="h-full w-full overflow-visible"
                viewBox="0 0 400 160"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Subtle Gradient Fill underneath cyan line */}
                  <linearGradient id="cyanLineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Draw Animation for graph lines on mount */}
                  <style>
                    {`
                      @keyframes drawSvgPath {
                        from { stroke-dashoffset: 700; }
                        to { stroke-dashoffset: 0; }
                      }
                      .anim-path-active {
                        stroke-dasharray: 700;
                        stroke-dashoffset: 0;
                        animation: drawSvgPath 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                      }
                      .anim-path-maint {
                        stroke-dasharray: 700;
                        stroke-dashoffset: 0;
                        animation: drawSvgPath 1.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
                      }
                      .anim-path-retired {
                        stroke-dasharray: 700;
                        stroke-dashoffset: 0;
                        animation: drawSvgPath 2.0s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
                      }
                    `}
                  </style>
                </defs>

                {/* Horizontal Grid Lines */}
                <line x1="30" y1="20" x2="390" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="30" y1="50" x2="390" y2="50" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="30" y1="80" x2="390" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="30" y1="110" x2="390" y2="110" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="30" y1="140" x2="390" y2="140" stroke="rgba(255,255,255,0.12)" />

                {/* Y Axis Labels */}
                <text x="5" y="24" fill="#64748b" fontSize="8" fontFamily="sans-serif">1200</text>
                <text x="5" y="54" fill="#64748b" fontSize="8" fontFamily="sans-serif">1000</text>
                <text x="12" y="84" fill="#64748b" fontSize="8" fontFamily="sans-serif">80</text>
                <text x="12" y="114" fill="#64748b" fontSize="8" fontFamily="sans-serif">40</text>
                <text x="16" y="142" fill="#64748b" fontSize="8" fontFamily="sans-serif">0</text>

                {/* Translucent Area Under Active Cyan Line */}
                <path
                  d="M 40 122 Q 95 98, 155 74 T 275 54 T 385 34 L 385 140 L 40 140 Z"
                  fill="url(#cyanLineGradient)"
                  className="transition-opacity duration-1000"
                  style={{ opacity: animReady ? 1 : 0 }}
                />

                {/* 1. Cyan Line: Active Assets (Animated Draw-in) */}
                <path
                  className="anim-path-active"
                  d="M 40 122 Q 95 98, 155 74 T 275 54 T 385 34"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* 2. Orange Line: Maintenance Assets (Dashed + Animated) */}
                <path
                  className="anim-path-maint"
                  d="M 40 130 Q 95 118, 155 104 T 275 94 T 385 82"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />

                {/* 3. Purple Line: Retired Assets (Dotted + Animated) */}
                <path
                  className="anim-path-retired"
                  d="M 40 138 Q 95 130, 155 120 T 275 98 T 385 76"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="1.8"
                  strokeDasharray="2 3"
                  strokeLinecap="round"
                />

                {/* Interactive Crosshair & Highlight Points when Hovering Mouse */}
                {activeHoveredData && (
                  <g className="transition-all duration-150">
                    {/* Vertical Cyan Guide Line */}
                    <line
                      x1={activeHoveredData.x}
                      y1="16"
                      x2={activeHoveredData.x}
                      y2="140"
                      stroke="rgba(34,211,238,0.75)"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />

                    {/* Cyan Point Dot (Active) */}
                    <circle cx={activeHoveredData.x} cy={activeHoveredData.yActive} r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx={activeHoveredData.x} cy={activeHoveredData.yActive} r="8" fill="#06b6d4" opacity="0.35" />

                    {/* Amber Point Dot (Maintenance) */}
                    <circle cx={activeHoveredData.x} cy={activeHoveredData.yMaint} r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />

                    {/* Purple Point Dot (Retired) */}
                    <circle cx={activeHoveredData.x} cy={activeHoveredData.yRetired} r="4" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
                  </g>
                )}
              </svg>

              {/* Floating Dark Glass Tooltip with Full Detail */}
              {activeHoveredData && (
                <div
                  className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full rounded-xl border border-cyan-400/50 bg-[#0d121f]/95 p-2.5 shadow-2xl backdrop-blur-xl transition-transform"
                  style={{
                    left: `${Math.max(16, Math.min(84, (activeHoveredData.x / 400) * 100))}%`,
                    top: `${Math.max(45, activeHoveredData.yActive - 12)}px`,
                  }}
                >
                  <p className="text-[11px] font-extrabold text-white border-b border-white/10 pb-1 mb-1.5 flex items-center justify-between gap-4">
                    <span>{activeHoveredData.month} {activeHoveredData.year} Snapshot</span>
                    <span className="text-[9px] font-bold text-slate-400">{activeHoveredData.total} Total</span>
                  </p>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex items-center justify-between gap-3 text-cyan-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
                        Active:
                      </span>
                      <span>{activeHoveredData.active} assets ({activeHoveredData.activePct})</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-amber-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                        Maintenance:
                      </span>
                      <span>{activeHoveredData.maintenance} assets ({activeHoveredData.maintPct})</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-purple-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_6px_#a855f7]" />
                        Retired:
                      </span>
                      <span>{activeHoveredData.retired} scrap</span>
                    </div>
                  </div>
                </div>
              )}

              {/* X Axis Months */}
              <div className="mt-1 flex justify-between pl-7 pr-3 text-[9px] text-slate-400 font-semibold">
                {chartData.map((d, i) => (
                  <span
                    key={d.month}
                    className={`cursor-pointer transition ${
                      hoveredMonthIndex === i ? 'text-cyan-300 font-extrabold scale-110 drop-shadow-[0_0_8px_#06b6d4]' : ''
                    }`}
                  >
                    {d.month}
                  </span>
                ))}
              </div>
            </div>

            {/* Chart Legend */}
            <div className="mt-3 flex items-center justify-center gap-4 border-t border-white/[0.06] pt-2 text-[10px] text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#06b6d4] shadow-[0_0_8px_#06b6d4]" />
                <span>Active</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]" />
                <span>Maintenance</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#a855f7] shadow-[0_0_8px_#a855f7]" />
                <span>Retired</span>
              </span>
            </div>
          </div>

          {/* Bottom Row of 2 Widgets (Depreciation by Category & Lifecycle Status) */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {/* Widget 2: Depreciation by Category (Animated Progress Bars with Hover Detail) */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#121624]/85 p-3.5 shadow-md backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white tracking-wide">
                  Depreciation by Category
                </h3>
                <span className="text-[9px] text-slate-400">YTD</span>
              </div>

              <div className="mt-3 space-y-2.5">
                {/* IT Equipment (Cyan) */}
                <div
                  className="group cursor-pointer"
                  onMouseEnter={() => setHoveredCategory('IT Equipment')}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className="flex justify-between text-[10px] font-medium text-slate-300 group-hover:text-cyan-300 transition">
                    <span className="font-semibold">IT Equipment</span>
                    <span className="font-bold text-cyan-300">$77.4k · 42%</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-all duration-1000 ease-out group-hover:shadow-[0_0_10px_#06b6d4]"
                      style={{ width: animReady ? '42%' : '0%' }}
                    />
                  </div>
                  {hoveredCategory === 'IT Equipment' && (
                    <p className="mt-1 text-[9px] text-cyan-300 font-medium">
                      524 active items · 4-yr average lifespan · Replacement budget: $90k
                    </p>
                  )}
                </div>

                {/* Machinery (Orange) */}
                <div
                  className="group cursor-pointer"
                  onMouseEnter={() => setHoveredCategory('Machinery')}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className="flex justify-between text-[10px] font-medium text-slate-300 group-hover:text-amber-300 transition">
                    <span className="font-semibold">Machinery</span>
                    <span className="font-bold text-amber-300">$51.6k · 28%</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-1000 ease-out group-hover:shadow-[0_0_10px_#f59e0b]"
                      style={{ width: animReady ? '28%' : '0%' }}
                    />
                  </div>
                  {hoveredCategory === 'Machinery' && (
                    <p className="mt-1 text-[9px] text-amber-300 font-medium">
                      98 heavy units · Inspection due Q3 · Maintenance reserve: $35k
                    </p>
                  )}
                </div>

                {/* Vehicles (Blue) */}
                <div
                  className="group cursor-pointer"
                  onMouseEnter={() => setHoveredCategory('Vehicles')}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className="flex justify-between text-[10px] font-medium text-slate-300 group-hover:text-blue-300 transition">
                    <span className="font-semibold">Vehicles</span>
                    <span className="font-bold text-blue-300">$36.8k · 20%</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-blue-400 transition-all duration-1000 ease-out group-hover:shadow-[0_0_10px_#3b82f6]"
                      style={{ width: animReady ? '20%' : '0%' }}
                    />
                  </div>
                  {hoveredCategory === 'Vehicles' && (
                    <p className="mt-1 text-[9px] text-blue-300 font-medium">
                      42 site fleet vehicles · 94% road compliance · Mileage: 12.4k avg
                    </p>
                  )}
                </div>

                {/* Furniture (Purple) */}
                <div
                  className="group cursor-pointer"
                  onMouseEnter={() => setHoveredCategory('Furniture')}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className="flex justify-between text-[10px] font-medium text-slate-300 group-hover:text-purple-300 transition">
                    <span className="font-semibold">Furniture</span>
                    <span className="font-bold text-purple-300">$18.4k · 10%</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-purple-400 transition-all duration-1000 ease-out group-hover:shadow-[0_0_10px_#a855f7]"
                      style={{ width: animReady ? '10%' : '0%' }}
                    />
                  </div>
                  {hoveredCategory === 'Furniture' && (
                    <p className="mt-1 text-[9px] text-purple-300 font-medium">
                      310 site office units · 10%/yr straight-line depreciation
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Widget 3: Lifecycle Status (Animated Donut Chart with Interactive Segments) */}
            <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#121624]/85 p-3.5 shadow-md backdrop-blur-xl">
              <h3 className="text-xs font-bold text-white tracking-wide">
                Lifecycle Status
              </h3>

              {/* Donut Chart with interactive hover segments & animated dashoffset */}
              <div className="relative my-1 flex items-center justify-center">
                <svg
                  key={`donut-${animKey}`}
                  className="h-28 w-28 -rotate-90 transform overflow-visible"
                  viewBox="0 0 100 100"
                >
                  {/* Background Track */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />

                  {/* Active: 85% (Cyan Segment) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#06b6d4"
                    strokeWidth={hoveredDonutSegment === 'Active' ? '15' : '12'}
                    strokeDasharray="238.7"
                    strokeDashoffset={animReady ? '35.8' : '238.7'}
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-1000 ease-out"
                    onMouseEnter={() => setHoveredDonutSegment('Active')}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  />

                  {/* Maintenance: 8% (Amber Segment) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth={hoveredDonutSegment === 'Maintenance' ? '15' : '12'}
                    strokeDasharray="238.7"
                    strokeDashoffset={animReady ? '219.6' : '238.7'}
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-1000 ease-out"
                    onMouseEnter={() => setHoveredDonutSegment('Maintenance')}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  />

                  {/* Retired: 7% (Purple Segment) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#a855f7"
                    strokeWidth={hoveredDonutSegment === 'Retired' ? '15' : '12'}
                    strokeDasharray="238.7"
                    strokeDashoffset={animReady ? '223.5' : '238.7'}
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-1000 ease-out"
                    onMouseEnter={() => setHoveredDonutSegment('Retired')}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  />
                </svg>

                {/* Center Value (Shows hovered detail or total count) */}
                <div className="absolute text-center select-none pointer-events-none">
                  {hoveredDonutSegment === 'Active' ? (
                    <>
                      <span className="block text-sm font-extrabold text-cyan-300">1,062</span>
                      <span className="block text-[8px] font-bold text-cyan-400 uppercase">85% Active</span>
                    </>
                  ) : hoveredDonutSegment === 'Maintenance' ? (
                    <>
                      <span className="block text-sm font-extrabold text-amber-300">97</span>
                      <span className="block text-[8px] font-bold text-amber-400 uppercase">8% Maint.</span>
                    </>
                  ) : hoveredDonutSegment === 'Retired' ? (
                    <>
                      <span className="block text-sm font-extrabold text-purple-300">89</span>
                      <span className="block text-[8px] font-bold text-purple-400 uppercase">7% Retired</span>
                    </>
                  ) : (
                    <>
                      <span className="block text-sm font-extrabold text-white">1,248</span>
                      <span className="block text-[8px] font-semibold uppercase tracking-wider text-slate-400">
                        Total Assets
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Legend with Hover Triggers */}
              <div className="border-t border-white/[0.06] pt-1.5 flex items-center justify-center gap-2 text-[9px] text-slate-400">
                <span
                  onMouseEnter={() => setHoveredDonutSegment('Active')}
                  onMouseLeave={() => setHoveredDonutSegment(null)}
                  className={`cursor-pointer hover:text-cyan-300 transition ${hoveredDonutSegment === 'Active' ? 'text-cyan-300 font-bold' : ''}`}
                >
                  ● Active 85%
                </span>
                <span
                  onMouseEnter={() => setHoveredDonutSegment('Maintenance')}
                  onMouseLeave={() => setHoveredDonutSegment(null)}
                  className={`cursor-pointer hover:text-amber-300 transition ${hoveredDonutSegment === 'Maintenance' ? 'text-amber-300 font-bold' : ''}`}
                >
                  ● Maint 8%
                </span>
                <span
                  onMouseEnter={() => setHoveredDonutSegment('Retired')}
                  onMouseLeave={() => setHoveredDonutSegment(null)}
                  className={`cursor-pointer hover:text-purple-300 transition ${hoveredDonutSegment === 'Retired' ? 'text-purple-300 font-bold' : ''}`}
                >
                  ● Ret 7%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM FOOTER BAR (Matches reference photo: "Data synced · Updated 2 minutes ago · Auto-refresh enabled") */}
      <div className="flex items-center justify-end gap-2 pt-2 text-[10px] text-slate-400">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
        <span>Data synced · Updated 2 minutes ago · Auto-refresh enabled</span>
      </div>
    </div>
  )
}
