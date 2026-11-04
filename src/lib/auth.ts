import { redirect } from 'next/navigation'
import { getSessionDb, getAdminDb } from '@/lib/db'
import { ROLES, type UserRole } from '@/lib/roles'

export interface AuthenticatedUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: UserRole
  emailVerified: boolean
}

/**
 * Section 7: Reusable Authentication & Role Helper
 * Ensures the caller is signed in and returns their profile + role.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const supabase = await getSessionDb()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminDb = getAdminDb()
  const { data: profile } = await adminDb
    .from('profiles')
    .select('full_name, email, avatar_url, role, email_verified')
    .eq('id', user.id)
    .single()

  const role: UserRole =
    profile?.role && profile.role in ROLES ? (profile.role as UserRole) : 'worker'

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? '',
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    role,
    emailVerified: Boolean(profile?.email_verified ?? user.email_confirmed_at),
  }
}

/**
 * Enforces role permissions on the backend (Section 11).
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedUser> {
  const currentUser = await requireAuth()
  if (!allowedRoles.includes(currentUser.role)) {
    throw new Error(
      `Access denied: role "${ROLES[currentUser.role].label}" cannot perform this action.`
    )
  }
  return currentUser
}
