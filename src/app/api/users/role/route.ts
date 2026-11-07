import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { ROLES, normalizeRole, type UserRole } from '@/lib/roles'
import { setCachedUserRole } from '@/lib/auth'
import { readStore, writeStore, newId } from '@/lib/module-store'

async function applyUserRoleInSupabase(targetUserId: string, newRole: UserRole) {
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: targetAuthUser } = await adminSupabase.auth.admin.getUserById(targetUserId)
  await adminSupabase.auth.admin.updateUserById(targetUserId, {
    user_metadata: {
      ...(targetAuthUser?.user?.user_metadata ?? {}),
      app_role: newRole,
    },
  })

  const { error: directErr } = await adminSupabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', targetUserId)

  if (directErr) {
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
}

export async function GET() {
  const store = readStore()
  return NextResponse.json({ role_requests: store.role_requests })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const action = (body.action as string) || 'assign_role'
  const callerRole = normalizeRole(
    (user.user_metadata?.app_role as string) || undefined
  )
  const store = readStore()

  // 1. User submits a Role Change Request (Assistant / Contractor / Client -> Admin/Engineer)
  if (action === 'request_role') {
    const requestedRole = body.requestedRole as UserRole
    if (!requestedRole || !(requestedRole in ROLES)) {
      return NextResponse.json({ error: 'Invalid requested role.' }, { status: 400 })
    }
    const existingPending = store.role_requests.find(
      (r) => r.user_id === user.id && r.status === 'pending'
    )
    if (existingPending) {
      existingPending.requested_role = requestedRole
      existingPending.reason = (body.reason ?? 'Role change requested from workspace').trim()
      existingPending.created_at = new Date().toISOString()
      writeStore(store)
      return NextResponse.json({ ok: true, request: existingPending })
    }

    const newReq = {
      id: newId('rreq'),
      user_id: user.id,
      user_email: user.email || '',
      user_name: (user.user_metadata?.full_name as string) || user.email || 'User',
      current_role: callerRole,
      requested_role: requestedRole,
      reason: (body.reason ?? 'Role change requested from workspace').trim(),
      status: 'pending' as const,
      created_at: new Date().toISOString(),
    }
    store.role_requests.unshift(newReq)
    writeStore(store)
    return NextResponse.json({ ok: true, request: newReq })
  }

  // 2. Admin / Engineer approves or rejects a Role Request
  if (action === 'approve_request' || action === 'reject_request') {
    if (callerRole !== 'admin_engineer') {
      return NextResponse.json(
        { error: 'Only Admin / Engineer can approve or reject role requests.' },
        { status: 403 }
      )
    }
    const reqId = body.requestId as string
    const roleReq = store.role_requests.find((r) => r.id === reqId)
    if (!roleReq) {
      return NextResponse.json({ error: 'Role request not found.' }, { status: 404 })
    }

    roleReq.status = action === 'approve_request' ? 'approved' : 'rejected'
    roleReq.reviewed_by_email = user.email || 'Admin'
    writeStore(store)

    if (action === 'approve_request') {
      await applyUserRoleInSupabase(roleReq.user_id, roleReq.requested_role)
    }

    return NextResponse.json({
      ok: true,
      request: roleReq,
      role_requests: store.role_requests,
    })
  }

  // 3. Direct role assignment (Admin / Engineer managing users, or self demo switch when allowed)
  const targetUserId = (body.userId as string) || user.id
  const newRole = body.role as UserRole

  if (!newRole || !(newRole in ROLES)) {
    return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 })
  }

  const isSelf = targetUserId === user.id
  if (callerRole !== 'admin_engineer' && !isSelf) {
    return NextResponse.json(
      { error: 'Only Admin / Engineer can manage user roles.' },
      { status: 403 }
    )
  }

  await applyUserRoleInSupabase(targetUserId, newRole)
  return NextResponse.json({ ok: true, role: newRole })
}
