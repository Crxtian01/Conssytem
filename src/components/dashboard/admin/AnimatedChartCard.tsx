'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  createChartCardVariants,
  type DashboardAnimationTimings,
} from '@/lib/admin-dashboard-animation'

interface AnimatedChartCardProps {
  title: string
  subtitle: string
  badgeLabel?: string
  badgeColorClass?: string
  actionHref?: string
  actionLabel?: string
  timings: DashboardAnimationTimings
  animationKey: string | number
  reducedMotion: boolean
  isLoading?: boolean
  errorMessage?: string | null
  isEmpty?: boolean
  emptyMessage?: string
  children: (props: { showTargetLines: boolean }) => React.ReactNode
}

export function ChartCardSkeleton({ title }: { title?: string }) {
  return (
    <div
      className="min-h-[350px] rounded-2xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between animate-pulse"
      aria-busy="true"
      aria-label={title ? `Loading ${title}` : 'Loading chart'}
    >
      <div className="space-y-2">
        <div className="h-4 w-48 rounded bg-gray-200" />
        <div className="h-3 w-64 rounded bg-gray-100" />
      </div>
      <div className="my-4 flex-1 rounded-xl bg-gray-100/80 min-h-[230px]" />
      <div className="flex justify-between">
        <div className="h-3 w-24 rounded bg-gray-100" />
        <div className="h-3 w-20 rounded bg-gray-100" />
      </div>
    </div>
  )
}

export default function AnimatedChartCard({
  title,
  subtitle,
  badgeLabel,
  badgeColorClass = 'border-amber-200 bg-amber-50 text-amber-900',
  actionHref,
  actionLabel,
  timings,
  animationKey,
  reducedMotion,
  isLoading = false,
  errorMessage = null,
  isEmpty = false,
  emptyMessage = 'No records match the selected project and date filter.',
  children,
}: AnimatedChartCardProps) {
  const [showTargetLines, setShowTargetLines] = useState<boolean>(
    reducedMotion || timings.targetLineRevealDelayMs <= 0
  )

  useEffect(() => {
    if (reducedMotion || timings.targetLineRevealDelayMs <= 0) {
      setShowTargetLines(true)
      return
    }
    setShowTargetLines(false)
    const timer = setTimeout(() => {
      setShowTargetLines(true)
    }, timings.targetLineRevealDelayMs)
    return () => clearTimeout(timer)
  }, [animationKey, reducedMotion, timings.targetLineRevealDelayMs])

  if (isLoading) {
    return <ChartCardSkeleton title={title} />
  }

  const cardVariants = createChartCardVariants(timings)

  return (
    <motion.section
      variants={cardVariants}
      className="min-h-[350px] rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 sm:text-base">{title}</h3>
            {badgeLabel && (
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeColorClass}`}
              >
                {badgeLabel}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </div>

        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 hover:underline shrink-0"
          >
            {actionLabel} →
          </Link>
        )}
      </div>

      {/* Body */}
      <div className="pt-4 flex-1 flex flex-col justify-center min-h-[250px]">
        {errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 text-center text-xs text-red-700">
            <p className="font-bold">Unable to load chart data</p>
            <p className="mt-1">{errorMessage}</p>
          </div>
        ) : isEmpty ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center text-xs text-gray-500">
            <p className="font-semibold text-gray-700">Friendly Empty State</p>
            <p className="mt-1">{emptyMessage}</p>
          </div>
        ) : (
          children({ showTargetLines })
        )}
      </div>
    </motion.section>
  )
}
