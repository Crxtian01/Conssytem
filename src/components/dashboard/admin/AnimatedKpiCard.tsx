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

function getTrendAppearance(metric: AdminKpiMetric): {
  arrow: string
  badgeClass: string
  strokeColor: string
  fillId: string
  semanticText: string
} {
  if (metric.direction === 'flat' || metric.changePct === 0) {
    return {
      arrow: '—',
      badgeClass: 'border-slate-200 bg-slate-100 text-slate-700',
      strokeColor: '#64748b',
      fillId: `spark-neutral-${metric.id}`,
      semanticText: 'No change vs prior period',
    }
  }

  const isUp = metric.direction === 'up'
  // Color logic:
  // - For costs / low-stock / pending approvals ('negative_is_good'): UP is bad (red), DOWN is good (green)
  // - For progress / attendance / projects ('positive_is_good'): UP is good (green), DOWN is bad (red)
  const isFavorable =
    metric.polarity === 'negative_is_good' ? !isUp : isUp

  if (isFavorable) {
    return {
      arrow: isUp ? '▲' : '▼',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      strokeColor: '#059669',
      fillId: `spark-good-${metric.id}`,
      semanticText: isUp ? 'Favorable increase' : 'Favorable reduction',
    }
  }

  return {
    arrow: isUp ? '▲' : '▼',
    badgeClass: 'border-red-200 bg-red-50 text-red-700',
    strokeColor: '#dc2626',
    fillId: `spark-alert-${metric.id}`,
    semanticText: isUp ? 'Unfavorable increase' : 'Unfavorable decrease',
  }
}

export function KpiCardSkeleton() {
  return (
    <div
      className="min-h-[164px] rounded-2xl border border-gray-200 bg-white p-4 shadow-xs flex flex-col justify-between animate-pulse"
      aria-busy="true"
      aria-label="Loading KPI metric"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="h-3.5 w-24 rounded bg-gray-200" />
        <div className="h-5 w-14 rounded-full bg-gray-200" />
      </div>
      <div className="my-2 h-8 w-28 rounded bg-gray-200" />
      <div className="flex items-end justify-between gap-2">
        <div className="h-3 w-32 rounded bg-gray-100" />
        <div className="h-9 w-20 rounded bg-gray-100" />
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
      <div className="min-h-[164px] rounded-2xl border border-red-200 bg-red-50/60 p-4 text-xs text-red-700 flex flex-col justify-center">
        <p className="font-bold">{metric.title}</p>
        <p className="mt-1">{errorMessage}</p>
      </div>
    )
  }

  const cardVariants = createKpiCardVariants(timings)
  const trend = getTrendAppearance(metric)

  return (
    <motion.div
      variants={cardVariants}
      className="min-h-[164px] rounded-2xl border border-gray-200/90 bg-white p-4 shadow-xs transition-shadow hover:shadow-md flex flex-col justify-between"
    >
      {/* Top Row: KPI Title + Pop-in Change Indicator */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={metric.href}
          className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-amber-700 transition"
        >
          {metric.title}
        </Link>

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
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums ${trend.badgeClass}`}
        >
          <span aria-hidden="true">{trend.arrow}</span>
          <span>{metric.changePct.toFixed(1)}%</span>
        </motion.span>
      </div>

      {/* Middle Row: Large Count-Up Number */}
      <div className="my-1.5">
        <div className="text-2xl font-extrabold text-gray-900 sm:text-[26px]">
          <AnimatedNumber
            value={metric.value}
            format={metric.format}
            durationSec={timings.numberCountDurationSec}
            animationKey={`${animationKey}-${metric.id}`}
            reducedMotion={reducedMotion}
          />
        </div>
        <p className="mt-0.5 text-[11px] font-medium text-gray-500 truncate">
          {metric.secondaryLabel}
        </p>
      </div>

      {/* Bottom Row: Period Label + Left-to-Right Sparkline */}
      <div className="flex items-end justify-between gap-2 pt-1">
        <span className="text-[10px] font-semibold text-gray-400">
          {metric.comparisonPeriodLabel}
        </span>

        <div className="h-10 w-24 shrink-0" aria-label={`${metric.title} trend sparkline`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              key={`spark-${animationKey}-${metric.id}`}
              data={metric.sparkline}
              margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
            >
              <defs>
                <linearGradient id={trend.fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={trend.strokeColor} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={trend.strokeColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Tooltip
                cursor={false}
                contentStyle={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
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
      </div>
    </motion.div>
  )
}
