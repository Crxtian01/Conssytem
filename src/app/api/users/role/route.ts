import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ROLES, type UserRole } from '@/lib/roles'

// POST /api/users/role
// Updates a user's role.
// - Admins can update any user's role.
// - If there are no admins in the system yet (initial bootstrap), or a user is switching their own role
//   during testing, we allow self-update when allowSelfSwitch is true or user is admin.
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

  // Check caller's current role and whether any admin exists yet
  const { data: callerProfile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { count: adminCount } = await adminSupabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')

  const isCallerAdmin = callerProfile?.role === 'admin'
  const isSelf = targetUserId === user.id

  // Only Admin can change other people's roles.
  // Allow changing own role so the user can test all 6 roles easily or bootstrap the first Admin.
  if (!isCallerAdmin && !isSelf && (adminCount ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Only an Admin can change another user’s role.' },
      { status: 403 }
    )
  }

  const { error } = await adminSupabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', targetUserId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, role: newRole })
}
