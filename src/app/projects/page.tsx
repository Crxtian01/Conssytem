import ModuleLoadingSkeleton from '@/components/layout/ModuleLoadingSkeleton'
import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { readStore } from '@/lib/module-store'
import { ROLES } from '@/lib/roles'
import AppShell from '@/components/layout/AppShell'
import ProjectsClient from '@/components/modules/ProjectsClient'

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton title="Loading projects..." />}>
      <ProjectsContent />
    </Suspense>
  )
}

async function ProjectsContent() {
  const user = await requireAuth()
  const store = readStore()
  const perms = ROLES[user.role].permissions

  const projects = store.projects
    .filter((p) => {
      if (user.role === 'contractor') return p.assigned_contractor !== false
      if (user.role === 'assistant') return p.assigned_assistant !== false
      return true
    })
    .map((p) => ({
      ...p,
      budget: perms.viewBudgets ? p.budget : 0,
    }))

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.role === 'admin_engineer'
              ? 'Projects & Sites (Full Access)'
              : user.role === 'client'
                ? 'Project Progress (Read-Only)'
                : 'Assigned Projects & Sites'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {user.role === 'admin_engineer'
              ? 'Create, update, and manage construction projects, timelines, budgets, and records.'
              : user.role === 'assistant'
                ? 'View assigned construction sites and update milestone progress.'
                : 'Monitor assigned construction site timelines and completion progress.'}
          </p>
        </div>
        <ProjectsClient initialProjects={projects} role={user.role} />
      </div>
    </AppShell>
  )
}
