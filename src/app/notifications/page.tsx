import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { readSentEmails } from '@/lib/email'
import AppShell from '@/components/layout/AppShell'
import ModuleLoadingSkeleton from '@/components/layout/ModuleLoadingSkeleton'
import EmailNotificationsClient from '@/components/notifications/EmailNotificationsClient'

export const metadata = {
  title: 'Email Notifications | Construction Management System',
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton title="Loading Email Notifications…" />}>
      <NotificationsContent />
    </Suspense>
  )
}

async function NotificationsContent() {
  const user = await requireAuth()
  const emails = readSentEmails()

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Section 12: Email Notifications Center
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Reuse <code>sendEmail(to, subject, html)</code> for Welcome emails, Password resets,
            Task assignments, Low-stock alerts, Approval notices, and Weekly Client Reports.
          </p>
        </div>

        <EmailNotificationsClient userEmail={user.email} initialEmails={emails} />
      </div>
    </AppShell>
  )
}

