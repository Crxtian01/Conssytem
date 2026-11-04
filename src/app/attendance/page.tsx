import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { readStore } from '@/lib/module-store'
import AppShell from '@/components/layout/AppShell'
import AttendanceClient from '@/components/modules/AttendanceClient'

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading attendance…</div>}>
      <AttendanceContent />
    </Suspense>
  )
}

async function AttendanceContent() {
  const user = await requireAuth()
  const store = readStore()

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workers &amp; Attendance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Record daily worker attendance, site hours, and trade daily rates.
          </p>
        </div>
        <AttendanceClient
          initialWorkers={store.workers}
          initialAttendance={store.attendance}
          projects={store.projects}
        />
      </div>
    </AppShell>
  )
}

