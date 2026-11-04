import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { readStore } from '@/lib/module-store'
import AppShell from '@/components/layout/AppShell'
import DailyLogsClient from '@/components/modules/DailyLogsClient'

export default function DailyLogsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading daily logs…</div>}>
      <DailyLogsContent />
    </Suspense>
  )
}

async function DailyLogsContent() {
  const user = await requireAuth()
  const store = readStore()

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Site Logs (with Photos)</h1>
          <p className="mt-1 text-sm text-gray-500">
            Record daily weather, site progress notes, and upload construction progress photos.
          </p>
        </div>
        <DailyLogsClient
          initialLogs={store.daily_logs}
          projects={store.projects}
          role={user.role}
        />
      </div>
    </AppShell>
  )
}
