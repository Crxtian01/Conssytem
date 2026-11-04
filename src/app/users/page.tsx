import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient as createServerSupabase } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import AppShell from '@/components/layout/AppShell'
import RoleManager from '@/components/users/RoleManager'
import type { UserRole } from '@/lib/roles'

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
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: myProfile } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: allProfiles } = await adminSupabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, email_verified, created_at')
    .order('created_at', { ascending: true })

  const currentRole: UserRole = (myProfile?.role as UserRole) ?? 'worker'

  return (
    <AppShell
      user={{
        id: user.id,
        email: myProfile?.email ?? user.email ?? '',
        fullName: myProfile?.full_name ?? null,
        avatarUrl: myProfile?.avatar_url ?? null,
        role: currentRole,
        emailVerified: Boolean(myProfile?.email_verified ?? user.email_confirmed_at),
      }}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users &amp; Role Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage team roles (Admin, Project Manager, Engineer, Foreman, Worker, Client) and
            verify role-based access control.
          </p>
        </div>

        <RoleManager
          currentUserId={user.id}
          currentUserRole={currentRole}
          profiles={(allProfiles as never[]) ?? []}
        />
      </div>
    </AppShell>
  )
}
