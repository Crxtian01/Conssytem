'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ExpenseRecord, ProjectRecord } from '@/lib/module-store'
import { ROLES, type UserRole } from '@/lib/roles'

export default function ExpensesClient({
  initialExpenses,
  projects,
  role,
}: {
  initialExpenses: ExpenseRecord[]
  projects: ProjectRecord[]
  role: UserRole
}) {
  const router = useRouter()
  const perms = ROLES[role].permissions
  const [expenses, setExpenses] = useState(initialExpenses)
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [category, setCategory] = useState('Materials')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/modules/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        project_id: projectId,
        category,
        description,
        amount: Number(amount),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setExpenses([data.item, ...expenses])
    setDescription('')
    setAmount('')
    router.refresh()
  }

  async function handleDecision(id: string, action: 'approve' | 'reject') {
    setError(null)
    const res = await fetch('/api/modules/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setExpenses(expenses.map((ex) => (ex.id === id ? data.item : ex)))
    router.refresh()
  }

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]))

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Budget vs Actual Cost Per Project (User Story US-10) */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Budget vs. Actual Cost per Project
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {projects.map((p) => {
            const spent = expenses
              .filter((e) => e.project_id === p.id && e.approval_status === 'approved')
              .reduce((sum, e) => sum + e.amount, 0)
            const pct = p.budget > 0 ? Math.min(100, Math.round((spent / p.budget) * 100)) : 0
            return (
              <div key={p.id} className="rounded-xl border border-gray-200 p-4 space-y-2">
                <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Approved Spent: ₱{spent.toLocaleString()}</span>
                  <span>Budget: ₱{p.budget.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      pct > 90 ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-500">{pct}% of budget utilized</p>
              </div>
            )
          })}
        </div>
      </div>

      {!perms.readOnly && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-gray-900">+ Submit Project Expense</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="Materials">Materials</option>
              <option value="Labor">Labor</option>
              <option value="Equipment">Equipment</option>
              <option value="Permits">Permits</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="number"
              min="1"
              required
              placeholder="Amount (₱)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />

            <input
              type="text"
              required
              placeholder="Description / Invoice #"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Submit Expense for Approval
          </button>
        </form>
      )}

      {/* Expense List & Manager Approvals */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Project Expenses &amp; Manager Approvals
        </h2>
        <div className="mt-4 space-y-3">
          {expenses.map((ex) => (
            <div
              key={ex.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {ex.category}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{ex.description}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {projectMap[ex.project_id]} • {ex.expense_date} • Submitted by{' '}
                  {ex.submitted_by_email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-gray-900">
                  ₱{ex.amount.toLocaleString()}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                    ex.approval_status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : ex.approval_status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {ex.approval_status}
                </span>

                {perms.approveExpenses && ex.approval_status === 'pending' && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDecision(ex.id, 'approve')}
                      className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(ex.id, 'reject')}
                      className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

