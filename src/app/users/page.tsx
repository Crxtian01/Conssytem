import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { getAdminDb } from '@/lib/db'
import { normalizeRole } from '@/lib/roles'
import AppShell from '@/components/layout/AppShell'
import RoleManager from '@/components/users/RoleManager'

export const metadata = {
  title: 'Users & Roles | Construction Management System',
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading users &amp; roles…</div>}>
      <UsersContent />
    </Suspense>
  )
}

async function UsersContent() {
  const user = await requireAuth()
  const adminDb = getAdminDb()

  const { data: allProfiles } = await adminDb
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, email_verified, created_at')
    .order('created_at', { ascending: true })

  const { data: authList } = await adminDb.auth.admin.listUsers()
  const metaRoleByUserId = new Map<string, string>()
  for (const u of authList?.users ?? []) {
    const appRole = u.user_metadata?.app_role as string | undefined
    if (appRole) metaRoleByUserId.set(u.id, appRole)
  }

  const normalizedProfiles = (allProfiles ?? []).map((p) => ({
    ...p,
    role: normalizeRole(metaRoleByUserId.get(p.id) || (p.role as string)),
  }))

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users &amp; Role Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the 4 project roles (<strong>Admin / Engineer</strong>, <strong>Assistant</strong>,{' '}
            <strong>Contractor</strong>, and <strong>Client</strong>) and enforce strict per-role module access.
          </p>
        </div>

        <RoleManager
          currentUserId={user.id}
          currentUserRole={user.role}
          profiles={normalizedProfiles as never[]}
        />
      </div>
    </AppShell>
  )
}
