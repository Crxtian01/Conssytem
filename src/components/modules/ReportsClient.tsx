'use client'

import type { StoreData } from '@/lib/module-store'

export default function ReportsClient({ store }: { store: StoreData }) {
  function exportToExcelCsv() {
    const rows = [
      ['Project Name', 'Location', 'Status', 'Progress %', 'Budget', 'Approved Expenses'],
      ...store.projects.map((p) => {
        const spent = store.expenses
          .filter((e) => e.project_id === p.id && e.approval_status === 'approved')
          .reduce((s, e) => s + e.amount, 0)
        return [p.name, p.location, p.status, `${p.progress}%`, `${p.budget}`, `${spent}`]
      }),
    ]
    const csvContent = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'construction-system-report.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={exportToExcelCsv}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          📥 Export Summary to Excel (CSV)
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Project Progress &amp; Budget vs. Actual Summary
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
    </div>
  )
}

