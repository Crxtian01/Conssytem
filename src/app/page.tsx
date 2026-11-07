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
import { ROLES, getModulesForRole } from '@/lib/roles'

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
  const allowedModules = getModulesForRole(user.role).filter((m) => m.id !== 'dashboard')
  const canManageUsers = user.role === 'admin_engineer'
  const adminDashboardPayload =
    user.role === 'admin_engineer'
      ? await fetchAdminDashboardAnalytics({ projectId: 'all', dateRange: 'this_quarter' })
      : undefined

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Welcome banner with Role & Typical Access (Liquid Glass Hero Card) */}
        <div className="liquid-glass-card rounded-3xl p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                  Welcome, {user.fullName || user.email}
                </h1>
                <span
                  className={`rounded-full border px-3 py-0.5 text-xs font-semibold backdrop-blur-md ${roleInfo.badgeColor}`}
                >
                  {roleInfo.label}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-gray-600">
                <strong>Your Scope &amp; Access:</strong> {roleInfo.typicalAccess}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/welcome"
                className="inline-flex items-center justify-center rounded-xl border border-white/90 bg-white/75 px-3.5 py-2 text-xs font-semibold text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md hover:bg-white transition"
              >
                View Landing Page
              </Link>
              {canManageUsers && (
                <Link
                  href="/users"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(217,119,6,0.3)] hover:from-amber-600 hover:to-amber-700 transition"
                >
                  Manage Users &amp; Role Requests
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Dedicated Role-Specific Dashboard (Admin/Engineer uses Recharts + Framer Motion Command Center) */}
        <DashboardAnalytics
          store={store}
          biddingStore={biddingStore}
          role={user.role}
          userEmail={user.email}
          adminDashboardPayload={adminDashboardPayload}
        />

        {/* Email for Notifications & Confirmation Flow */}
        <NotificationEmailCard
          primaryEmail={user.email}
          verifiedNotificationEmail={verifiedNotificationEmail}
          pendingNotificationEmail={pendingNotificationEmail}
        />

        {/* Core Modules available to this user's role */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-lg font-extrabold tracking-tight text-gray-900">
              Allowed Modules for {roleInfo.label} ({allowedModules.length})
            </h2>
            <span className="rounded-full border border-white/80 bg-white/60 px-3 py-1 text-xs font-medium text-gray-600 backdrop-blur-md">
              Liquid Glass Workspace
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allowedModules.map((mod) => (
              <Link
                key={mod.id}
                href={mod.href}
                className="group flex flex-col justify-between rounded-2xl border border-white/80 bg-white p-5 transition hover:border-amber-400"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 group-hover:text-amber-700">
                      {mod.name}
                    </h3>
                    <span className="rounded-full border border-white/90 bg-white/75 px-2.5 py-0.5 text-xs font-semibold text-gray-700 shadow-2xs">
                      Phase {mod.phase}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">{mod.description}</p>
                </div>
                <div className="mt-4 text-xs font-semibold text-amber-700 group-hover:translate-x-1 transition">
                  Open module →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
