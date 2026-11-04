'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SentEmailRecord, NotificationCategory } from '@/lib/email'

interface NotificationSpec {
  type: NotificationCategory
  number: number
  title: string
  icon: string
  triggerDescription: string
}

const SECTION_12_NOTIFICATIONS: NotificationSpec[] = [
  {
    type: 'welcome_after_confirmation',
    number: 1,
    title: 'Welcome Email After Confirmation',
    icon: '🎉',
    triggerDescription:
      'Sent automatically as soon as a new user confirms their email token.',
  },
  {
    type: 'password_reset',
    number: 2,
    title: 'Password Reset Notice',
    icon: '🔑',
    triggerDescription:
      'Sends a single-use password reset link when a user clicks Forgot Password.',
  },
  {
    type: 'task_assignment',
    number: 3,
    title: 'Task Assignment Notice',
    icon: '📋',
    triggerDescription:
      'Sent automatically when an Engineer, Foreman, or Manager assigns a task on /tasks.',
  },
  {
    type: 'low_stock_alert',
    number: 4,
    title: 'Low-Stock Material Alert',
    icon: '⚠️',
    triggerDescription:
      'Sent automatically when a Stock OUT transaction drops current_stock <= reorder_level on /materials.',
  },
  {
    type: 'approval_notice',
    number: 5,
    title: 'Expense & Daily Log Approval Notice',
    icon: '✅',
    triggerDescription:
      'Sent automatically when a Project Manager or Admin approves/rejects an expense or daily log.',
  },
  {
    type: 'weekly_client_report',
    number: 6,
    title: 'Weekly Progress Report to the Client',
    icon: '📈',
    triggerDescription:
      'Compiles live project progress %, budget vs. actual cost, and task completion for the client.',
  },
]

export default function EmailNotificationsClient({
  userEmail,
  initialEmails,
}: {
  userEmail: string
  initialEmails: SentEmailRecord[]
}) {
  const router = useRouter()
  const [recipient, setRecipient] = useState(userEmail)
  const [emails, setEmails] = useState<SentEmailRecord[]>(initialEmails)
  const [sendingType, setSendingType] = useState<NotificationCategory | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<SentEmailRecord | null>(
    initialEmails[0] ?? null
  )
  const [banner, setBanner] = useState<string | null>(null)

  async function handleSendNotification(type: NotificationCategory) {
    setSendingType(type)
    setBanner(null)
    const res = await fetch('/api/email/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, to: recipient }),
    })
    const data = await res.json()
    setSendingType(null)

    if (res.ok && data.email) {
      setEmails([data.email, ...emails])
      setSelectedEmail(data.email)
      setBanner(`✉️ Sent "${data.email.subject}" to ${data.email.to}!`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-8">
      {banner && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
          {banner}
        </div>
      )}

      {/* Recipient Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            Target Recipient for Notification Tests
          </h2>
          <p className="text-xs text-gray-500">
            All 6 notification types reuse <code>sendEmail(to, subject, html)</code> from{' '}
            <code>src/lib/email.ts</code>.
          </p>
        </div>
        <input
          type="email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="w-full sm:w-80 rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* All 6 Notification Cards from Section 12 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTION_12_NOTIFICATIONS.map((item) => (
          <div
            key={item.type}
            className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-xl">
                  {item.icon}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                  Section 12 #{item.number}
                </span>
              </div>
              <h3 className="mt-3 font-bold text-gray-900">{item.title}</h3>
              <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                {item.triggerDescription}
              </p>
            </div>

            <button
              type="button"
              disabled={sendingType === item.type}
              onClick={() => handleSendNotification(item.type)}
              className="w-full rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
            >
              {sendingType === item.type ? 'Sending…' : `Send & Preview "${item.title}"`}
            </button>
          </div>
        ))}
      </div>

      {/* Sent Emails Outbox & Live HTML Preview */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-5 space-y-3">
          <h2 className="text-base font-bold text-gray-900">
            Sent Email Outbox ({emails.length})
          </h2>
          {emails.length === 0 ? (
            <p className="text-xs text-gray-500">
              No emails logged yet. Click any button above to trigger and preview a notification!
            </p>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {emails.map((em) => {
                const active = selectedEmail?.id === em.id
                return (
                  <button
                    key={em.id}
                    type="button"
                    onClick={() => setSelectedEmail(em)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      active
                        ? 'border-amber-500 bg-amber-50/70'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span className="font-mono uppercase text-amber-700 font-semibold">
                        {em.category.replace(/_/g, ' ')}
                      </span>
                      <span>{em.sent_at.slice(0, 19).replace('T', ' ')}</span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-gray-900 truncate">{em.subject}</p>
                    <p className="text-[11px] text-gray-500 truncate">To: {em.to}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-7 space-y-3">
          <h2 className="text-base font-bold text-gray-900">Live Branded Email Preview</h2>
          {selectedEmail ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-50 p-3 text-xs space-y-1 border border-gray-200">
                <p>
                  <strong>To:</strong> {selectedEmail.to}
                </p>
                <p>
                  <strong>Subject:</strong> {selectedEmail.subject}
                </p>
                <p>
                  <strong>Category:</strong> <code>{selectedEmail.category}</code>
                </p>
              </div>
              <div
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
              />
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Select or send an email notification to inspect its HTML content.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
