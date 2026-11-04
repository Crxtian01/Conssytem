'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ScreenSpec {
  id: string
  number: number
  title: string
  route: string
  icon: string
  mobileFocus: string
  wireframeElements: string[]
}

const SCREEN_DESIGNS: ScreenSpec[] = [
  {
    id: 'login',
    number: 1,
    title: 'Login (Continue with Google) & Email Confirmation Notice',
    route: '/login',
    icon: '🔐',
    mobileFocus: 'One-thumb Google OAuth button, clear email/password inputs, and 60s resend timer.',
    wireframeElements: [
      'App Logo & Title ("ConstructMS")',
      '"Continue with Google" full-width OAuth button',
      'Email & Password fields + Create Account toggle',
      'Email Confirmation Notice banner with 60s Resend button',
    ],
  },
  {
    id: 'dashboard',
    number: 2,
    title: 'Dashboard',
    route: '/',
    icon: '📊',
    mobileFocus: '2x2 KPI summary cards on mobile, quick project progress bars, and low-stock alerts.',
    wireframeElements: [
      'Role Badge & Welcome Header',
      'KPI Cards: Active Projects, Tasks Due, Low-Stock Alerts, Pending Expenses',
      'Project Progress % Bars',
      'Recent Site Activity & Quick Action Buttons',
    ],
  },
  {
    id: 'projects',
    number: 3,
    title: 'Project List & Project Details',
    route: '/projects',
    icon: '🏗️',
    mobileFocus: 'Stacked project cards with location pin, status badge, progress bar, and budget summary.',
    wireframeElements: [
      'Filter by Status (Planning, Active, On Hold, Completed)',
      'New Project Modal / Drawer (Manager & Admin)',
      'Project Card: Name, Site Location, Start/End Dates, Progress %',
      'Project Details Tabs: Members, Tasks, Daily Logs, Expenses, Documents',
    ],
  },
  {
    id: 'tasks',
    number: 4,
    title: 'Task Board',
    route: '/tasks',
    icon: '✅',
    mobileFocus: 'Swipeable status tabs (To Do, In Progress, Review, Completed) + slider for % complete.',
    wireframeElements: [
      'Project Filter & Status Columns (To Do / In Progress / Review / Done)',
      'Task Card: Title, Assigned Worker, Due Date, Progress Slider (0–100%)',
      'Photo attachment preview for completed tasks',
      'One-tap status update for site foremen & workers',
    ],
  },
  {
    id: 'materials',
    number: 5,
    title: 'Materials & Inventory',
    route: '/materials',
    icon: '🧱',
    mobileFocus: 'Fast Stock IN / Stock OUT buttons for storekeepers on site phones + red low-stock badges.',
    wireframeElements: [
      'Low-Stock Warning Banner (when current_stock <= reorder_level)',
      'Quick "+ Stock In" and "- Stock Out" transaction modal',
      'Inventory List: Material Name, Unit (bags/kg/pcs), Current Stock, Reorder Level',
      'Material Transaction History log by Project & Date',
    ],
  },
  {
    id: 'attendance',
    number: 6,
    title: 'Attendance & Workers',
    route: '/attendance',
    icon: '👷',
    mobileFocus: 'Date picker + one-tap Present / Half-Day / Absent toggle and hours input per worker.',
    wireframeElements: [
      'Project Site & Date Selector (defaults to Today)',
      'Worker Roster with Trade (Mason, Carpenter, Electrician) & Daily Rate',
      'Quick Hours Worked input (8h default) & Present/Absent toggle',
      'Daily Labor Summary (Total Workers Present & Total Hours)',
    ],
  },
  {
    id: 'expenses',
    number: 7,
    title: 'Expenses & Budget',
    route: '/expenses',
    icon: '💰',
    mobileFocus: 'Budget vs. Actual progress bar + Approve / Reject buttons for Project Managers.',
    wireframeElements: [
      'Project Budget vs. Actual Spent meter (hidden from Worker role)',
      'Log Expense Form: Project, Category, Amount, Date, Description',
      'Approval Queue: Pending / Approved / Rejected badges',
      'One-tap Approve / Reject controls (Manager & Admin only)',
    ],
  },
  {
    id: 'daily-logs',
    number: 8,
    title: 'Daily Log Form (with Photos)',
    route: '/daily-logs',
    icon: '📝',
    mobileFocus: 'Designed for site foremen on phones: weather selector, voice/text notes, and camera photo upload.',
    wireframeElements: [
      'Project & Date Selector',
      'Weather Condition Pills (☀️ Sunny, ⛅ Cloudy, 🌧️ Rainy, ⛈️ Stormy)',
      'Site Progress & Safety Notes textarea',
      'Site Photo Upload / URL attachment & chronological feed',
    ],
  },
  {
    id: 'reports',
    number: 9,
    title: 'Reports & Export',
    route: '/reports',
    icon: '📈',
    mobileFocus: 'Clean summary tables with one-tap Export to CSV/Excel and Printable PDF view.',
    wireframeElements: [
      'Project Progress & Task Completion Summary',
      'Budget vs. Actual Cost Breakdown per Project',
      'Low-Stock Material Alert Report & Attendance Hours Summary',
      'Export to Excel (CSV) & Print / Save as PDF buttons',
    ],
  },
]

export default function ScreenDesignShowcase() {
  const [selectedScreen, setSelectedScreen] = useState<ScreenSpec>(SCREEN_DESIGNS[0])
  const [viewport, setViewport] = useState<'mobile' | 'desktop'>('mobile')

  return (
    <div className="space-y-8">
      {/* Section 5: Interactive Phone-First Wireframe Studio */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Section 5: Phone-First Screen Design (All 9 Core Screens)
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              &ldquo;Design for phones first, because site staff will mostly use them.&rdquo; Select
              any screen below to inspect its mobile wireframe and open the live route.
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`rounded-md px-3 py-1.5 transition ${
                viewport === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              📱 Phone View (375px)
            </button>
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`rounded-md px-3 py-1.5 transition ${
                viewport === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              💻 Desktop View
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Screen Selector List */}
          <div className="space-y-2 lg:col-span-5">
            {SCREEN_DESIGNS.map((scr) => {
              const active = scr.id === selectedScreen.id
              return (
                <button
                  key={scr.id}
                  type="button"
                  onClick={() => setSelectedScreen(scr)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition ${
                    active
                      ? 'border-amber-500 bg-amber-50/70 shadow-sm'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-lg">
                      {scr.icon}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-amber-700">Screen #{scr.number}</p>
                      <p className="text-sm font-bold text-gray-900">{scr.title}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-gray-400">{scr.route}</span>
                </button>
              )
            })}
          </div>

          {/* Interactive Phone/Desktop Wireframe Mockup */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 p-6 lg:col-span-7">
            <div
              className={`w-full transition-all ${
                viewport === 'mobile'
                  ? 'max-w-[360px] rounded-[32px] border-[6px] border-gray-800 bg-white shadow-xl'
                  : 'max-w-full rounded-2xl border-2 border-gray-700 bg-white shadow-lg'
              } overflow-hidden`}
            >
              {/* Mock Phone Status Bar */}
              <div className="flex items-center justify-between bg-gray-900 px-4 py-2 text-[11px] font-medium text-white">
                <span>9:41 AM</span>
                <span>ConstructMS • {viewport === 'mobile' ? 'Mobile' : 'Desktop'}</span>
                <span>5G 🔋</span>
              </div>

              {/* Mock App Top Bar */}
              <div className="flex items-center justify-between border-b border-gray-200 bg-amber-500 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <span>{selectedScreen.icon}</span>
                  <span className="text-sm font-bold truncate">{selectedScreen.title}</span>
                </div>
                <span className="rounded bg-white/20 px-2 py-0.5 font-mono text-[10px]">
                  {selectedScreen.route}
                </span>
              </div>

              {/* Wireframe Body */}
              <div className="space-y-3 p-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <strong>Phone-First UX Focus:</strong> {selectedScreen.mobileFocus}
                </div>

                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Wireframe Components
                </p>

                {selectedScreen.wireframeElements.map((el, i) => (
                  <div
                    key={el}
                    className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                      {i + 1}
                    </span>
                    <span className="text-xs font-medium text-gray-800">{el}</span>
                  </div>
                ))}

                <div className="pt-2">
                  <Link
                    href={selectedScreen.route}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
                  >
                    Open Live Screen ({selectedScreen.route}) →
                  </Link>
                </div>
              </div>

              {/* Mock Mobile Bottom Bar */}
              <div className="grid grid-cols-5 border-t border-gray-200 bg-gray-50 py-2 text-center text-[10px] text-gray-500">
                <div>📊 Home</div>
                <div>🏗️ Projects</div>
                <div>📝 Logs</div>
                <div>✅ Tasks</div>
                <div>👷 Crew</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Technology Stack */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Section 6: Technology Stack</h2>
        <p className="mt-1 text-sm text-gray-500">
          Chosen stack combining Next.js (React) with Supabase for authentication, PostgreSQL
          database, and email delivery.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 p-4">
            <span className="text-xs font-bold uppercase text-amber-600">Frontend</span>
            <h3 className="mt-1 font-bold text-gray-900">Next.js 16 + React 19</h3>
            <p className="mt-1 text-xs text-gray-600">
              App Router, TypeScript, Tailwind CSS v4, mobile-first responsive components.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <span className="text-xs font-bold uppercase text-amber-600">Backend &amp; API</span>
            <h3 className="mt-1 font-bold text-gray-900">Next.js Route Handlers</h3>
            <p className="mt-1 text-xs text-gray-600">
              Server-side API routes with role-based access enforcement (`requireRole`).
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <span className="text-xs font-bold uppercase text-amber-600">Database &amp; Auth</span>
            <h3 className="mt-1 font-bold text-gray-900">Supabase (PostgreSQL)</h3>
            <p className="mt-1 text-xs text-gray-600">
              13 relational tables with Row Level Security, Google OAuth, and email confirmation.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <span className="text-xs font-bold uppercase text-amber-600">Email Service</span>
            <h3 className="mt-1 font-bold text-gray-900">Supabase Mailer + Resend</h3>
            <p className="mt-1 text-xs text-gray-600">
              Built-in confirmation emails + reusable `sendEmail(to, subject, html)` helper.
            </p>
          </div>
        </div>
      </section>

      {/* Section 7: Project Setup Checklist & Reusable Concern Modules */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Section 7: Project Setup &amp; Reusable Architecture
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          &ldquo;Keep one reusable place for each concern: database access, email sending, and
          authentication.&rdquo;
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-3 pr-4">Concern (Section 7)</th>
                <th className="py-3 px-4">Reusable File</th>
                <th className="py-3 px-4">Key Exports</th>
                <th className="py-3 pl-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-3 pr-4 font-semibold text-gray-900">Database Access</td>
                <td className="py-3 px-4 font-mono text-xs text-gray-700">src/lib/db.ts</td>
                <td className="py-3 px-4 font-mono text-xs text-gray-600">
                  getSessionDb(), getAdminDb()
                </td>
                <td className="py-3 pl-4">
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                    Active ✅
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-gray-900">Authentication &amp; Roles</td>
                <td className="py-3 px-4 font-mono text-xs text-gray-700">src/lib/auth.ts</td>
                <td className="py-3 px-4 font-mono text-xs text-gray-600">
                  requireAuth(), requireRole()
                </td>
                <td className="py-3 pl-4">
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                    Active ✅
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-gray-900">Email Sending</td>
                <td className="py-3 px-4 font-mono text-xs text-gray-700">src/lib/email.ts</td>
                <td className="py-3 px-4 font-mono text-xs text-gray-600">
                  sendEmail(to, subject, html), buildBrandedEmailHtml()
                </td>
                <td className="py-3 pl-4">
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                    Active ✅
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-gray-900">
                  Secrets &amp; Git Hygiene
                </td>
                <td className="py-3 px-4 font-mono text-xs text-gray-700">
                  .env.local / .env.example / .gitignore
                </td>
                <td className="py-3 px-4 font-mono text-xs text-gray-600">
                  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
                </td>
                <td className="py-3 pl-4">
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                    Active ✅
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

