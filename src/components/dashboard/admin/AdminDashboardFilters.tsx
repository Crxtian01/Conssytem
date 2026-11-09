'use client'

import { motion } from 'framer-motion'
import {
  createHeaderVariants,
  type DashboardAnimationTimings,
} from '@/lib/admin-dashboard-animation'
import type { DateRangePreset } from '@/types/database.types'

interface AdminDashboardFiltersProps {
  projects: { id: string; name: string; location: string; status: string }[]
  selectedProjectId: string
  selectedDateRange: DateRangePreset
  customStartDate: string
  customEndDate: string
  onProjectChange: (projectId: string) => void
  onDateRangeChange: (range: DateRangePreset) => void
  onCustomDatesChange: (start: string, end: string) => void
  onExportCsv: () => void
  onReplayAnimations: () => void
  isFetchingFilter: boolean
  timings: DashboardAnimationTimings
  reducedMotion: boolean
}

const DATE_PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'this_quarter', label: 'This Quarter' },
  { key: 'custom', label: 'Custom Range' },
]

export default function AdminDashboardFilters({
  projects,
  selectedProjectId,
  selectedDateRange,
  customStartDate,
  customEndDate,
  onProjectChange,
  onDateRangeChange,
  onCustomDatesChange,
  onExportCsv,
  onReplayAnimations,
  isFetchingFilter,
  timings,
  reducedMotion,
}: AdminDashboardFiltersProps) {
  const headerVariants = createHeaderVariants(timings)

  return (
    <motion.header
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className="pointer-events-auto rounded-2xl border border-white/10 bg-[#121624]/85 p-5 shadow-lg backdrop-blur-xl space-y-4 text-white"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
              Admin / Engineer Command Center
            </span>
            {reducedMotion && (
              <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                Reduced Motion Active
              </span>
            )}
            {isFetchingFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-200">
                <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                Updating metrics…
              </span>
            )}
          </div>
          <h2 className="mt-1.5 text-lg font-extrabold tracking-tight text-white sm:text-xl">
            Executive Construction Analytics, S-Curve &amp; Financial Oversight
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Real-time KPIs, Planned vs. Actual S-Curve, Monthly Spend vs. Budget, Material Reorder
            Thresholds, Attendance Trends, and RA 12009 Bidding Pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onReplayAnimations}
            className="rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition"
          >
            ↻ Replay Entrance
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-sm transition"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition"
          >
            Print / PDF
          </button>
        </div>
      </div>

      {/* Filter Bar: Project Selector + Date Range Selector */}
      <div className="flex flex-col gap-3 border-t border-white/10 pt-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {/* Project Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="admin-dashboard-project-filter"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Project Scope:
          </label>
          <select
            id="admin-dashboard-project-filter"
            value={selectedProjectId}
            onChange={(e) => onProjectChange(e.target.value)}
            className="rounded-xl border border-white/20 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="all">All Projects ({projects.length} Active Sites)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.location}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Preset Buttons + Custom Date Pickers */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-400">
            Period:
          </span>
          {DATE_PRESETS.map((preset) => {
            const active = selectedDateRange === preset.key
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onDateRangeChange(preset.key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-cyan-500/25 border border-cyan-400/50 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {selectedDateRange === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs">
          <span className="font-bold text-amber-900">Custom Date Filter:</span>
          <label className="flex items-center gap-1.5 text-gray-700 font-medium">
            <span>From</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => onCustomDatesChange(e.target.value, customEndDate)}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900"
            />
          </label>
          <label className="flex items-center gap-1.5 text-gray-700 font-medium">
            <span>To</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => onCustomDatesChange(customStartDate, e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900"
            />
          </label>
        </div>
      )}
    </motion.header>
  )
}

