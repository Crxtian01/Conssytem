'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface NotificationEmailCardProps {
  primaryEmail: string
  verifiedNotificationEmail: string | null
  pendingNotificationEmail: string | null
}

export default function NotificationEmailCard({
  primaryEmail,
  verifiedNotificationEmail,
  pendingNotificationEmail,
}: NotificationEmailCardProps) {
  const router = useRouter()
  const [selectedEmail, setSelectedEmail] = useState(
    pendingNotificationEmail || verifiedNotificationEmail || primaryEmail
  )
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    targetEmail: string
    verifyUrl: string
    expiresAt: string
    emailProvider: string
    emailPreviewHtml: string
  } | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const activeNotificationEmail = verifiedNotificationEmail || primaryEmail

  async function handleSendConfirmation(e: React.FormEvent) {
    e.preventDefault()
    if (cooldown > 0 || sending) return
    setSending(true)
    setError(null)
    setResult(null)

    const res = await fetch('/api/email/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetEmail: selectedEmail }),
    })
    const data = await res.json()
    setSending(false)

    if (!res.ok) {
      setError(data.error || 'Failed to send confirmation link')
      return
    }

    setResult(data)
    setCooldown(60)
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Section 10: Email for Notifications &amp; Confirmation Flow
          </h2>
          <p className="text-xs text-gray-500">
            Choose which email address receives system confirmations, task notices, and reports.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          Active Notification Email: {activeNotificationEmail} ✅
        </span>
      </div>

      {pendingNotificationEmail && !result && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          ⏳ Pending verification for <strong>{pendingNotificationEmail}</strong>. Until you click
          the confirmation link, notifications continue going to{' '}
          <strong>{activeNotificationEmail}</strong>.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSendConfirmation} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="notifEmail" className="sr-only">
            Email for notifications
          </label>
          <input
            id="notifEmail"
            type="email"
            required
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
            placeholder="Enter email for notifications"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <button
          type="submit"
          disabled={sending || cooldown > 0}
          className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50 whitespace-nowrap"
        >
          {sending
            ? 'Sending…'
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Send Confirmation Link'}
        </button>
      </form>

      {result && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3 text-xs">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-bold text-amber-950">
              ✉️ Confirmation Link Generated for <code>{result.targetEmail}</code> (Expires in 24h)
            </p>
            <a
              href={result.verifyUrl}
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
            >
              Click to Verify Now →
            </a>
          </div>
          <p className="text-amber-900">
            Below is the exact branded confirmation email sent by <code>sendEmail()</code> (Section
            10):
          </p>
          <div
            className="rounded-lg bg-white p-3 shadow-inner border border-gray-200"
            dangerouslySetInnerHTML={{ __html: result.emailPreviewHtml }}
          />
        </div>
      )}
    </div>
  )
}
