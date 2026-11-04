/**
 * Section 7 & Section 9: One Reusable Email Service
 * Every feature (email confirmation, task notices, low-stock alerts, expense approvals, weekly reports)
 * calls `sendEmail(to, subject, html)`.
 */

export interface SendEmailInput {
  to: string
  subject: string
  html: string
}

export interface SendEmailResult {
  ok: boolean
  provider: 'resend' | 'console-log'
  messageId?: string
  error?: string
}

export function buildBrandedEmailHtml({
  heading,
  bodyHtml,
  ctaLabel,
  ctaUrl,
}: {
  heading: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #f59e0b; padding: 18px 24px; color: #ffffff; font-weight: bold; font-size: 18px;">
        🏗️ ConstructMS — Construction Management System
      </div>
      <div style="padding: 24px; color: #1f2937; line-height: 1.6;">
        <h2 style="margin-top: 0; color: #111827;">${heading}</h2>
        ${bodyHtml}
        ${
          ctaLabel && ctaUrl
            ? `
          <div style="margin: 24px 0;">
            <a href="${ctaUrl}" style="background: #d97706; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; display: inline-block;">
              ${ctaLabel}
            </a>
          </div>
          <p style="font-size: 12px; color: #6b7280;">
            Or copy and paste this link into your browser:<br/>
            <a href="${ctaUrl}" style="color: #d97706; word-break: break-all;">${ctaUrl}</a>
          </p>
        `
            : ''
        }
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          If you did not request this email, you can safely ignore it.
        </p>
      </div>
    </div>
  `
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailInput): Promise<SendEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromAddress =
    process.env.EMAIL_FROM || 'ConstructMS <onboarding@resend.dev>'

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        return {
          ok: false,
          provider: 'resend',
          error: data?.message || 'Failed to send email via Resend',
        }
      }
      return { ok: true, provider: 'resend', messageId: data.id }
    } catch (err) {
      return {
        ok: false,
        provider: 'resend',
        error: err instanceof Error ? err.message : 'Unknown email error',
      }
    }
  }

  // Fallback for local development when RESEND_API_KEY is not set
  console.log(`[sendEmail -> ${to}] Subject: ${subject}`)
  return {
    ok: true,
    provider: 'console-log',
    messageId: `local-${Date.now()}`,
  }
}
