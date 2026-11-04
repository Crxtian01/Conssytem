import ModuleLoadingSkeleton from '@/components/layout/ModuleLoadingSkeleton'
import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { readStore } from '@/lib/module-store'
import AppShell from '@/components/layout/AppShell'
import EquipmentClient from '@/components/modules/EquipmentClient'

export default function EquipmentPage() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton title="Loading equipment..." />}>
      <EquipmentContent />
    </Suspense>
  )
}

async function EquipmentContent() {
  const user = await requireAuth()
  const store = readStore()

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track heavy machinery, serial codes, site deployment, and maintenance status.
          </p>
        </div>
        <EquipmentClient initialEquipment={store.equipment} projects={store.projects} />
      </div>
    </AppShell>
  )
}


