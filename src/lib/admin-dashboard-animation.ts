import type { Variants } from 'framer-motion'

export type AnimationMode = 'initial' | 'filter' | 'reduced'

export interface DashboardAnimationTimings {
  mode: AnimationMode
  headerDurationSec: number
  kpiStaggerSec: number
  kpiCardDurationSec: number
  numberCountDurationSec: number
  badgePopDelaySec: number
  sparklineDurationMs: number
  chartGridDelaySec: number
  chartStaggerSec: number
  chartCardDurationSec: number
  rechartsDurationMs: number
  rechartsEasing: 'ease-out' | 'ease-in-out'
  targetLineRevealDelayMs: number
  lowStockPulseDelaySec: number
}

/**
 * Shared central timing configuration for the Admin/Engineer Dashboard.
 * - 'initial': Full 1.5s–2.0s choreographed sequence on every page open, navigation, or refresh.
 * - 'filter': Snappier ~0.9s replay sequence when project or date range filters change.
 * - 'reduced': Instant final values when prefers-reduced-motion is active.
 */
export function getDashboardAnimationTimings(
  mode: AnimationMode,
  isMobile = false
): DashboardAnimationTimings {
  if (mode === 'reduced') {
    return {
      mode: 'reduced',
      headerDurationSec: 0,
      kpiStaggerSec: 0,
      kpiCardDurationSec: 0,
      numberCountDurationSec: 0,
      badgePopDelaySec: 0,
      sparklineDurationMs: 0,
      chartGridDelaySec: 0,
      chartStaggerSec: 0,
      chartCardDurationSec: 0,
      rechartsDurationMs: 0,
      rechartsEasing: 'ease-out',
      targetLineRevealDelayMs: 0,
      lowStockPulseDelaySec: 0,
    }
  }

  const mobileFactor = isMobile ? 0.72 : 1

  if (mode === 'filter') {
    return {
      mode: 'filter',
      headerDurationSec: 0.2 * mobileFactor,
      kpiStaggerSec: 0.045 * mobileFactor,
      kpiCardDurationSec: 0.26 * mobileFactor,
      numberCountDurationSec: 0.52 * mobileFactor,
      badgePopDelaySec: 0.5 * mobileFactor,
      sparklineDurationMs: Math.round(520 * mobileFactor),
      chartGridDelaySec: 0.15 * mobileFactor,
      chartStaggerSec: 0.05 * mobileFactor,
      chartCardDurationSec: 0.28 * mobileFactor,
      rechartsDurationMs: Math.round(560 * mobileFactor),
      rechartsEasing: 'ease-out',
      targetLineRevealDelayMs: Math.round(580 * mobileFactor),
      lowStockPulseDelaySec: 0.62 * mobileFactor,
    }
  }

  // Default: 'initial' full sequence (~1.6s - 1.9s total)
  return {
    mode: 'initial',
    headerDurationSec: 0.34 * mobileFactor,
    kpiStaggerSec: 0.085 * mobileFactor, // 85ms stagger between KPI cards
    kpiCardDurationSec: 0.38 * mobileFactor,
    numberCountDurationSec: 0.85 * mobileFactor,
    badgePopDelaySec: 0.82 * mobileFactor, // Pops in right after number finishes counting
    sparklineDurationMs: Math.round(850 * mobileFactor),
    chartGridDelaySec: 0.32 * mobileFactor,
    chartStaggerSec: 0.09 * mobileFactor,
    chartCardDurationSec: 0.42 * mobileFactor,
    rechartsDurationMs: Math.round(920 * mobileFactor),
    rechartsEasing: 'ease-out',
    targetLineRevealDelayMs: Math.round(960 * mobileFactor), // Target/budget/reorder lines appear after main series
    lowStockPulseDelaySec: 1.05 * mobileFactor,
  }
}

export const SUBTLE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function createHeaderVariants(timings: DashboardAnimationTimings): Variants {
  if (timings.mode === 'reduced') {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    }
  }
  return {
    hidden: { opacity: 0, y: -12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: timings.headerDurationSec,
        ease: SUBTLE_EASE,
      },
    },
  }
}

export function createKpiGridVariants(timings: DashboardAnimationTimings): Variants {
  if (timings.mode === 'reduced') {
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1 },
    }
  }
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: timings.kpiStaggerSec,
      },
    },
  }
}

export function createKpiCardVariants(timings: DashboardAnimationTimings): Variants {
  if (timings.mode === 'reduced') {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    }
  }
  return {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: timings.kpiCardDurationSec,
        ease: SUBTLE_EASE,
      },
    },
  }
}

export function createChartGridVariants(timings: DashboardAnimationTimings): Variants {
  if (timings.mode === 'reduced') {
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1 },
    }
  }
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: timings.chartGridDelaySec,
        staggerChildren: timings.chartStaggerSec,
      },
    },
  }
}

export function createChartCardVariants(timings: DashboardAnimationTimings): Variants {
  if (timings.mode === 'reduced') {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    }
  }
  return {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: timings.chartCardDurationSec,
        ease: SUBTLE_EASE,
      },
    },
  }
}
