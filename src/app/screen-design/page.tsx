import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import AppShell from '@/components/layout/AppShell'
import ScreenDesignShowcase from '@/components/design/ScreenDesignShowcase'

export const metadata = {
  title: 'Screen Design, Stack & Setup | Construction Management System',
}

export default function ScreenDesignPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-gray-500">
          Loading Screen Design, Tech Stack &amp; Project Setup…
        </div>
      }
    >
      <ScreenDesignContent />
    </Suspense>
  )
}

async function ScreenDesignContent() {
  const user = await requireAuth()

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sections 5–7: Screen Design, Tech Stack &amp; Project Setup
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Phone-first wireframes for all 9 screens, technology stack overview, and reusable
            architecture modules.
          </p>
        </div>

        <ScreenDesignShowcase />
      </div>
    </AppShell>
  )
}
