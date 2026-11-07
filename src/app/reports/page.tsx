import ModuleLoadingSkeleton from '@/components/layout/ModuleLoadingSkeleton'
import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { readStore } from '@/lib/module-store'
import AppShell from '@/components/layout/AppShell'
import ReportsClient from '@/components/modules/ReportsClient'

export default function ReportsPage() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton title="Loading reports..." />}>
      <ReportsContent />
    </Suspense>
  )
}

async function ReportsContent() {
  const user = await requireAuth()
  const store = readStore()

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.role === 'admin_engineer'
              ? 'Full Executive & Financial Reports (PDF / Excel)'
              : user.role === 'assistant'
                ? 'Operational Progress Reports (No Financial Summaries)'
                : 'Client Project Progress Reports (Read-Only)'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {user.role === 'admin_engineer'
              ? 'Export project progress, budget vs. actual costs, and inventory summaries.'
              : user.role === 'assistant'
                ? 'Export site progress, inventory alerts, and attendance summaries (financial summaries restricted to Admin/Engineer).'
                : 'Read-only project completion milestones and progress summary.'}
          </p>
        </div>
        <ReportsClient store={store} role={user.role} />
      </div>
    </AppShell>
  )
}
