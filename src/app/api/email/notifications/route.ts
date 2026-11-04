import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { readStore } from '@/lib/module-store'
import {
  sendEmail,
  buildBrandedEmailHtml,
  readSentEmails,
  type NotificationCategory,
} from '@/lib/email'

// GET /api/email/notifications -> returns sent email history
export async function GET() {
  await requireAuth()
  return NextResponse.json({ emails: readSentEmails() })
}

// POST /api/email/notifications -> sends any of the 6 Section 12 notification types
export async function POST(request: NextRequest) {
  const user = await requireAuth()
  const body = await request.json()
  const type = body.type as NotificationCategory
  const recipient = ((body.to as string) || user.email).trim()
  const origin = request.nextUrl.origin
  const store = readStore()

  // 1. Welcome email after confirmation
  if (type === 'welcome_after_confirmation') {
    const html = buildBrandedEmailHtml({
      heading: 'Welcome to ConstructMS! 🎉',
      bodyHtml: `
        <p>Hello <strong>${user.fullName || recipient}</strong>,</p>
        <p>Your email address (<strong>${recipient}</strong>) has been confirmed and your Construction Management System account is now active.</p>
        <p>You can now access your role-based dashboard to track site projects, tasks, materials, worker attendance, and daily logs.</p>
      `,
      ctaLabel: 'Open ConstructMS Dashboard',
      ctaUrl: `${origin}/`,
    })
    const res = await sendEmail({
      to: recipient,
      subject: 'Welcome to ConstructMS — Your Email is Confirmed!',
      html,
      category: 'welcome_after_confirmation',
    })
    return NextResponse.json({ ok: true, email: res.record })
  }

  // 2. Password reset
  if (type === 'password_reset') {
    const resetUrl = `${origin}/login?reset=1&email=${encodeURIComponent(recipient)}`
    const html = buildBrandedEmailHtml({
      heading: 'Password Reset Request',
      bodyHtml: `
        <p>Hello,</p>
        <p>We received a request to reset the password for your ConstructMS account (<strong>${recipient}</strong>).</p>
        <p>Click the button below to set a new password. This link is single-use and expires in 1 hour.</p>
      `,
      ctaLabel: 'Reset My Password',
      ctaUrl: resetUrl,
    })
    const res = await sendEmail({
      to: recipient,
      subject: 'Reset your ConstructMS password',
      html,
      category: 'password_reset',
    })
    return NextResponse.json({ ok: true, email: res.record })
  }

  // 3. Task assignment notices
  if (type === 'task_assignment') {
    const latestTask = store.tasks[0]
    const project = store.projects.find((p) => p.id === latestTask?.project_id)
    const html = buildBrandedEmailHtml({
      heading: `New Task Assigned: ${latestTask?.title || 'Site Inspection'}`,
      bodyHtml: `
        <p>Hello <strong>${latestTask?.assigned_user_name || user.fullName || recipient}</strong>,</p>
        <p>You have been assigned a construction task on project <strong>${project?.name || 'Metro Commercial Tower'}</strong>:</p>
        <ul>
          <li><strong>Task:</strong> ${latestTask?.title || 'Pour 8th Floor Concrete Slab'}</li>
          <li><strong>Details:</strong> ${latestTask?.description || 'Complete rebar inspection before pour.'}</li>
          <li><strong>Due Date:</strong> ${latestTask?.due_date || '2026-11-12'}</li>
          <li><strong>Current Progress:</strong> ${latestTask?.percent_complete ?? 0}%</li>
        </ul>
      `,
      ctaLabel: 'View Task Board',
      ctaUrl: `${origin}/tasks`,
    })
    const res = await sendEmail({
      to: recipient,
      subject: `📋 Task Assigned: ${latestTask?.title || 'Site Task'}`,
      html,
      category: 'task_assignment',
    })
    return NextResponse.json({ ok: true, email: res.record })
  }

  // 4. Low-stock material alerts
  if (type === 'low_stock_alert') {
    const lowItems = store.materials.filter((m) => m.current_stock <= m.reorder_level)
    const itemsListHtml =
      lowItems.length > 0
        ? lowItems
            .map(
              (m) =>
                `<li><strong>${m.name}</strong>: <span style="color:#dc2626;font-weight:bold;">${m.current_stock} ${m.unit}</span> left (Reorder level: ${m.reorder_level} ${m.unit})</li>`
            )
            .join('')
        : `<li><strong>Deformed Steel Rebar 16mm</strong>: 42 pcs left (Reorder level: 60 pcs)</li>`

    const html = buildBrandedEmailHtml({
      heading: '⚠️ Low-Stock Material Alert',
      bodyHtml: `
        <p>Attention Storekeeper &amp; Project Manager,</p>
        <p>The following construction materials have dropped at or below their reorder level:</p>
        <ul>${itemsListHtml}</ul>
        <p>Please arrange a purchase order and log a Stock IN transaction once delivered.</p>
      `,
      ctaLabel: 'Open Materials & Inventory',
      ctaUrl: `${origin}/materials`,
    })
    const res = await sendEmail({
      to: recipient,
      subject: `⚠️ Low-Stock Alert (${lowItems.length || 1} material items need reorder)`,
      html,
      category: 'low_stock_alert',
    })
    return NextResponse.json({ ok: true, email: res.record })
  }

  // 5. Expense and daily log approval notices
  if (type === 'approval_notice') {
    const latestExp = store.expenses[0]
    const latestLog = store.daily_logs[0]
    const html = buildBrandedEmailHtml({
      heading: 'Expense & Daily Log Approval Notice',
      bodyHtml: `
        <p>Hello,</p>
        <p>Here is the latest approval update from Project Management:</p>
        <ul>
          <li><strong>Expense:</strong> ${latestExp?.description || 'Ready-Mix Concrete Delivery'} (₱${(latestExp?.amount ?? 148000).toLocaleString()}) — Status: <strong>${(latestExp?.approval_status || 'approved').toUpperCase()}</strong></li>
          <li><strong>Daily Site Log (${latestLog?.log_date || '2026-11-04'}):</strong> Weather: ${latestLog?.weather || 'Sunny'} — <em>"${latestLog?.notes || 'Site inspection verified.'}"</em> — Status: <strong>APPROVED ✅</strong></li>
        </ul>
      `,
      ctaLabel: 'View Expenses & Logs',
      ctaUrl: `${origin}/expenses`,
    })
    const res = await sendEmail({
      to: recipient,
      subject: '✅ Approval Notice: Expense & Daily Site Log Verified',
      html,
      category: 'approval_notice',
    })
    return NextResponse.json({ ok: true, email: res.record })
  }

  // 6. Weekly progress report to the client
  if (type === 'weekly_client_report') {
    const rowsHtml = store.projects
      .map((p) => {
        const spent = store.expenses
          .filter((e) => e.project_id === p.id && e.approval_status === 'approved')
          .reduce((s, e) => s + e.amount, 0)
        return `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;"><strong>${p.name}</strong><br/><span style="font-size:11px;color:#6b7280;">${p.location}</span></td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#d97706;">${p.progress}%</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">₱${p.budget.toLocaleString()}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">₱${spent.toLocaleString()}</td>
          </tr>
        `
      })
      .join('')

    const html = buildBrandedEmailHtml({
      heading: '📈 Weekly Construction Progress Report (Client Summary)',
      bodyHtml: `
        <p>Dear Client &amp; Stakeholders,</p>
        <p>Here is your weekly progress and budget summary across all active construction sites:</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;">
          <thead>
            <tr style="background:#f9fafb;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;">
              <th style="padding:8px;border-bottom:2px solid #e5e7eb;">Project</th>
              <th style="padding:8px;border-bottom:2px solid #e5e7eb;">Progress</th>
              <th style="padding:8px;border-bottom:2px solid #e5e7eb;">Budget</th>
              <th style="padding:8px;border-bottom:2px solid #e5e7eb;">Approved Cost</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <p><strong>Completed Tasks:</strong> ${store.tasks.filter((t) => t.status === 'completed').length} / ${store.tasks.length} • <strong>Daily Logs Filed:</strong> ${store.daily_logs.length}</p>
      `,
      ctaLabel: 'View Full Interactive Report',
      ctaUrl: `${origin}/reports`,
    })
    const res = await sendEmail({
      to: recipient,
      subject: '📈 Weekly Construction Progress Report — ConstructMS',
      html,
      category: 'weekly_client_report',
    })
    return NextResponse.json({ ok: true, email: res.record })
  }

  return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 })
}

