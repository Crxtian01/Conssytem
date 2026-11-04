import { NextResponse, type NextRequest } from 'next/server'
import { getAdminDb } from '@/lib/db'

// POST /api/email/verify-token
// Section 10:
// "When the user clicks the link, check that the token exists, is unused, and has not expired.
//  Then set email_verified = true and mark the token used or delete it."
export async function POST(request: NextRequest) {
  const { token } = await request.json()
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing verification token.' }, { status: 400 })
  }

  const adminDb = getAdminDb()
  const now = new Date()

  // 1. Check `email_verifications` table first if it exists
  const { data: row, error: tableError } = await adminDb
    .from('email_verifications')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!tableError && row) {
    if (row.used) {
      return NextResponse.json(
        { error: 'This confirmation link has already been used.' },
        { status: 400 }
      )
    }

    if (new Date(row.expires_at) < now) {
      return NextResponse.json(
        { error: 'This confirmation link has expired (valid for 24 hours). Please request a new one.' },
        { status: 400 }
      )
    }

    // Mark token used
    await adminDb
      .from('email_verifications')
      .update({ used: true })
      .eq('id', row.id)

    // Mark profile email_verified = true and update notification_email if columns exist
    await adminDb
      .from('profiles')
      .update({
        email_verified: true,
        notification_email: row.target_email,
        notification_email_verified: true,
        updated_at: now.toISOString(),
      })
      .eq('id', row.user_id)

    // Also sync user_metadata
    const { data: authUser } = await adminDb.auth.admin.getUserById(row.user_id)
    await adminDb.auth.admin.updateUserById(row.user_id, {
      user_metadata: {
        ...(authUser?.user?.user_metadata ?? {}),
        verified_notification_email: row.target_email,
        pending_notification_email: null,
        notification_token_used: true,
      },
    })

    return NextResponse.json({
      ok: true,
      verifiedEmail: row.target_email,
    })
  }

  // 2. Fallback check in auth.users user_metadata (works even before 002 SQL is run)
  const { data: usersList } = await adminDb.auth.admin.listUsers({ perPage: 100 })
  const matchedUser = usersList?.users?.find(
    (u) => u.user_metadata?.notification_token === token
  )

  if (!matchedUser) {
    return NextResponse.json(
      { error: 'Invalid or unknown verification token.' },
      { status: 404 }
    )
  }

  const meta = matchedUser.user_metadata ?? {}
  if (meta.notification_token_used) {
    return NextResponse.json(
      { error: 'This confirmation link has already been used.' },
      { status: 400 }
    )
  }

  if (!meta.notification_token_expires_at || new Date(meta.notification_token_expires_at) < now) {
    return NextResponse.json(
      { error: 'This confirmation link has expired (24h limit). Please request a new one.' },
      { status: 400 }
    )
  }

  const targetEmail = meta.pending_notification_email as string

  await adminDb.auth.admin.updateUserById(matchedUser.id, {
    user_metadata: {
      ...meta,
      verified_notification_email: targetEmail,
      pending_notification_email: null,
      notification_token_used: true,
    },
  })

  await adminDb
    .from('profiles')
    .update({ email_verified: true, updated_at: now.toISOString() })
    .eq('id', matchedUser.id)

  return NextResponse.json({
    ok: true,
    verifiedEmail: targetEmail,
  })
}

