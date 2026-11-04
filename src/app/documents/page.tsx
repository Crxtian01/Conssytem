import ModuleLoadingSkeleton from '@/components/layout/ModuleLoadingSkeleton'
import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { readStore } from '@/lib/module-store'
import AppShell from '@/components/layout/AppShell'
import DocumentsClient from '@/components/modules/DocumentsClient'

export default function DocumentsPage() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton title="Loading documents..." />}>
      <DocumentsContent />
    </Suspense>
  )
}

async function DocumentsContent() {
  const user = await requireAuth()
  const store = readStore()

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Documents &amp; Blueprints</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage blueprints, building permits, and contracts linked to each project.
          </p>
        </div>
        <DocumentsClient
          initialDocuments={store.documents}
          projects={store.projects}
          role={user.role}
        />
      </div>
    </AppShell>
  )
}


