import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { readStore } from '@/lib/module-store'
import AppShell from '@/components/layout/AppShell'
import TasksClient from '@/components/modules/TasksClient'

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading tasks…</div>}>
      <TasksContent />
    </Suspense>
  )
}

async function TasksContent() {
  const user = await requireAuth()
  const store = readStore()

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks &amp; Progress Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">
            Assign site tasks, update completion percentages (0–100%), and track due dates.
          </p>
        </div>
        <TasksClient initialTasks={store.tasks} projects={store.projects} role={user.role} />
      </div>
    </AppShell>
  )
}
