'use client'

import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AnimatedChartCard from '@/components/dashboard/admin/AnimatedChartCard'
import {
  createChartGridVariants,
  SUBTLE_EASE,
  type DashboardAnimationTimings,
} from '@/lib/admin-dashboard-animation'
import type { AdminDashboardPayload } from '@/types/database.types'

interface AdminDashboardChartsProps {
  charts: AdminDashboardPayload['charts']
  timings: DashboardAnimationTimings
  animationKey: string | number
  reducedMotion: boolean
  isLoading: boolean
  errorMessage: string | null
  forceEmptyState?: boolean
}

function formatPHPCompact(value: number): string {
  if (value >= 1_000_000) {
    return `₱${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `₱${(value / 1_000).toFixed(0)}K`
  }
  return `₱${value}`
}

export default function AdminDashboardCharts({
  charts,
  timings,
  animationKey,
  reducedMotion,
  isLoading,
  errorMessage,
  forceEmptyState = false,
}: AdminDashboardChartsProps) {
  const gridVariants = createChartGridVariants(timings)
  const animActive = !reducedMotion && timings.rechartsDurationMs > 0

  const latestSCurve =
    charts.plannedVsActual[charts.plannedVsActual.length - 1]
  const isAheadOfSchedule =
    latestSCurve ? latestSCurve.actual >= latestSCurve.planned : true

  const lowStockItemsCount = charts.materialStockLevels.filter(
    (m) => m.isBelowReorder
  ).length

  const avgReorderThreshold =
    charts.materialStockLevels.length > 0
      ? Math.round(
          charts.materialStockLevels.reduce((s, m) => s + m.reorderLevel, 0) /
            charts.materialStockLevels.length
        )
      : 50

  const avgMonthlyTarget =
    charts.monthlyExpensesVsBudget.length > 0
      ? charts.monthlyExpensesVsBudget[0].monthlyTarget
      : 250000

  return (
    <motion.div
      key={`charts-grid-${animationKey}`}
      variants={gridVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-6 lg:grid-cols-2"
    >
      {/* 1. PLANNED VS ACTUAL PROGRESS (S-CURVE LINE CHART) */}
      <AnimatedChartCard
        title="1. Planned vs. Actual Progress (S-Curve)"
        subtitle="Cumulative schedule baseline (%) vs. verified field completion (%)"
        badgeLabel={
          isAheadOfSchedule
            ? `▲ Ahead (+${Math.abs(latestSCurve?.variance ?? 0)}%)`
            : `▼ Behind (${latestSCurve?.variance ?? 0}%)`
        }
        badgeColorClass={
          isAheadOfSchedule
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-red-200 bg-red-50 text-red-700'
        }
        actionHref="/projects"
        actionLabel="Schedule Details"
        timings={timings}
        animationKey={animationKey}
        reducedMotion={reducedMotion}
        isLoading={isLoading}
        errorMessage={errorMessage}
        isEmpty={forceEmptyState || charts.plannedVsActual.length === 0}
      >
        {({ showTargetLines }) => (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                key={`scurve-${animationKey}`}
                data={charts.plannedVsActual}
                margin={{ top: 10, right: 16, left: -10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: '#0d121f',
                    color: '#ffffff',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                  }}
                  itemStyle={{ color: '#22d3ee' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  formatter={(val, name) => [`${val}%`, String(name)]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px', color: '#cbd5e1' }} />

                {showTargetLines && (
                  <ReferenceLine
                    y={60}
                    stroke="#0f172a"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Q4 Target Milestone (60%)',
                      position: 'insideTopLeft',
                      fontSize: 10,
                      fill: '#334155',
                    }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="planned"
                  name="Planned Progress (%)"
                  stroke="#64748b"
                  strokeWidth={2.2}
                  strokeDasharray="5 5"
                  dot={{ r: 3.5, fill: '#64748b' }}
                  isAnimationActive={animActive}
                  animationDuration={timings.rechartsDurationMs}
                  animationEasing={timings.rechartsEasing}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Progress (%)"
                  stroke={isAheadOfSchedule ? '#059669' : '#d97706'}
                  strokeWidth={3}
                  dot={{ r: 4, fill: isAheadOfSchedule ? '#059669' : '#d97706' }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={animActive}
                  animationDuration={timings.rechartsDurationMs}
                  animationEasing={timings.rechartsEasing}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </AnimatedChartCard>

      {/* 2. MONTHLY EXPENSES VS BUDGET (COMBO CHART: BARS + CUMULATIVE BUDGET LINE) */}
      <AnimatedChartCard
        title="2. Monthly Expenses vs. Cumulative Budget"
        subtitle="Bars show monthly approved disbursements; line tracks cumulative budget ceiling"
        badgeLabel="Combo Chart"
        badgeColorClass="border-blue-200 bg-blue-50 text-blue-800"
        actionHref="/budgets"
        actionLabel="Budgets & Cost"
        timings={timings}
        animationKey={animationKey}
        reducedMotion={reducedMotion}
        isLoading={isLoading}
        errorMessage={errorMessage}
        isEmpty={forceEmptyState || charts.monthlyExpensesVsBudget.length === 0}
      >
        {({ showTargetLines }) => (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                key={`combo-exp-${animationKey}`}
                data={charts.monthlyExpensesVsBudget}
                margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  tickFormatter={(v) => formatPHPCompact(Number(v))}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: '#0d121f',
                    color: '#ffffff',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                  }}
                  itemStyle={{ color: '#f59e0b' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  formatter={(val, name) => [
                    `₱${Number(val).toLocaleString('en-PH')}`,
                    String(name),
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px', color: '#cbd5e1' }} />

                <Bar
                  dataKey="monthlySpent"
                  name="Monthly Spending (₱)"
                  fill="#d97706"
                  radius={[6, 6, 0, 0]}
                  barSize={26}
                  isAnimationActive={animActive}
                  animationDuration={timings.rechartsDurationMs}
                  animationEasing={timings.rechartsEasing}
                />

                {showTargetLines && (
                  <ReferenceLine
                    y={avgMonthlyTarget}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    label={{
                      value: `Monthly Spend Cap (${formatPHPCompact(avgMonthlyTarget)})`,
                      position: 'insideTopRight',
                      fontSize: 10,
                      fill: '#dc2626',
                    }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="cumulativeBudget"
                  name="Cumulative Budget Line (₱)"
                  stroke="#1d4ed8"
                  strokeWidth={2.6}
                  dot={{ r: 3.5, fill: '#1d4ed8' }}
                  isAnimationActive={animActive}
                  animationDuration={timings.rechartsDurationMs}
                  animationEasing={timings.rechartsEasing}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </AnimatedChartCard>

      {/* 3. EXPENSES BY CATEGORY (HORIZONTAL BAR CHART, SORTED HIGHEST TO LOWEST) */}
      <AnimatedChartCard
        title="3. Expenses by Category (Sorted Highest → Lowest)"
        subtitle="Distribution of approved construction disbursements across cost centers"
        badgeLabel="Horizontal Ranking"
        badgeColorClass="border-amber-200 bg-amber-50 text-amber-900"
        actionHref="/expenses"
        actionLabel="All Expenses"
        timings={timings}
        animationKey={animationKey}
        reducedMotion={reducedMotion}
        isLoading={isLoading}
        errorMessage={errorMessage}
        isEmpty={forceEmptyState || charts.expensesByCategory.length === 0}
      >
        {() => (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                key={`cat-exp-${animationKey}`}
                layout="vertical"
                data={charts.expensesByCategory}
                margin={{ top: 6, right: 24, left: 24, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatPHPCompact(Number(v))}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={115}
                  tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                  }}
                  formatter={(val, _name, item) => {
                    const pct = (item?.payload as { percentage?: number })?.percentage ?? 0
                    return [`₱${Number(val).toLocaleString('en-PH')} (${pct}%)`, 'Category Spend']
                  }}
                />
                <Bar
                  dataKey="amount"
                  name="Total Spend (₱)"
                  radius={[0, 6, 6, 0]}
                  barSize={22}
                  isAnimationActive={animActive}
                  animationDuration={timings.rechartsDurationMs}
                  animationEasing={timings.rechartsEasing}
                >
                  {charts.expensesByCategory.map((entry, idx) => (
                    <Cell
                      key={entry.category}
                      fill={idx === 0 ? '#b45309' : idx === 1 ? '#d97706' : '#f59e0b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </AnimatedChartCard>

      {/* 4. MATERIAL STOCK LEVELS (BAR CHART WITH REORDER LINE + SUBTLE SINGLE PULSE ON LOW STOCK) */}
      <AnimatedChartCard
        title="4. Material Stock Levels vs. Reorder Line"
        subtitle="Items at or below reorder threshold are highlighted in red and pulse once after load"
        badgeLabel={
          lowStockItemsCount > 0
            ? `⚠️ ${lowStockItemsCount} Below Reorder`
            : '✅ All Stock Healthy'
        }
        badgeColorClass={
          lowStockItemsCount > 0
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }
        actionHref="/materials"
        actionLabel="Restock Inventory"
        timings={timings}
        animationKey={animationKey}
        reducedMotion={reducedMotion}
        isLoading={isLoading}
        errorMessage={errorMessage}
        isEmpty={forceEmptyState || charts.materialStockLevels.length === 0}
      >
        {({ showTargetLines }) => (
          <div className="space-y-2.5">
            <div className="h-[215px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  key={`mat-stock-${animationKey}`}
                  data={charts.materialStockLevels}
                  margin={{ top: 10, right: 16, left: -8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#334155' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#475569' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                    }}
                    formatter={(val, name, item) => {
                      const unit = (item?.payload as { unit?: string })?.unit ?? 'units'
                      return [`${val} ${unit}`, String(name)]
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />

                  {showTargetLines && (
                    <ReferenceLine
                      y={avgReorderThreshold}
                      stroke="#dc2626"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      label={{
                        value: `Reorder Safety Line (${avgReorderThreshold})`,
                        position: 'insideTopRight',
                        fontSize: 10,
                        fill: '#dc2626',
                      }}
                    />
                  )}

                  <Bar
                    dataKey="currentStock"
                    name="Current Stock"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                    isAnimationActive={animActive}
                    animationDuration={timings.rechartsDurationMs}
                    animationEasing={timings.rechartsEasing}
                  >
                    {charts.materialStockLevels.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={entry.isBelowReorder ? '#dc2626' : '#059669'}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="reorderLevel"
                    name="Reorder Threshold"
                    fill="#94a3b8"
                    radius={[6, 6, 0, 0]}
                    barSize={16}
                    isAnimationActive={animActive}
                    animationDuration={timings.rechartsDurationMs}
                    animationEasing={timings.rechartsEasing}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Subtle single-pulse callout chips for low-stock items (pulses once after bars finish, then stays still) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {charts.materialStockLevels
                .filter((m) => m.isBelowReorder)
                .map((m) => (
                  <motion.span
                    key={`low-pulse-${animationKey}-${m.id}`}
                    initial={{ scale: 1 }}
                    animate={
                      reducedMotion
                        ? { scale: 1 }
                        : {
                            scale: [1, 1.045, 1],
                            backgroundColor: ['#fef2f2', '#fee2e2', '#fef2f2'],
                          }
                    }
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : {
                            delay: timings.lowStockPulseDelaySec,
                            duration: 0.55,
                            ease: SUBTLE_EASE,
                          }
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700"
                  >
                    <span aria-hidden="true">▼</span>
                    <span>
                      {m.name}: {m.currentStock} {m.unit} (Reorder ≤ {m.reorderLevel})
                    </span>
                  </motion.span>
                ))}
            </div>
          </div>
        )}
      </AnimatedChartCard>

      {/* 5. ATTENDANCE TREND (STACKED BARS: PRESENT, LATE, ABSENT + RATE LINE) */}
      <AnimatedChartCard
        title="5. Worker Attendance Trend (Present, Late, Absent)"
        subtitle="Stacked workforce headcount with target attendance rate line"
        badgeLabel="▲ Workforce Active"
        badgeColorClass="border-emerald-200 bg-emerald-50 text-emerald-800"
        actionHref="/attendance"
        actionLabel="Attendance Log"
        timings={timings}
        animationKey={animationKey}
        reducedMotion={reducedMotion}
        isLoading={isLoading}
        errorMessage={errorMessage}
        isEmpty={forceEmptyState || charts.attendanceTrend.length === 0}
      >
        {({ showTargetLines }) => (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                key={`att-trend-${animationKey}`}
                data={charts.attendanceTrend}
                margin={{ top: 10, right: 16, left: -10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />

                <Bar
                  dataKey="present"
                  name="Present (Full Day)"
                  stackId="a"
                  fill="#059669"
                  barSize={26}
                  isAnimationActive={animActive}
                  animationDuration={timings.rechartsDurationMs}
                  animationEasing={timings.rechartsEasing}
                />
                <Bar
                  dataKey="late"
                  name="Late / Half-Day"
                  stackId="a"
                  fill="#f59e0b"
                  barSize={26}
                  isAnimationActive={animActive}
                  animationDuration={timings.rechartsDurationMs}
                  animationEasing={timings.rechartsEasing}
                />
                <Bar
                  dataKey="absent"
                  name="Absent"
                  stackId="a"
                  fill="#ef4444"
                  radius={[5, 5, 0, 0]}
                  barSize={26}
                  isAnimationActive={animActive}
                  animationDuration={timings.rechartsDurationMs}
                  animationEasing={timings.rechartsEasing}
                />

                {showTargetLines && (
                  <ReferenceLine
                    y={10}
                    stroke="#047857"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Target Daily Crew (10+)',
                      position: 'insideTopRight',
                      fontSize: 10,
                      fill: '#047857',
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </AnimatedChartCard>

      {/* 6. TASKS BY STATUS (3-SLICE DONUT + PROPORTIONAL BARS: DONE, ONGOING, DELAYED) */}
      <AnimatedChartCard
        title="6. Tasks by Status (Done, Ongoing, Delayed)"
        subtitle="Work package completion health across scheduled site activities"
        badgeLabel="3-Status Breakdown"
        badgeColorClass="border-amber-200 bg-amber-50 text-amber-900"
        actionHref="/tasks"
        actionLabel="Manage Tasks"
        timings={timings}
        animationKey={animationKey}
        reducedMotion={reducedMotion}
        isLoading={isLoading}
        errorMessage={errorMessage}
        isEmpty={forceEmptyState || charts.tasksByStatus.length === 0}
      >
        {() => (
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
            <div className="h-[220px] sm:col-span-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart key={`tasks-donut-${animationKey}`}>
                  <Tooltip
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                    }}
                    formatter={(val, name) => [`${val} task(s)`, String(name)]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Pie
                    data={charts.tasksByStatus}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={4}
                    isAnimationActive={animActive}
                    animationDuration={timings.rechartsDurationMs}
                    animationEasing={timings.rechartsEasing}
                  >
                    {charts.tasksByStatus.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 sm:col-span-6">
              {charts.tasksByStatus.map((t) => (
                <div
                  key={t.status}
                  className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-bold text-gray-900">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: t.fill }}
                      />
                      <span>{t.status}</span>
                    </span>
                    <span className="tabular-nums">
                      {t.count} ({t.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <motion.div
                      key={`task-bar-${animationKey}-${t.status}`}
                      initial={{ scaleX: reducedMotion ? 1 : 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: reducedMotion ? 0 : timings.rechartsDurationMs / 1000,
                        ease: SUBTLE_EASE,
                      }}
                      style={{
                        width: `${t.percentage}%`,
                        backgroundColor: t.fill,
                        transformOrigin: 'left',
                      }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </AnimatedChartCard>

      {/* 7. BIDS BY STAGE (RA 12009 PIPELINE FUNNEL / BAR CHART) */}
      <AnimatedChartCard
        title="7. RA 12009 Bids by Stage (Draft, Open, Evaluation, Awarded)"
        subtitle="Government & private procurement funnel with Approved Budget (ABC) volume"
        badgeLabel="RA 12009 Pipeline"
        badgeColorClass="border-purple-200 bg-purple-50 text-purple-900"
        actionHref="/bidding"
        actionLabel="Open Bidding"
        timings={timings}
        animationKey={animationKey}
        reducedMotion={reducedMotion}
        isLoading={isLoading}
        errorMessage={errorMessage}
        isEmpty={forceEmptyState || charts.bidsByStage.length === 0}
      >
        {() => (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                key={`bids-stage-${animationKey}`}
                data={charts.bidsByStage}
                margin={{ top: 10, right: 16, left: -10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                  }}
                  formatter={(val, _name, item) => {
                    const abc = (item?.payload as { totalAbc?: number })?.totalAbc ?? 0
                    return [
                      `${val} bid(s) — ABC ₱${abc.toLocaleString('en-PH')}`,
                      'Stage Volume',
                    ]
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Bids in Stage"
                  radius={[8, 8, 0, 0]}
                  barSize={42}
                  isAnimationActive={animActive}
                  animationDuration={timings.rechartsDurationMs}
                  animationEasing={timings.rechartsEasing}
                >
                  {charts.bidsByStage.map((entry) => (
                    <Cell key={entry.stage} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </AnimatedChartCard>

      {/* 8. PROGRESS PER PROJECT (ANIMATED PROGRESS BARS LIST WITH PLANNED MARKER) */}
      <AnimatedChartCard
        title="8. Progress per Project & Budget Utilization"
        subtitle="Actual completion bar vs. delayed planned target marker and approved spend ratio"
        badgeLabel={`${charts.progressPerProject.length} Project(s)`}
        badgeColorClass="border-emerald-200 bg-emerald-50 text-emerald-800"
        actionHref="/projects"
        actionLabel="All Projects"
        timings={timings}
        animationKey={animationKey}
        reducedMotion={reducedMotion}
        isLoading={isLoading}
        errorMessage={errorMessage}
        isEmpty={forceEmptyState || charts.progressPerProject.length === 0}
      >
        {({ showTargetLines }) => (
          <div className="space-y-3.5 pr-1">
            {charts.progressPerProject.map((proj) => (
              <div
                key={proj.id}
                className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-3.5 space-y-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">{proj.name}</p>
                    <p className="text-[11px] text-gray-500">{proj.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        proj.isAheadOrOnTrack
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-amber-200 bg-amber-50 text-amber-800'
                      }`}
                    >
                      {proj.isAheadOrOnTrack
                        ? `▲ Actual ${proj.actualProgress}% (Target ${proj.plannedProgress}%)`
                        : `▼ Actual ${proj.actualProgress}% (Target ${proj.plannedProgress}%)`}
                    </span>
                  </div>
                </div>

                {/* Progress Bar with Planned Target Marker Line */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-gray-700">
                    <span>Physical Completion</span>
                    <span className="tabular-nums">{proj.actualProgress}%</span>
                  </div>
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <motion.div
                      key={`proj-prog-${animationKey}-${proj.id}`}
                      initial={{ scaleX: reducedMotion ? 1 : 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: reducedMotion ? 0 : timings.rechartsDurationMs / 1000,
                        ease: SUBTLE_EASE,
                      }}
                      style={{
                        width: `${proj.actualProgress}%`,
                        transformOrigin: 'left',
                      }}
                      className={`h-full rounded-full ${
                        proj.isAheadOrOnTrack ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                    />
                    {showTargetLines && (
                      <div
                        title={`Planned Progress Target: ${proj.plannedProgress}%`}
                        style={{ left: `${Math.min(98, proj.plannedProgress)}%` }}
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-900"
                      />
                    )}
                  </div>
                </div>

                {/* Budget vs Spent Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>
                      Approved Spend: <strong className="text-gray-800">₱{proj.spent.toLocaleString('en-PH')}</strong>
                    </span>
                    <span>
                      Budget: <strong className="text-gray-800">₱{proj.budget.toLocaleString('en-PH')}</strong> ({proj.budgetUtilizationPct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <motion.div
                      key={`proj-bud-${animationKey}-${proj.id}`}
                      initial={{ scaleX: reducedMotion ? 1 : 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: reducedMotion ? 0 : timings.rechartsDurationMs / 1000,
                        ease: SUBTLE_EASE,
                      }}
                      style={{
                        width: `${Math.min(100, proj.budgetUtilizationPct)}%`,
                        transformOrigin: 'left',
                      }}
                      className={`h-full rounded-full ${
                        proj.budgetUtilizationPct > 90 ? 'bg-red-600' : 'bg-blue-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatedChartCard>
    </motion.div>
  )
}

