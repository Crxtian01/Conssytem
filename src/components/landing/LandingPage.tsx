import Link from 'next/link'

interface LandingPageProps {
  isSignedIn?: boolean
  userEmail?: string | null
}

const FEATURE_CARDS = [
  {
    icon: '🔨',
    badge: 'RA 12009 Compliant',
    title: 'Bidding & Procurement Pipeline',
    description:
      'Step-by-step Philippine Government & private bidding: ABC vs. BOQ ceiling checks, NFCC calculator, 2-Envelope checklist, Guided Beginner Mode, and 1-click conversion of awarded bids into active projects.',
  },
  {
    icon: '🏗️',
    badge: 'Multi-Site Control',
    title: 'Projects, Tasks & Daily Site Logs',
    description:
      'Monitor active construction sites, milestone completion percentages, weather conditions, field notes, and daily progress photos from mobile or desktop.',
  },
  {
    icon: '🧱',
    badge: 'Real-Time Alerts',
    title: 'Materials, Inventory & Equipment',
    description:
      'Track stock-in/stock-out transactions, automatic low-stock email alerts when materials hit reorder levels, and heavy machinery deployment across sites.',
  },
  {
    icon: '👷',
    badge: 'Field Workforce',
    title: 'Workers, Attendance & Payroll Rates',
    description:
      'Log daily worker attendance (Present, Half-Day, Absent), trade classifications, hours worked, and daily labor cost summaries per project.',
  },
  {
    icon: '💰',
    badge: 'Financial Governance',
    title: 'Budgets, Expenses & Engineer Approvals',
    description:
      'Compare Approved Budget vs. Actual Spend in real time. Field expenses require Admin / Engineer sign-off with instant email approval notifications.',
  },
  {
    icon: '📈',
    badge: 'Executive Analytics',
    title: 'Documents, Reports & CSV/Print Export',
    description:
      'Centralized blueprint/permit repository plus one-click executive progress reports and client-ready financial summaries.',
  },
]

const ROLE_CARDS = [
  {
    role: 'Admin / Engineer',
    modules: '15 Allowed Modules',
    color: 'border-purple-200 bg-purple-50/60 text-purple-900',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    desc: 'Full authority across all modules: Projects, RA 12009 Bid Approval & Contract Award, Budget & Expense Approvals, Engineering Tasks, and User Role Management.',
  },
  {
    role: 'Assistant',
    modules: '15 Allowed Modules',
    color: 'border-blue-200 bg-blue-50/60 text-blue-900',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    desc: 'Assists Admin/Engineer across all 15 modules including Bid Preparation (Draft, BOQ Estimating & RA 12009 Checklist), Documents, Inventory, and Reports.',
  },
  {
    role: 'Contractor',
    modules: '6 Site Modules Only',
    color: 'border-amber-200 bg-amber-50/60 text-amber-900',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    desc: 'Strictly scoped to field execution: Dashboard, Tasks & Progress, Daily Logs, Materials & Inventory, Workers & Attendance, and Equipment.',
  },
  {
    role: 'Client',
    modules: '5 Monitoring Modules Only',
    color: 'border-indigo-200 bg-indigo-50/60 text-indigo-900',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    desc: 'Read-only project owner portal: Dashboard KPIs, Projects & Sites, Daily Site Logs with photos, Blueprints/Documents, and Progress Reports.',
  },
]

export default function LandingPage({ isSignedIn = false, userEmail }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-xl shadow-sm">
              🏗️
            </span>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">
                ConstructMS
              </span>
              <span className="hidden sm:inline-block ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                Site, Bidding &amp; Project System
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-amber-600 transition">
              Core Modules
            </a>
            <a href="#bidding" className="hover:text-amber-600 transition">
              RA 12009 Bidding
            </a>
            <a href="#roles" className="hover:text-amber-600 transition">
              4-Role Security
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {isSignedIn ? (
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition"
              >
                <span>Go to Dashboard</span>
                <span>→</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/70 via-white to-white pt-12 pb-20 sm:pt-16 sm:pb-24 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Headline & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100/80 px-3.5 py-1 text-xs font-bold text-amber-950">
                <span>⚖️ Built for Philippine Construction &amp; RA 12009 Procurement</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl leading-tight">
                Manage Bids, Construction Sites, Materials &amp; Budgets in{' '}
                <span className="text-amber-600">One Unified Platform.</span>
              </h1>

              <p className="max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
                <strong>ConstructMS</strong> connects your engineering office, field contractors,
                and project clients—from <strong>RA 12009 Bid Preparation &amp; BOQ Estimating</strong>{' '}
                all the way to daily site logs, worker attendance, low-stock alerts, and executive
                budget approvals.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {isSignedIn ? (
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-amber-700 transition"
                  >
                    Open Your Dashboard ({userEmail}) →
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-amber-700 transition"
                    >
                      Sign In to ConstructMS →
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-sm font-bold text-gray-800 hover:bg-gray-50 transition"
                    >
                      Create New Account
                    </Link>
                  </>
                )}
              </div>

              {/* Quick Trust Pills */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 max-w-lg text-xs">
                <div>
                  <p className="text-lg font-extrabold text-gray-900">15 Modules</p>
                  <p className="text-gray-500">End-to-End Workflow</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-amber-700">RA 12009</p>
                  <p className="text-gray-500">2-Envelope &amp; NFCC Ready</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-gray-900">4 Roles</p>
                  <p className="text-gray-500">Strict RLS Protection</p>
                </div>
              </div>
            </div>

            {/* Right Column: Live System Preview Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-bold text-gray-700">
                      ConstructMS Live Executive Preview
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    Supabase RLS Active
                  </span>
                </div>

                {/* Sample KPI Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
                    <p className="text-[11px] font-semibold text-amber-900">
                      Active Projects &amp; Bids
                    </p>
                    <p className="mt-1 text-xl font-extrabold text-gray-900">₱41.7M ABC</p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      ✓ 1 Awarded Bid Ready to Convert
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3.5">
                    <p className="text-[11px] font-semibold text-gray-600">
                      Overall Site Completion
                    </p>
                    <p className="mt-1 text-xl font-extrabold text-gray-900">68% Avg</p>
                    <p className="text-[11px] text-gray-500">Across active sites</p>
                  </div>
                </div>

                {/* Sample Pipeline List */}
                <div className="space-y-2.5 text-xs">
                  <div className="rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">
                        ITB-2026-DEPED-089 • Science Bldg Retrofitting
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Bid: ₱8,795,000 (4.4% below ABC) • NFCC Qualified
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      AWARDED
                    </span>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">
                        Metro Commercial Tower Phase 1
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Makati CBD • 8th Floor Rebar &amp; Slab Pouring
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                      62% DONE
                    </span>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-amber-950">
                        Low-Stock Alert: Portland Cement (40kg)
                      </p>
                      <p className="text-[11px] text-amber-800">
                        Current: 85 bags (Reorder level: 100 bags)
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-950">
                      ALERT SENT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Modules Grid */}
      <section id="features" className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Complete Construction ERP
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
              Everything Your Construction Team Needs from Bid to Turnover
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Designed for phones on the jobsite and large monitors in the engineering office.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:border-amber-400 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-2xl">
                      {card.icon}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-gray-900">{card.title}</h3>
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RA 12009 Bidding Highlight Section */}
      <section id="bidding" className="py-16 bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="inline-block rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-1 text-xs font-bold text-amber-300">
                New Module • RA 12009 Procurement Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Guided Philippine Construction Bidding—Built for Both Beginners &amp; Seasoned Engineers
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Never miss a mandatory document in your Technical or Financial Envelope again.
                ConstructMS automatically checks your BOQ total against the Approved Budget for the
                Contract (ABC), computes your NFCC, and converts awarded bids into active projects
                in one click.
              </p>
            </div>

            <div className="lg:col-span-6 grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-2xl border border-gray-800 bg-gray-800/80 p-4">
                <p className="font-bold text-amber-400">1. ABC &amp; NFCC Guardrails</p>
                <p className="mt-1 text-gray-300">
                  Warns you immediately if your computed bid exceeds the ABC ceiling or if NFCC is
                  below requirement.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-800/80 p-4">
                <p className="font-bold text-amber-400">2. DUPA / BOQ Cost Estimator</p>
                <p className="mt-1 text-gray-300">
                  Calculates Direct Costs (Materials, Labor, Equipment) + configurable OCM %,
                  Profit %, and VAT %.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-800/80 p-4">
                <p className="font-bold text-amber-400">3. Two-Envelope Checklist</p>
                <p className="mt-1 text-gray-300">
                  Pre-loaded with PhilGEPS Platinum, PCAB, SLCC, NFCC, Bid Security, OSS, Priced
                  BOQ, and Cash Flow.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-800/80 p-4">
                <p className="font-bold text-amber-400">4. Award → Project Conversion</p>
                <p className="mt-1 text-gray-300">
                  Once Admin / Engineer records the Notice of Award, convert the bid into an active
                  project in 1 click.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 System Roles Section */}
      <section id="roles" className="py-16 sm:py-20 bg-gray-50 border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Strict Role-Based Access Control (RBAC + RLS)
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
              4 Dedicated Roles with Strictly Scoped Modules
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Every user only sees and accesses the modules permitted for their role—enforced in
              the sidebar, URL routes, backend APIs, and Supabase Row Level Security.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ROLE_CARDS.map((r) => (
              <div
                key={r.role}
                className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between ${r.color}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${r.badge}`}>
                      {r.role}
                    </span>
                    <span className="text-[11px] font-bold opacity-80">{r.modules}</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed opacity-90">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="border-t border-gray-200 bg-white py-10 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-base">
              🏗️
            </span>
            <span className="text-sm font-bold text-gray-900">
              ConstructMS — Construction Management &amp; RA 12009 Bidding System
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
            <Link href="/login" className="hover:text-amber-600">
              Log In
            </Link>
            <Link href="/register" className="hover:text-amber-600">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
