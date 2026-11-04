import ModuleLoadingSkeleton from '@/components/layout/ModuleLoadingSkeleton'
import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { readStore } from '@/lib/module-store'
import { ROLES } from '@/lib/roles'
import AppShell from '@/components/layout/AppShell'
import ExpensesClient from '@/components/modules/ExpensesClient'

export default function ExpensesPage() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton title="Loading expenses..." />}>
      <ExpensesContent />
    </Suspense>
  )
}

async function ExpensesContent() {
  const user = await requireAuth()
  const perms = ROLES[user.role].permissions
  const store = readStore()

  if (!perms.viewBudgets) {
    return (
      <AppShell user={user}>
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <strong>Access Restricted (Section 11):</strong> Your current role (
          {ROLES[user.role].label}) does not have permission to view project budgets or expenses.
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses &amp; Budget</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor expenses against project budgets and approve or reject submitted costs.
          </p>
        </div>
        <ExpensesClient
          initialExpenses={store.expenses}
          projects={store.projects}
          role={user.role}
        />
      </div>
    </AppShell>
  )
}


