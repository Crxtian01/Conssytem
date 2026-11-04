import { redirect } from 'next/navigation'
import { getSessionDb, getAdminDb } from '@/lib/db'
import { ROLES, normalizeRole, type UserRole } from '@/lib/roles'

export interface AuthenticatedUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: UserRole
  emailVerified: boolean
}

const profileCache = new Map<
  string,
  { user: AuthenticatedUser; expiresAt: number }
>()

export function setCachedUserRole(userId: string, newRole: UserRole) {
  const existing = profileCache.get(userId)
  if (existing) {
    existing.user = { ...existing.user, role: newRole }
    existing.expiresAt = Date.now() + 30_000
  }
}

export function clearAuthCache() {
  profileCache.clear()
}

/**
 * Returns the authenticated user if signed in, or null if unauthenticated (no redirect).
 */
export async function getOptionalAuthUser(): Promise<AuthenticatedUser | null> {
  const supabase = await getSessionDb()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const sessionUser = session?.user
  if (!sessionUser) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    return resolveUserProfile(user.id, user.email ?? '', user.user_metadata, user.email_confirmed_at)
  }

  const cached = profileCache.get(sessionUser.id)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user
  }

  return resolveUserProfile(
    sessionUser.id,
    sessionUser.email ?? '',
    sessionUser.user_metadata,
    sessionUser.email_confirmed_at
  )
}

/**
 * Section 7: Reusable Authentication & Role Helper
 * Ensures the caller is signed in and returns their profile + normalized 4-tier role:
 * ('admin_engineer' | 'assistant' | 'contractor' | 'client')
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getOptionalAuthUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

async function resolveUserProfile(
  userId: string,
  fallbackEmail: string,
  userMeta: Record<string, unknown> | undefined,
  emailConfirmedAt: string | undefined
): Promise<AuthenticatedUser> {
  const adminDb = getAdminDb()
  const { data: profile } = await adminDb
    .from('profiles')
    .select('full_name, email, avatar_url, role, email_verified')
    .eq('id', userId)
    .single()

  // Also check fresh auth user metadata in case role was switched
  const { data: freshAuth } = await adminDb.auth.admin.getUserById(userId)
  const rawRole =
    (freshAuth?.user?.user_metadata?.app_role as string) ||
    (userMeta?.app_role as string) ||
    profile?.role
  const role: UserRole = normalizeRole(rawRole)

  const resolved: AuthenticatedUser = {
    id: userId,
    email: profile?.email ?? fallbackEmail,
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    role,
    emailVerified: Boolean(profile?.email_verified ?? emailConfirmedAt),
  }

  profileCache.set(userId, {
    user: resolved,
    expiresAt: Date.now() + 20_000,
  })

  return resolved
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
