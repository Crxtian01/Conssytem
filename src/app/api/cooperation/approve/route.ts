import { NextResponse, type NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/db'
import { setCachedUserRole, clearAuthCache } from '@/lib/auth'
import { readStore, writeStore, newId } from '@/lib/module-store'
import type { UserRole } from '@/lib/roles'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const requestId = searchParams.get('id') || ''
    const emailParam = (searchParams.get('email') || '').trim().toLowerCase()
    const nameParam = (searchParams.get('name') || '').trim() || 'Contractor'
    const projectParam =
      (searchParams.get('project') || '').trim() || 'Metro Commercial Tower Phase 1'
    const pwParam = (searchParams.get('pw') || '').trim() || 'Contractor123'

    const store = readStore()
    let coopReq = store.cooperation_requests.find(
      (r) =>
        (requestId && r.id === requestId) ||
        (emailParam && r.email.toLowerCase() === emailParam)
    )

    if (!coopReq && emailParam) {
      coopReq = {
        id: requestId || newId('coop'),
        full_name: nameParam,
        email: emailParam,
        password: pwParam,
        requested_role: 'contractor',
        project_name: projectParam,
        message: `Requesting cooperation to join ${projectParam} as Contractor.`,
        status: 'pending',
        engineer_email: 'lacuatachristian01@gmail.com',
        approval_email_sent: false,
        created_at: new Date().toISOString(),
      }
      store.cooperation_requests.unshift(coopReq)
    }

    if (!coopReq) {
      return new NextResponse(
        `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;"><h2>Cooperation Request Not Found</h2><p>Please submit a request from the Sign In page first.</p><a href="/login">Back to Sign In</a></body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 404 }
      )
    }

    const adminDb = getAdminDb()
    const targetEmail = coopReq.email.trim().toLowerCase()
    const targetPassword = coopReq.password || pwParam || 'Contractor123'
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
      const { data: created } = await adminDb.auth.admin.createUser({
        email: targetEmail,
        password: targetPassword,
        email_confirm: true,
        user_metadata: {
          full_name: coopReq.full_name,
          role: targetRole,
          app_role: targetRole,
        },
      })
      userId = created?.user?.id
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

    const replyMailto = `mailto:${encodeURIComponent(
      coopReq.email
    )}?subject=${encodeURIComponent(
      `APPROVED: ConstructMS Project Cooperation — ${coopReq.project_name}`
    )}&body=${encodeURIComponent(
      `Hello ${coopReq.full_name},\n\nYour request to join "${coopReq.project_name}" as a Contractor has been APPROVED by the Admin / Lead Engineer!\n\nYour Contractor account (${coopReq.email}) has been automatically created and activated.\n\nOpen your Contractor Dashboard here:\n${request.nextUrl.origin}/login?coop_approved=1&email=${encodeURIComponent(coopReq.email)}\n\nWelcome to the project team!\n— ConstructMS Lead Engineer`
    )}`

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Request Approved — ConstructMS</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 20% 20%, #b85d3b, #6f301c 65%, #3d190e 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e1512;
      padding: 20px;
    }
    .card {
      max-width: 500px;
      width: 100%;
      background: rgba(247, 238, 232, 0.92);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.85);
      border-radius: 28px;
      padding: 32px;
      box-shadow: 0 24px 60px rgba(25, 10, 5, 0.35);
      text-align: center;
    }
    .badge {
      display: inline-block;
      background: #d1fae5;
      color: #065f46;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 6px 14px;
      border-radius: 999px;
      margin-bottom: 16px;
    }
    h1 {
      margin: 0 0 10px;
      font-size: 22px;
      font-weight: 800;
      color: #1e1512;
    }
    p {
      margin: 0 0 16px;
      font-size: 14px;
      line-height: 1.6;
      color: #5c4942;
    }
    .details {
      background: rgba(255, 255, 255, 0.75);
      border-radius: 16px;
      padding: 14px 16px;
      text-align: left;
      font-size: 13px;
      margin-bottom: 20px;
      border: 1px solid rgba(255, 255, 255, 0.9);
    }
    .details div {
      margin: 5px 0;
    }
    .btn-primary {
      display: block;
      width: 100%;
      box-sizing: border-box;
      background: linear-gradient(135deg, #cc5c3b, #94361d);
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 13px 18px;
      border-radius: 14px;
      margin-bottom: 10px;
      box-shadow: 0 8px 20px rgba(148, 54, 29, 0.3);
    }
    .btn-secondary {
      display: block;
      width: 100%;
      box-sizing: border-box;
      background: rgba(255, 255, 255, 0.85);
      color: #1e1512;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      padding: 12px 18px;
      border-radius: 14px;
      border: 1px solid rgba(200, 90, 56, 0.35);
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">✓ Cooperation Request Approved</span>
    <h1>Contractor Account Auto-Created!</h1>
    <p>
      You have approved <strong>${coopReq.full_name}</strong> to join <strong>${coopReq.project_name}</strong>.
      Their Contractor account is now active and their browser is automatically redirecting to the <strong>Contractor Dashboard</strong>.
    </p>
    <div class="details">
      <div><strong>Contractor:</strong> ${coopReq.full_name}</div>
      <div><strong>Account Email:</strong> ${coopReq.email}</div>
      <div><strong>Assigned Role:</strong> Contractor / Bidder</div>
      <div><strong>Assigned Project:</strong> ${coopReq.project_name}</div>
      <div><strong>Status:</strong> Approved &amp; Active</div>
    </div>
    <a class="btn-primary" href="/login?coop_approved=1&email=${encodeURIComponent(coopReq.email)}&pw=${encodeURIComponent(targetPassword)}">
      Open Contractor Dashboard Now →
    </a>
    <a class="btn-secondary" href="${replyMailto}">
      Send Approval Notice Email to ${coopReq.email}
    </a>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 200,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Approval error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

