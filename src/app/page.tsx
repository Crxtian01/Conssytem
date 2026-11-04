import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import AppShell from '@/components/layout/AppShell'
import { ROLES, getModulesForRole, type UserRole } from '@/lib/roles'

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading your dashboard…</div>}>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url, role, email_verified')
    .eq('id', user.id)
    .single()

  const role: UserRole = (profile?.role as UserRole) ?? 'worker'
  const roleInfo = ROLES[role] ?? ROLES.worker
  const allowedModules = getModulesForRole(role).filter((m) => m.id !== 'dashboard')

  return (
    <AppShell
      user={{
        id: user.id,
        email: profile?.email ?? user.email ?? '',
        fullName: profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        role,
        emailVerified: Boolean(profile?.email_verified ?? user.email_confirmed_at),
      }}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Welcome banner with Role & Typical Access */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome, {profile?.full_name || user.email}
                </h1>
                <span
                  className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${roleInfo.badgeColor}`}
                >
                  {roleInfo.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                <strong>Your Scope &amp; Access:</strong> {roleInfo.typicalAccess}
              </p>
            </div>

            <Link
              href="/users"
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
            >
              Manage / Switch Role
            </Link>
          </div>
        </div>

        {/* Core Modules available to this user's role */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Core Modules Available to {roleInfo.label} ({allowedModules.length})
            </h2>
            <span className="text-xs text-gray-500">
              Filtered automatically by your role permissions
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allowedModules.map((mod) => (
              <Link
                key={mod.id}
                href={mod.href}
                className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-amber-400 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-xl">
                      {mod.icon}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      Phase {mod.phase}
                    </span>
                  </div>
                  <h3 className="mt-4 font-bold text-gray-900 group-hover:text-amber-700">
                    {mod.name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">{mod.description}</p>
                </div>
                <div className="mt-4 text-xs font-semibold text-amber-600 group-hover:translate-x-0.5 transition">
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
