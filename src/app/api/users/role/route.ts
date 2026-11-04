import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ROLES, normalizeRole, type UserRole } from '@/lib/roles'
import { setCachedUserRole } from '@/lib/auth'

// POST /api/users/role
// Updates a user's role to one of the 4 project roles:
// 'admin_engineer' | 'assistant' | 'contractor' | 'client'
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const targetUserId = (body.userId as string) || user.id
  const newRole = body.role as UserRole

  if (!newRole || !(newRole in ROLES)) {
    return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 })
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const callerRole = normalizeRole(
    (user.user_metadata?.app_role as string) || undefined
  )
  const isSelf = targetUserId === user.id

  if (callerRole !== 'admin_engineer' && !isSelf) {
    return NextResponse.json(
      { error: 'Only Admin / Engineer can change another user’s role.' },
      { status: 403 }
    )
  }

  // 1. Save in auth.users.user_metadata.app_role so it works immediately
  const { data: targetAuthUser } = await adminSupabase.auth.admin.getUserById(targetUserId)
  await adminSupabase.auth.admin.updateUserById(targetUserId, {
    user_metadata: {
      ...(targetAuthUser?.user?.user_metadata ?? {}),
      app_role: newRole,
    },
  })

  // 2. Also update public.profiles.role (if column is text or enum)
  const { error: directErr } = await adminSupabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', targetUserId)

  if (directErr) {
    // Fallback if the user hasn't run 004_four_roles_update.sql yet and profiles.role is still old enum
    const legacyEnumMap: Record<UserRole, string> = {
      admin_engineer: 'admin',
      assistant: 'project_manager',
      contractor: 'foreman',
      client: 'client',
    }
    await adminSupabase
      .from('profiles')
      .update({ role: legacyEnumMap[newRole], updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
  }

  setCachedUserRole(targetUserId, newRole)
  return NextResponse.json({ ok: true, role: newRole })
}
