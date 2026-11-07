import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { readBiddingStore } from '@/lib/bidding-store'
import AppShell from '@/components/layout/AppShell'
import ModuleLoadingSkeleton from '@/components/layout/ModuleLoadingSkeleton'
import BiddingWorkspace from '@/components/bidding/BiddingWorkspace'

export const metadata = {
  title: 'Bidding Management (RA 12009) | ConstructMS',
}

export default function BiddingPage() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton title="Loading Bidding Management…" />}>
      <BiddingContent />
    </Suspense>
  )
}

async function BiddingContent() {
  const user = await requireAuth()
  const isAllowed =
    user.role === 'admin_engineer' ||
    user.role === 'assistant' ||
    user.role === 'contractor'

  // Strict server-side guard: Client never loads any bidding store data
  if (!isAllowed) {
    return (
      <AppShell user={user}>
        <div />
      </AppShell>
    )
  }

  const biddingStore = readBiddingStore()

  return (
    <AppShell user={user}>
      <BiddingWorkspace
        initialStore={biddingStore}
        userRole={user.role}
        userEmail={user.email}
        userName={user.fullName || user.email}
      />
    </AppShell>
  )
}

