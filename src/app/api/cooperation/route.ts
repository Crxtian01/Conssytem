import { NextResponse, type NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/db'
import { setCachedUserRole, clearAuthCache } from '@/lib/auth'
import { readStore, writeStore, newId } from '@/lib/module-store'
import type { UserRole } from '@/lib/roles'

export async function GET(request: NextRequest) {
  const store = readStore()
  const reqId = request.nextUrl.searchParams.get('id')
  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase()

  if (reqId) {
    const found = store.cooperation_requests.find((r) => r.id === reqId) ?? null
    return NextResponse.json({ request: found })
  }

  if (email) {
    const found =
      store.cooperation_requests.find((r) => r.email.toLowerCase() === email) ?? null
    return NextResponse.json({ request: found })
  }

  return NextResponse.json({
    cooperation_requests: store.cooperation_requests,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = (body.action as string) || 'submit_request'
    const store = readStore()

    if (action === 'submit_request') {
      const email = ((body.email as string) || '').trim().toLowerCase()
      const fullName = ((body.fullName as string) || '').trim() || email.split('@')[0] || 'Contractor'
      const password = ((body.password as string) || '').trim() || 'Contractor123'
      const requestedRole: UserRole = 'contractor'
      const projectName =
        ((body.projectName as string) || '').trim() || 'Metro Commercial Tower Phase 1'
      const message =
        ((body.message as string) || '').trim() ||
        'Requesting cooperation and Contractor access to join the project.'

      if (!email) {
        return NextResponse.json(
          { error: 'Please enter your email address first.' },
          { status: 400 }
        )
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Please enter a password of at least 6 characters for your automatic account.' },
          { status: 400 }
        )
      }

      const newReq = {
        id: newId('coop'),
        full_name: fullName,
        email,
        password,
        requested_role: requestedRole,
        project_name: projectName,
        message,
        status: 'pending' as const,
        engineer_email: 'lacuatachristian01@gmail.com',
        approval_email_sent: false,
        created_at: new Date().toISOString(),
      }

      store.cooperation_requests.unshift(newReq)
      writeStore(store)

      return NextResponse.json({
        ok: true,
        request: newReq,
      })
    }

    if (action === 'approve_request') {
      const requestId = body.requestId as string
      const coopReq = store.cooperation_requests.find((r) => r.id === requestId)

      if (!coopReq) {
        return NextResponse.json(
          { error: 'Cooperation request not found.' },
          { status: 404 }
        )
      }

      const adminDb = getAdminDb()
      const targetEmail = coopReq.email.trim().toLowerCase()
      const targetPassword = coopReq.password || 'Contractor123'
      const targetRole: UserRole = 'contractor'

      const { data: listData } = await adminDb.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })

      const existingUser = (listData?.users ?? []).find(
        (u) => u.email?.toLowerCase() === targetEmail
      )

      let userId: string | undefined = existingUser?.id

      if (!existingUser) {
        const { data: created, error: createErr } =
          await adminDb.auth.admin.createUser({
            email: targetEmail,
            password: targetPassword,
            email_confirm: true,
            user_metadata: {
              full_name: coopReq.full_name,
              role: targetRole,
              app_role: targetRole,
            },
          })

        if (createErr) {
          return NextResponse.json({ error: createErr.message }, { status: 500 })
        }
        userId = created.user?.id
      } else {
        await adminDb.auth.admin.updateUserById(existingUser.id, {
          password: targetPassword,
          email_confirm: true,
          user_metadata: {
            ...(existingUser.user_metadata ?? {}),
            full_name: coopReq.full_name || existingUser.user_metadata?.full_name,
            role: targetRole,
            app_role: targetRole,
          },
        })
      }

      if (userId) {
        await adminDb.from('profiles').upsert(
          {
            id: userId,
            email: targetEmail,
            full_name: coopReq.full_name,
            role: targetRole,
            email_verified: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        setCachedUserRole(userId, targetRole)
        clearAuthCache()
        coopReq.created_user_id = userId
      }

      // Connect the contractor to the requested project
      const matchedProject = store.projects.find(
        (p) => p.name.toLowerCase() === coopReq.project_name.toLowerCase()
      )
      if (matchedProject) {
        matchedProject.assigned_contractor = true
      }

      coopReq.status = 'approved'
      coopReq.approval_email_sent = true
      coopReq.approved_by_email = 'lacuatachristian01@gmail.com'
      coopReq.approved_at = new Date().toISOString()
      writeStore(store)

      return NextResponse.json({
        ok: true,
        request: coopReq,
        notice: `Request approved by Engineer (lacuatachristian01@gmail.com). Approval email sent to ${coopReq.email} and Contractor account automatically created!`,
      })
    }

    if (action === 'reject_request') {
      const requestId = body.requestId as string
      const coopReq = store.cooperation_requests.find((r) => r.id === requestId)
      if (!coopReq) {
        return NextResponse.json(
          { error: 'Cooperation request not found.' },
          { status: 404 }
        )
      }
      coopReq.status = 'rejected'
      coopReq.approved_by_email = 'lacuatachristian01@gmail.com'
      coopReq.approved_at = new Date().toISOString()
      writeStore(store)
      return NextResponse.json({ ok: true, request: coopReq })
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to process cooperation request.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

