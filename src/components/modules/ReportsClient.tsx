'use client'

import { useState } from 'react'
import type { StoreData } from '@/lib/module-store'

export default function ReportsClient({ store }: { store: StoreData }) {
  const [emailing, setEmailing] = useState(false)
  const [emailStatus, setEmailStatus] = useState<string | null>(null)

  function exportToExcelCsv() {
    const rows: string[][] = [
      ['CONSTRUCTMS — FULL EXECUTIVE REPORT'],
      [],
      ['1. PROJECT PROGRESS & BUDGET VS ACTUAL'],
      ['Project Name', 'Location', 'Status', 'Progress %', 'Budget (PHP)', 'Approved Spent (PHP)', 'Remaining Budget (PHP)'],
      ...store.projects.map((p) => {
        const spent = store.expenses
          .filter((e) => e.project_id === p.id && e.approval_status === 'approved')
          .reduce((s, e) => s + e.amount, 0)
        return [
          p.name,
          p.location,
          p.status,
          `${p.progress}%`,
          `${p.budget}`,
          `${spent}`,
          `${p.budget - spent}`,
        ]
      }),
      [],
      ['2. LOW-STOCK MATERIALS & INVENTORY'],
      ['Material Name', 'Current Stock', 'Reorder Level', 'Unit', 'Unit Cost (PHP)', 'Stock Status'],
      ...store.materials.map((m) => [
        m.name,
        `${m.current_stock}`,
        `${m.reorder_level}`,
        m.unit,
        `${m.unit_cost}`,
        m.current_stock <= m.reorder_level ? 'LOW STOCK ALERT' : 'In Stock',
      ]),
      [],
      ['3. WORKER ATTENDANCE SUMMARY'],
      ['Worker Name', 'Date', 'Hours Worked', 'Status'],
      ...store.attendance.map((a) => [
        a.worker_name,
        a.attendance_date,
        `${a.hours_worked}`,
        a.status,
      ]),
    ]

    const csvContent = rows
      .map((r) => r.map((v) => `"${(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `construction-full-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  async function handleEmailWeeklyReport() {
    setEmailing(true)
    setEmailStatus(null)
    const res = await fetch('/api/email/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'weekly_client_report' }),
    })
    setEmailing(false)
    if (res.ok) {
      setEmailStatus('✉️ Weekly Client Progress Report sent! Check /notifications to preview.')
    }
  }

  const lowStockItems = store.materials.filter((m) => m.current_stock <= m.reorder_level)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={exportToExcelCsv}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          📥 Export Full Report to Excel (CSV)
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
        >
          🖨️ Export / Save as PDF
        </button>
        <button
          type="button"
          disabled={emailing}
          onClick={handleEmailWeeklyReport}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
        >
          {emailing ? 'Sending…' : '✉️ Email Weekly Report to Client'}
        </button>
      </div>

      {emailStatus && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">
          {emailStatus}
        </div>
      )}

      {/* 1. Project Progress & Budget vs Actual */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          1. Project Progress &amp; Budget vs. Actual Summary
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-3 pr-4">Project</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Budget</th>
                <th className="py-3 px-4">Approved Spent</th>
                <th className="py-3 pl-4">Remaining Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {store.projects.map((p) => {
                const spent = store.expenses
                  .filter((e) => e.project_id === p.id && e.approval_status === 'approved')
                  .reduce((s, e) => s + e.amount, 0)
                const remaining = p.budget - spent
                return (
                  <tr key={p.id}>
                    <td className="py-3 pr-4 font-bold text-gray-900">{p.name}</td>
                    <td className="py-3 px-4 font-semibold text-amber-700">{p.progress}%</td>
                    <td className="py-3 px-4">₱{p.budget.toLocaleString()}</td>
                    <td className="py-3 px-4">₱{spent.toLocaleString()}</td>
                    <td className="py-3 pl-4 font-semibold text-emerald-700">
                      ₱{remaining.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Low-Stock Materials Summary */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          2. Low-Stock Materials &amp; Inventory Report ({lowStockItems.length} Alerts)
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-3 pr-4">Material</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Reorder Level</th>
                <th className="py-3 pl-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {store.materials.map((m) => {
                const isLow = m.current_stock <= m.reorder_level
                return (
                  <tr key={m.id}>
                    <td className="py-3 pr-4 font-bold text-gray-900">{m.name}</td>
                    <td className="py-3 px-4">
                      {m.current_stock} {m.unit}
                    </td>
                    <td className="py-3 px-4">
                      {m.reorder_level} {m.unit}
                    </td>
                    <td className="py-3 pl-4">
                      {isLow ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                          LOW STOCK ⚠️
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                          OK ✅
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Attendance Summary */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          3. Worker Attendance &amp; Hours Summary
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-3 pr-4">Worker</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Hours Worked</th>
                <th className="py-3 pl-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {store.attendance.map((a) => (
                <tr key={a.id}>
                  <td className="py-3 pr-4 font-bold text-gray-900">{a.worker_name}</td>
                  <td className="py-3 px-4 text-gray-600">{a.attendance_date}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">{a.hours_worked} hrs</td>
                  <td className="py-3 pl-4">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-emerald-800">
                      {a.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
