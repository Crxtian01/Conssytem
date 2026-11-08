'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import AnimatedNumber from '@/components/dashboard/admin/AnimatedNumber'
import {
  createKpiCardVariants,
  SUBTLE_EASE,
  type DashboardAnimationTimings,
} from '@/lib/admin-dashboard-animation'
import type { AdminKpiMetric } from '@/types/database.types'

interface AnimatedKpiCardProps {
  metric: AdminKpiMetric
  timings: DashboardAnimationTimings
  animationKey: string | number
  reducedMotion: boolean
  isLoading?: boolean
  errorMessage?: string | null
}

function getKpiIcon(id: AdminKpiMetric['id'], isTerracotta: boolean) {
  const colorClass = isTerracotta ? 'text-white' : 'text-[#5c4942]'
  switch (id) {
    case 'active_projects':
      return (
        <svg className={`h-4 w-4 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'overall_progress':
      return (
        <svg className={`h-4 w-4 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      )
    case 'spent_vs_budget':
      return (
        <svg className={`h-4 w-4 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    case 'low_stock_materials':
      return (
        <svg className={`h-4 w-4 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      )
    case 'pending_approvals':
      return (
        <svg className={`h-4 w-4 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      )
    default:
      return (
        <svg className={`h-4 w-4 ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
  }
}

function getTrendAppearance(
  metric: AdminKpiMetric,
  isTerracotta: boolean
): {
  arrow: string
  badgeClass: string
  strokeColor: string
  fillId: string
  semanticText: string
} {
  if (metric.direction === 'flat' || metric.changePct === 0) {
    return {
      arrow: '—',
      badgeClass: isTerracotta
        ? 'border-white/30 bg-white/20 text-white'
        : 'border-black/10 bg-black/5 text-[#5c4942]',
      strokeColor: isTerracotta ? '#ffffff' : '#8c7369',
      fillId: `spark-neutral-${metric.id}`,
      semanticText: 'No change vs prior period',
    }
  }

  const isUp = metric.direction === 'up'
  const isFavorable =
    metric.polarity === 'negative_is_good' ? !isUp : isUp

  if (isTerracotta) {
    return {
      arrow: isUp ? '▲' : '▼',
      badgeClass: 'border-white/35 bg-white/22 text-white',
      strokeColor: '#fffaf6',
      fillId: `spark-terracotta-${metric.id}`,
      semanticText: isFavorable
        ? 'Favorable change vs prior period'
        : 'Requires attention vs prior period',
    }
  }

  if (isFavorable) {
    return {
      arrow: isUp ? '▲' : '▼',
      badgeClass: 'border-emerald-200/80 bg-emerald-100/85 text-emerald-800',
      strokeColor: '#10b981',
      fillId: `spark-good-${metric.id}`,
      semanticText: isUp ? 'Favorable increase' : 'Favorable reduction',
    }
  }

  return {
    arrow: isUp ? '▲' : '▼',
    badgeClass: 'border-rose-200/80 bg-rose-100/85 text-rose-800',
    strokeColor: '#e11d48',
    fillId: `spark-alert-${metric.id}`,
    semanticText: isUp ? 'Unfavorable increase' : 'Unfavorable decrease',
  }
}

export function KpiCardSkeleton() {
  return (
    <div
      className="min-h-[186px] rounded-[26px] border border-white/70 bg-white/75 p-5 shadow-xs flex flex-col justify-between animate-pulse"
      aria-busy="true"
      aria-label="Loading KPI metric"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="h-9 w-9 rounded-2xl bg-black/10" />
        <div className="h-6 w-14 rounded-full bg-black/10" />
      </div>
      <div className="my-2 h-9 w-28 rounded-lg bg-black/10" />
      <div className="space-y-1.5">
        <div className="h-3.5 w-24 rounded bg-black/10" />
        <div className="h-8 w-full rounded bg-black/5" />
      </div>
    </div>
  )
}

export default function AnimatedKpiCard({
  metric,
  timings,
  animationKey,
  reducedMotion,
  isLoading = false,
  errorMessage = null,
}: AnimatedKpiCardProps) {
  if (isLoading) {
    return <KpiCardSkeleton />
  }

  if (errorMessage) {
    return (
      <div className="min-h-[186px] rounded-[26px] border border-red-200 bg-red-50/70 p-5 text-xs text-red-700 flex flex-col justify-center">
        <p className="font-bold">{metric.title}</p>
        <p className="mt-1">{errorMessage}</p>
      </div>
    )
  }

  // Highlight the Spent vs Budget card with the signature Code XR Terracotta Accent surface
  const isTerracotta = metric.id === 'spent_vs_budget'
  const cardVariants = createKpiCardVariants(timings)
  const trend = getTrendAppearance(metric, isTerracotta)

  return (
    <motion.div
      variants={cardVariants}
      className={`min-h-[186px] rounded-[26px] p-4.5 transition-all flex flex-col justify-between ${
        isTerracotta
          ? 'codexr-terracotta-card'
          : 'bg-white rounded-2xl'
      }`}
    >
      {/* Top Row: Rounded Icon Box + Pop-in Change Pill (Exact Code XR Card Header) */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
            isTerracotta
              ? 'bg-white/20 ring-1 ring-white/30'
              : 'bg-[#ede3da] ring-1 ring-white/80'
          }`}
        >
          {getKpiIcon(metric.id, isTerracotta)}
        </span>

        <motion.span
          key={`badge-${animationKey}-${metric.id}`}
          initial={
            reducedMotion
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.84 }
          }
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : {
                  delay: timings.badgePopDelaySec,
                  duration: 0.24,
                  ease: SUBTLE_EASE,
                }
          }
          title={`${trend.semanticText} (${metric.comparisonPeriodLabel})`}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${trend.badgeClass}`}
        >
          <span aria-hidden="true">{trend.arrow}</span>
          <span>{metric.changePct.toFixed(1)}%</span>
        </motion.span>
      </div>

      {/* Middle Row: Large Count-Up Number + Title + Subtitle */}
      <div className="mt-3">
        <div
          className={`text-2xl font-extrabold tracking-tight sm:text-[26px] ${
            isTerracotta ? 'text-white' : 'text-[#1e1512]'
          }`}
        >
          <AnimatedNumber
            value={metric.value}
            format={metric.format}
            durationSec={timings.numberCountDurationSec}
            animationKey={`${animationKey}-${metric.id}`}
            reducedMotion={reducedMotion}
          />
        </div>
        <Link
          href={metric.href}
          className={`mt-1 block truncate text-xs font-bold transition ${
            isTerracotta
              ? 'text-white hover:underline'
              : 'text-[#1e1512] hover:text-[#c85a38]'
          }`}
        >
          {metric.title}
        </Link>
        <p
          className={`truncate text-[11px] font-medium ${
            isTerracotta ? 'text-amber-50/85' : 'text-[#6e5a52]'
          }`}
        >
          {metric.secondaryLabel}
        </p>
      </div>

      {/* Bottom Row: Full-Width Smooth Wave Sparkline (Code XR Style) */}
      <div className="mt-2 h-9 w-full" aria-label={`${metric.title} trend sparkline`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            key={`spark-${animationKey}-${metric.id}`}
            data={metric.sparkline}
            margin={{ top: 2, right: 2, bottom: 0, left: 2 }}
          >
            <defs>
              <linearGradient id={trend.fillId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={trend.strokeColor}
                  stopOpacity={isTerracotta ? 0.38 : 0.25}
                />
                <stop
                  offset="95%"
                  stopColor={trend.strokeColor}
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>
            <Tooltip
              cursor={false}
              contentStyle={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.8)',
                background: 'rgba(255,250,246,0.95)',
                color: '#1e1512',
              }}
              formatter={(val) => [String(val), metric.title]}
              labelFormatter={() => ''}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={trend.strokeColor}
              strokeWidth={2}
              fill={`url(#${trend.fillId})`}
              isAnimationActive={!reducedMotion && timings.sparklineDurationMs > 0}
              animationDuration={timings.sparklineDurationMs}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
