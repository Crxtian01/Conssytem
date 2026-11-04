import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { readStore } from '@/lib/module-store'
import { ROLES } from '@/lib/roles'
import AppShell from '@/components/layout/AppShell'
import ProjectsClient from '@/components/modules/ProjectsClient'

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading projects…</div>}>
      <ProjectsContent />
    </Suspense>
  )
}

async function ProjectsContent() {
  const user = await requireAuth()
  const store = readStore()
  const perms = ROLES[user.role].permissions
  const projects = store.projects.map((p) => ({
    ...p,
    budget: perms.viewBudgets ? p.budget : 0,
  }))

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects &amp; Sites</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage construction sites, timelines, progress percentages, and project budgets.
          </p>
        </div>
        <ProjectsClient initialProjects={projects} role={user.role} />
      </div>
    </AppShell>
  )
}
