'use client'

import { useEffect, useState } from 'react'
import type { KpiFormatType } from '@/types/database.types'

interface AnimatedNumberProps {
  value: number
  format: KpiFormatType
  durationSec: number
  animationKey: string | number
  reducedMotion?: boolean
}

export function formatKpiValue(val: number, format: KpiFormatType): string {
  if (format === 'currency') {
    return `₱${Math.round(val).toLocaleString('en-PH')}`
  }
  if (format === 'percent') {
    const rounded = Math.round(val * 10) / 10
    return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
  }
  return Math.round(val).toLocaleString('en-PH')
}

export default function AnimatedNumber({
  value,
  format,
  durationSec,
  animationKey,
  reducedMotion = false,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(
    reducedMotion || durationSec <= 0 ? value : 0
  )

  useEffect(() => {
    if (reducedMotion || durationSec <= 0) {
      setDisplayValue(value)
      return
    }

    let frameId = 0
    const durationMs = Math.max(120, durationSec * 1000)
    const startTime = performance.now()
    setDisplayValue(0)

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / durationMs)
      // Cubic-out easing: smooth deceleration, no bounce
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = value * eased
      setDisplayValue(current)

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      } else {
        setDisplayValue(value)
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [value, durationSec, animationKey, reducedMotion])

  return (
    <span className="tabular-nums tracking-tight" aria-label={formatKpiValue(value, format)}>
      {formatKpiValue(displayValue, format)}
    </span>
  )
}
