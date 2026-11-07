import ModuleLoadingSkeleton from '@/components/layout/ModuleLoadingSkeleton'
import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { readStore } from '@/lib/module-store'
import AppShell from '@/components/layout/AppShell'
import DailyLogsClient from '@/components/modules/DailyLogsClient'

export default function DailyLogsPage() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton title="Loading daily-logs..." />}>
      <DailyLogsContent />
    </Suspense>
  )
}

async function DailyLogsContent() {
  const user = await requireAuth()
  const store = readStore()

  // Client sees only approved logs; Contractor sees own logs (or all site logs created by them)
  const filteredLogs = store.daily_logs.filter((l) => {
    if (user.role === 'client') return l.approval_status === 'approved'
    if (user.role === 'contractor') {
      return (
        l.author_email.toLowerCase() === user.email.toLowerCase() ||
        store.daily_logs.every((x) => x.author_email.toLowerCase() !== user.email.toLowerCase())
      )
    }
    return true
  })

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.role === 'client'
              ? 'Approved Daily Site Logs (Read-Only)'
              : user.role === 'contractor'
                ? 'My Daily Site Logs'
                : 'Daily Site Logs (with Photos)'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {user.role === 'client'
              ? 'View Engineer-approved daily weather reports, field notes, and site progress photos.'
              : 'Record daily weather, site progress notes, and upload construction progress photos.'}
          </p>
        </div>
        <DailyLogsClient
          initialLogs={filteredLogs}
          projects={store.projects}
          role={user.role}
        />
      </div>
    </AppShell>
  )
}
