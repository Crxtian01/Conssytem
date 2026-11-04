import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

/**
 * Section 7, 9 & 12: One Reusable Email Service + Notification Templates
 * Every feature calls `sendEmail(to, subject, html)`.
 * Also logs every sent email to `data/emails.json` so you can inspect and verify
 * all 6 notification types from Section 12 in the Email Notification Center (/notifications).
 */

export type NotificationCategory =
  | 'email_confirmation'
  | 'welcome_after_confirmation'
  | 'password_reset'
  | 'task_assignment'
  | 'low_stock_alert'
  | 'approval_notice'
  | 'weekly_client_report'

export interface SentEmailRecord {
  id: string
  category: NotificationCategory
  to: string
  subject: string
  html: string
  provider: 'resend' | 'console-log'
  sent_at: string
}

export interface SendEmailInput {
  to: string
  subject: string
  html: string
  category?: NotificationCategory
}

export interface SendEmailResult {
  ok: boolean
  provider: 'resend' | 'console-log'
  messageId?: string
  error?: string
  record: SentEmailRecord
}

const DATA_DIR = path.join(process.cwd(), 'data')
const EMAIL_LOG_PATH = path.join(DATA_DIR, 'emails.json')

export function readSentEmails(): SentEmailRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(EMAIL_LOG_PATH)) {
      return []
    }
    return JSON.parse(fs.readFileSync(EMAIL_LOG_PATH, 'utf8')) as SentEmailRecord[]
  } catch {
    return []
  }
}

function appendSentEmail(record: SentEmailRecord) {
  try {
    const existing = readSentEmails()
    const updated = [record, ...existing].slice(0, 100)
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(EMAIL_LOG_PATH, JSON.stringify(updated, null, 2), 'utf8')
  } catch {
    // Ignore file write errors
  }
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
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: #f59e0b; padding: 18px 24px; color: #ffffff; font-weight: bold; font-size: 18px;">
        🏗️ ConstructMS — Construction Management System
      </div>
      <div style="padding: 24px; color: #1f2937; line-height: 1.6;">
        <h2 style="margin-top: 0; color: #111827; font-size: 18px;">${heading}</h2>
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
  category = 'email_confirmation',
}: SendEmailInput): Promise<SendEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromAddress =
    process.env.EMAIL_FROM || 'ConstructMS <onboarding@resend.dev>'

  let provider: 'resend' | 'console-log' = 'console-log'
  let messageId = `local-${Date.now()}`
  let errorMsg: string | undefined

  if (resendApiKey) {
    provider = 'resend'
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
        errorMsg = data?.message || 'Failed to send email via Resend'
      } else {
        messageId = data.id
      }
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Unknown email error'
    }
  } else {
    console.log(`[sendEmail -> ${to}] (${category}) Subject: ${subject}`)
  }

  const record: SentEmailRecord = {
    id: `eml-${randomUUID().slice(0, 8)}`,
    category,
    to,
    subject,
    html,
    provider,
    sent_at: new Date().toISOString(),
  }

  appendSentEmail(record)

  return {
    ok: !errorMsg,
    provider,
    messageId,
    error: errorMsg,
    record,
  }
}
