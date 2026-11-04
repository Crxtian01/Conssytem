import { randomBytes } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getAdminDb } from '@/lib/db'
import { sendEmail, buildBrandedEmailHtml } from '@/lib/email'

// Simple in-memory rate limit (60s per user) in addition to DB check
const lastSentByUser = new Map<string, number>()

// POST /api/email/send-confirmation
// Implements Section 10:
// - Generates a random single-use token with 24-hour expiry
// - Stores it in `email_verifications` (if table exists) + user_metadata fallback
// - Emails a branded link `http://localhost:3000/verify?token=...` to the selected address
export async function POST(request: NextRequest) {
  const user = await requireAuth()
  const body = await request.json()
  const targetEmail = ((body.targetEmail as string) || '').trim().toLowerCase()

  if (!targetEmail || !targetEmail.includes('@')) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  // Rate limit: 1 request per 60 seconds per user (Section 10 & 14)
  const now = Date.now()
  const lastSent = lastSentByUser.get(user.id) ?? 0
  if (now - lastSent < 60_000) {
    const waitSec = Math.ceil((60_000 - (now - lastSent)) / 1000)
    return NextResponse.json(
      { error: `Please wait ${waitSec}s before resending another confirmation email.` },
      { status: 429 }
    )
  }

  const token = randomBytes(24).toString('hex')
  const expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString() // 24 hours per Section 10
  const verifyUrl = `${request.nextUrl.origin}/verify?token=${token}`

  const adminDb = getAdminDb()

  // 1. Try saving in `email_verifications` table (Section 4 & 10)
  await adminDb.from('email_verifications').insert({
    user_id: user.id,
    target_email: targetEmail,
    token,
    expires_at: expiresAt,
    used: false,
  })

  // 2. Also store pending notification email + token in auth user_metadata
  //    so it works immediately even before 002_full_database_schema.sql is run
  await adminDb.auth.admin.updateUserById(user.id, {
    user_metadata: {
      pending_notification_email: targetEmail,
      notification_token: token,
      notification_token_expires_at: expiresAt,
      notification_token_used: false,
    },
  })

  // 3. Build branded email content per Section 10:
  //    system name & logo, clear "Confirm my email" button, plain-text backup link,
  //    and "If you did not request this, you can ignore this email."
  const html = buildBrandedEmailHtml({
    heading: 'Confirm your email address for notifications',
    bodyHtml: `
      <p>Hello <strong>${user.fullName || user.email}</strong>,</p>
      <p>You selected <strong>${targetEmail}</strong> to receive Construction Management System confirmations, task notices, low-stock alerts, and weekly reports.</p>
      <p>Please click the button below within <strong>24 hours</strong> to verify this email address. Until verified, notifications will continue to be sent to your primary Google/account address (<strong>${user.email}</strong>).</p>
    `,
    ctaLabel: 'Confirm my email',
    ctaUrl: verifyUrl,
  })

  const emailResult = await sendEmail({
    to: targetEmail,
    subject: 'Confirm your email address — ConstructMS',
    html,
  })

  lastSentByUser.set(user.id, now)

  return NextResponse.json({
    ok: true,
    targetEmail,
    expiresAt,
    verifyUrl,
    emailProvider: emailResult.provider,
    emailPreviewHtml: html,
  })
}

