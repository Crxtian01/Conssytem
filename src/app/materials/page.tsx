import ModuleLoadingSkeleton from '@/components/layout/ModuleLoadingSkeleton'
import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { readStore } from '@/lib/module-store'
import AppShell from '@/components/layout/AppShell'
import MaterialsClient from '@/components/modules/MaterialsClient'

export default function MaterialsPage() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton title="Loading materials..." />}>
      <MaterialsContent />
    </Suspense>
  )
}

async function MaterialsContent() {
  const user = await requireAuth()
  const store = readStore()

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materials &amp; Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Log materials received (Stock IN) and used (Stock OUT) with automatic low-stock warnings.
          </p>
        </div>
        <MaterialsClient
          initialMaterials={store.materials}
          initialTransactions={store.material_transactions}
          projects={store.projects}
          role={user.role}
        />
      </div>
    </AppShell>
  )
}


