import { Suspense } from 'react'
import Link from 'next/link'
import { getOptionalAuthUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/db'
import { readStore } from '@/lib/module-store'
import { readBiddingStore } from '@/lib/bidding-store'
import { fetchAdminDashboardAnalytics } from '@/lib/admin-dashboard-service'
import AppShell from '@/components/layout/AppShell'
import ModuleLoadingSkeleton from '@/components/layout/ModuleLoadingSkeleton'
import LandingPage from '@/components/landing/LandingPage'
import NotificationEmailCard from '@/components/auth/NotificationEmailCard'
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics'
import { ROLES } from '@/lib/roles'

export default function HomePage() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton title="Loading ConstructMS…" />}>
      <HomeOrDashboardContent />
    </Suspense>
  )
}

async function HomeOrDashboardContent() {
  const user = await getOptionalAuthUser()

  // Show the ConstructMS Landing Page when not signed in
  if (!user) {
    return <LandingPage isSignedIn={false} />
  }

  const adminDb = getAdminDb()
  const { data: authUserData } = await adminDb.auth.admin.getUserById(user.id)
  const meta = authUserData?.user?.user_metadata ?? {}

  const verifiedNotificationEmail = (meta.verified_notification_email as string) || null
  const pendingNotificationEmail = (meta.pending_notification_email as string) || null

  const store = readStore()
  const biddingStore = readBiddingStore()
  const roleInfo = ROLES[user.role] ?? ROLES.contractor
  const canManageUsers = user.role === 'admin_engineer'
  const adminDashboardPayload =
    user.role === 'admin_engineer'
      ? await fetchAdminDashboardAnalytics({ projectId: 'all', dateRange: 'this_quarter' })
      : undefined

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-[1440px] space-y-6">
        {/* Dedicated Role-Specific Dashboard (Matches Asset Management Dashboard Design) */}
        <DashboardAnalytics
          store={store}
          biddingStore={biddingStore}
          role={user.role}
          userEmail={user.email}
          adminDashboardPayload={adminDashboardPayload}
        />

        {/* Collapsible Email Notification Verification Pill */}
        {(!verifiedNotificationEmail && !pendingNotificationEmail) ? null : (
          <NotificationEmailCard
            primaryEmail={user.email}
            verifiedNotificationEmail={verifiedNotificationEmail}
            pendingNotificationEmail={pendingNotificationEmail}
          />
        )}
      </div>
    </AppShell>
  )
}
