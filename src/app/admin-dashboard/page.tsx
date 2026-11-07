import { Suspense } from 'react'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { fetchAdminDashboardAnalytics } from '@/lib/admin-dashboard-service'
import { ROLES } from '@/lib/roles'
import AppShell from '@/components/layout/AppShell'
import ModuleLoadingSkeleton from '@/components/layout/ModuleLoadingSkeleton'
import AdminEngineerDashboard from '@/components/dashboard/admin/AdminEngineerDashboard'

export const metadata = {
  title: 'Admin / Engineer Executive Dashboard | ConstructMS',
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={<ModuleLoadingSkeleton title="Loading Admin / Engineer Executive Dashboard…" />}
    >
      <AdminDashboardServerContent />
    </Suspense>
  )
}

async function AdminDashboardServerContent() {
  const user = await requireAuth()

  // Strict server-side verified role check: only Admin / Engineer can view this dashboard
  if (user.role !== 'admin_engineer') {
    const roleLabel = ROLES[user.role]?.label ?? user.role
    return (
      <AppShell user={user}>
        <div className="liquid-glass-card mx-auto max-w-2xl rounded-3xl p-8 text-center space-y-4 mt-8">
          <div className="liquid-droplet-pill mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl">
            🔒
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Access Denied — Admin / Engineer Role Required
          </h1>
          <p className="text-sm text-slate-700">
            Your verified server role is <strong>{roleLabel}</strong>. Only{' '}
            <strong>Admin / Engineer</strong> has permission to access the Executive Financial,
            S-Curve &amp; Approvals Command Center.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
            >
              ← Return to Your {roleLabel} Dashboard
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  const initialPayload = await fetchAdminDashboardAnalytics({
    projectId: 'all',
    dateRange: 'this_quarter',
  })

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <AdminEngineerDashboard initialPayload={initialPayload} />
      </div>
    </AppShell>
  )
}

