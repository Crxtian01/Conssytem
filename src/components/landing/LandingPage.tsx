'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import FabricSculpture from '@/components/landing/FabricSculpture'
import ScatteredMaterialsBackdrop from '@/components/layout/ScatteredMaterialsBackdrop'
import DashboardShowcase from '@/components/landing/DashboardShowcase'

interface LandingPageProps {
  isSignedIn?: boolean
  userEmail?: string | null
}

/* ------------------------------------------------------------------ */
/* Motion helpers                                                      */
/* ------------------------------------------------------------------ */

function ScrollReveal({
  children,
  delayMs = 0,
  className = '',
}: {
  children: React.ReactNode
  delayMs?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delayMs}ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className={`transition-[opacity,transform,filter] duration-[1100ms] ${
        visible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-10 blur-[2px]'
      } ${className}`}
    >
      {children}
    </div>
  )
}

function HeadlineLine({ children, delayMs }: { children: React.ReactNode; delayMs: number }) {
  return (
    <span className="block overflow-hidden pb-[0.06em]">
      <span className="block cms-line-in" style={{ animationDelay: `${delayMs}ms` }}>
        {children}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Floating spheres with mouse parallax                                */
/* ------------------------------------------------------------------ */

type SphereTone = 'cyan' | 'ink' | 'pearl'

const SPHERE_GRADIENTS: Record<SphereTone, string> = {
  cyan:
    'radial-gradient(circle at 32% 28%, #e0faff 0%, #38bdf8 20%, #06b6d4 58%, #0369a1 100%)',
  ink: 'radial-gradient(circle at 32% 28%, #94a3b8 0%, #334155 25%, #0f172a 65%, #020617 100%)',
  pearl:
    'radial-gradient(circle at 32% 28%, #ffffff 0%, #e2e8f0 30%, #94a3b8 70%, #475569 100%)',
}

interface SphereSpec {
  size: number
  top: string
  left: string
  depth: number
  tone: SphereTone
  duration: number
  delay: number
  hideOnMobile?: boolean
}

function FloatingSphere({ size, top, left, depth, tone, duration, delay, hideOnMobile }: SphereSpec) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${hideOnMobile ? 'hidden md:block' : ''}`}
      style={{
        top,
        left,
        width: size,
        height: size,
        transform: `translate3d(calc(var(--mx, 0) * ${depth}px), calc(var(--my, 0) * ${depth}px), 0)`,
        transition: 'transform 1.4s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        className="cms-float h-full w-full rounded-full"
        style={{
          background: SPHERE_GRADIENTS[tone],
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          boxShadow: `0 ${Math.round(size * 0.4)}px ${Math.round(size * 0.7)}px -${Math.round(
            size * 0.3
          )}px rgba(6, 182, 212, 0.35), inset -${Math.round(size * 0.08)}px -${Math.round(
            size * 0.1
          )}px ${Math.round(size * 0.22)}px rgba(0,0,0,0.22)`,
        }}
      />
    </div>
  )
}

const HERO_SPHERES: SphereSpec[] = [
  { size: 132, top: '14%', left: '50%', depth: 26, tone: 'cyan', duration: 10, delay: 0 },
  { size: 58, top: '70%', left: '44%', depth: 44, tone: 'ink', duration: 8, delay: 1.2 },
  { size: 34, top: '22%', left: '90%', depth: 62, tone: 'pearl', duration: 7, delay: 0.6 },
  { size: 196, top: '60%', left: '80%', depth: 14, tone: 'pearl', duration: 12, delay: 2, hideOnMobile: true },
  { size: 22, top: '84%', left: '62%', depth: 72, tone: 'cyan', duration: 6, delay: 0.3 },
  { size: 76, top: '7%', left: '74%', depth: 36, tone: 'ink', duration: 11, delay: 1.6, hideOnMobile: true },
]

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const MODULES = [
  {
    title: 'Bidding & Procurement',
    tag: 'RA 12009',
    description:
      'ABC ceiling checks, NFCC calculator, BOQ & DUPA estimating, two-envelope checklist, and one-click award-to-project conversion.',
  },
  {
    title: 'Projects, Tasks & Daily Logs',
    tag: 'Field',
    description:
      'Site timelines, milestone completion, weather, field notes, and progress photos captured from any phone.',
  },
  {
    title: 'Materials & Equipment',
    tag: 'Inventory',
    description:
      'Stock-in and stock-out ledgers, automatic low-stock email alerts, and heavy machinery deployment across sites.',
  },
  {
    title: 'Workers & Attendance',
    tag: 'Workforce',
    description:
      'Daily attendance, trade classifications, hours worked, and labor cost summaries per project.',
  },
  {
    title: 'Budgets & Approvals',
    tag: 'Finance',
    description:
      'Approved budget against actual spend in real time, with Admin / Engineer sign-off on every expense.',
  },
  {
    title: 'Documents & Reports',
    tag: 'Insight',
    description:
      'Blueprints, permits, and contracts in one place, plus executive progress reports ready to export.',
  },
]

const BIDDING_STATS = [
  { value: 'ABC', caption: 'Ceiling guard. Every BOQ total is checked against the Approved Budget for the Contract.' },
  { value: '×15', caption: 'NFCC computed automatically from current assets, liabilities, and ongoing contracts.' },
  { value: '02', caption: 'Envelopes. Technical and financial checklists, pre-loaded with every RA 12009 requirement.' },
  { value: '01', caption: 'Click to convert an awarded bid into a live project with budget and timeline.' },
]

const ROLES = [
  {
    role: 'Admin / Engineer',
    count: '15 modules',
    dot: 'bg-purple-500',
    description: 'Full authority. Bid approval and contract award, expense approvals, and user management.',
  },
  {
    role: 'Assistant',
    count: '15 modules',
    dot: 'bg-blue-500',
    description: 'Prepares bids, builds estimates, and supports every module alongside the engineer.',
  },
  {
    role: 'Contractor',
    count: '6 modules',
    dot: 'bg-amber-500',
    description: 'Field execution only: tasks, daily logs, materials, attendance, and equipment.',
  },
  {
    role: 'Client',
    count: '5 modules',
    dot: 'bg-indigo-500',
    description: 'Read-only monitoring: progress, site logs with photos, documents, and reports.',
  },
]

const MARQUEE_ITEMS = [
  'RA 12009 Bidding',
  'BOQ & DUPA',
  'NFCC',
  'Daily Site Logs',
  'Inventory',
  'Attendance',
  'Expense Approvals',
  'Executive Reports',
]

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function LandingPage({ isSignedIn = false, userEmail }: LandingPageProps) {
  const heroRef = useRef<HTMLElement | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)

  // Scroll state for nav + progress line
  useEffect(() => {
    function onScroll() {
      const top = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      setScrolled(top > 24)
      setProgress(max > 0 ? Math.min(100, (top / max) * 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mouse parallax: writes CSS variables, no React re-render per frame
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    function onMove(e: PointerEvent) {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1
      hero!.style.setProperty('--mx', x.toFixed(3))
      hero!.style.setProperty('--my', y.toFixed(3))
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  function scrollToId(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05070e] font-sans text-white selection:bg-cyan-500/30">
      {/* City night photography bokeh background based on the dashboard */}
      <ScatteredMaterialsBackdrop />

      {/* ------------------------------ Navigation ------------------------------ */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-[#090d1a]/85 backdrop-blur-2xl border-b border-white/10 shadow-2xl' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/welcome" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/constructms-sculpture.png"
              alt="ConstructMS Logo"
              className="h-9 w-auto object-contain"
            />
            <div className="leading-none">
              <span className="block text-[16px] font-extrabold tracking-tight text-white">
                ConstructMS
              </span>
              <span className="mt-0.5 block text-[8.5px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Construction Management
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-10 text-[13px] font-medium text-slate-300 md:flex">
            {[
              { id: 'modules', label: 'Modules' },
              { id: 'bidding', label: 'Bidding' },
              { id: 'roles', label: 'Access' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToId(item.id)}
                className="group relative transition-colors hover:text-white"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-cyan-400 transition-all duration-500 group-hover:w-full" />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-5 text-[13px]">
            {isSignedIn ? (
              <Link
                href="/"
                className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 font-bold text-slate-950 transition hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/25"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="font-semibold text-slate-300 transition hover:text-white">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 font-bold text-slate-950 transition hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/25"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="h-px w-full bg-white/10">
          <div className="h-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] transition-[width] duration-150" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* --------------------------------- Hero --------------------------------- */}
      <section ref={heroRef} className="relative flex min-h-[100svh] flex-col overflow-hidden">
        {/* 3D Isometric Architectural Frame & Brass T-Square Sculpture */}
        <div
          className="absolute inset-0 z-10 lg:left-[32%]"
          style={{
            transform: 'translate3d(calc(var(--mx, 0) * -10px), calc(var(--my, 0) * -10px), 0)',
            transition: 'transform 1.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <FabricSculpture className="h-full w-full opacity-45 md:opacity-75 lg:opacity-90" />
        </div>

        {/* Floating spheres */}
        {HERO_SPHERES.map((s, idx) => (
          <FloatingSphere key={idx} {...s} />
        ))}

        {/* Hero content */}
        <div className="pointer-events-none relative z-20 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-between px-6 pb-10 pt-32 lg:px-10">
          <div
            className="cms-fade-in flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300"
            style={{ animationDelay: '80ms' }}
          >
            <span>(01)</span>
            <span className="h-px w-10 bg-cyan-400/40" />
            <span>Construction Management System — Philippines</span>
          </div>

          <h1 className="my-10 text-[clamp(3.2rem,9.2vw,9.75rem)] font-black leading-[0.86] tracking-[-0.055em] text-white">
            <HeadlineLine delayMs={150}>Bid smarter.</HeadlineLine>
            <HeadlineLine delayMs={280}>
              Build{' '}
              <span className="font-serif text-[1.04em] font-normal italic tracking-[-0.02em] text-cyan-400">
                with
              </span>
            </HeadlineLine>
            <HeadlineLine delayMs={410}>certainty.</HeadlineLine>
          </h1>

          <div className="grid items-end gap-10 md:grid-cols-12">
            <div className="cms-fade-in md:col-span-5" style={{ animationDelay: '650ms' }}>
              <p className="max-w-md text-[15px] leading-relaxed text-slate-300">
                One quiet system for the engineering office, the jobsite, and the project owner — from
                RA 12009 bid preparation to daily logs, inventory, attendance, and approvals.
              </p>
              <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-6">
                {isSignedIn ? (
                  <Link
                    href="/"
                    className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 pl-6 pr-3.5 text-sm font-bold text-slate-950 transition hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
                  >
                    Open dashboard
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-cyan-300 transition-transform duration-500 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 pl-6 pr-3.5 text-sm font-bold text-slate-950 transition hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
                    >
                      Start a project
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-cyan-300 transition-transform duration-500 group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                    <Link
                      href="/login"
                      className="group relative text-sm font-bold text-slate-300 hover:text-white transition"
                    >
                      Sign in
                      <span className="absolute -bottom-1 left-0 h-px w-full origin-left bg-cyan-400 transition-transform duration-500 group-hover:scale-x-100" />
                    </Link>
                  </>
                )}
              </div>
              {isSignedIn && userEmail && (
                <p className="mt-4 text-xs text-slate-400">Signed in as {userEmail}</p>
              )}
            </div>

            <div
              className="cms-fade-in hidden items-end justify-end gap-12 md:col-span-7 md:flex"
              style={{ animationDelay: '800ms' }}
            >
              {[
                { k: '15', v: 'Modules' },
                { k: '04', v: 'Roles' },
                { k: 'RLS', v: 'Secured' },
              ].map((stat) => (
                <div key={stat.v} className="text-right">
                  <p className="text-3xl font-black tracking-tight text-white">{stat.k}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">{stat.v}</p>
                </div>
              ))}
              <button
                type="button"
                onClick={() => scrollToId('modules')}
                className="pointer-events-auto flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-slate-400 hover:text-cyan-300 transition"
              >
                <span className="relative h-12 w-px overflow-hidden bg-white/20">
                  <span className="cms-scroll-cue absolute inset-x-0 top-0 h-1/2 bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
                </span>
                Scroll
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------- Trust & Compliance Standards --------------------- */}
      <div className="relative z-20 border-y border-white/10 bg-[#070b16]/90 backdrop-blur-2xl py-6 text-slate-300">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-around gap-6 px-6 text-xs font-bold tracking-wider lg:px-10">
          <div className="flex items-center gap-2 text-cyan-300">
            <span className="text-base">⚖️</span>
            <span>Philippine RA 12009 Procurement Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="text-base">🛡️</span>
            <span>Automated ABC Ceiling &amp; NFCC Calculation</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="text-base">🔒</span>
            <span>Row-Level Security (RLS) Across 4 Roles</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="text-base">📱</span>
            <span>Field-Ready Mobile Daily Logs &amp; Photos</span>
          </div>
        </div>
      </div>

      {/* --------------------------- Product Showcase --------------------------- */}
      <section className="relative z-20 -mt-2 px-3 sm:px-6 py-12 sm:py-20 lg:px-10 lg:py-28 overflow-hidden">
        <ScrollReveal>
          <div className="mb-8 sm:mb-10 text-center px-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1 text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-cyan-300 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              Live Admin &amp; Lead Engineer Command Center
            </span>
            <h3 className="mt-3 text-2xl font-black text-white sm:text-4xl">
              One unified cockpit for every site, bid &amp; budget.
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-slate-400">
              Live executive telemetry showing verified S-Curve progress curves, RA 12009 public bidding packages, and real-time capital disbursement.
            </p>
          </div>

          <DashboardShowcase />
        </ScrollReveal>
      </section>

      {/* -------------------------------- Marquee ------------------------------- */}
      <div className="relative z-10 overflow-hidden border-y border-white/10 bg-[#090d1a]/75 backdrop-blur-xl py-5 text-white">
        <div className="cms-marquee flex w-max gap-12 whitespace-nowrap text-[clamp(1.2rem,2.4vw,2rem)] font-semibold tracking-tight">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <span key={idx} className="flex items-center gap-12">
              <span className={idx % 2 ? 'font-serif font-normal italic text-cyan-300' : 'text-white'}>{item}</span>
              <span className="h-2 w-2 rounded-full bg-cyan-400/50 shadow-[0_0_6px_#06b6d4]" />
            </span>
          ))}
        </div>
      </div>

      {/* -------------------------------- Modules ------------------------------- */}
      <section id="modules" className="relative z-10 scroll-mt-20 py-28 lg:py-40">
        <div className="mx-auto grid max-w-[1400px] gap-16 px-6 lg:grid-cols-12 lg:px-10">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <ScrollReveal>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  (02) — Modules
                </p>
                <h2 className="mt-6 text-[clamp(2.6rem,5.4vw,5.25rem)] font-black leading-[0.92] tracking-[-0.045em] text-white">
                  Fifteen modules.
                  <br />
                  <span className="font-serif font-normal italic tracking-[-0.02em] text-cyan-400">
                    One quiet system.
                  </span>
                </h2>
                <p className="mt-8 max-w-sm text-[15px] leading-relaxed text-slate-300">
                  Designed for a phone on the scaffolding and a wide monitor in the engineering office.
                  Everything connected, nothing in the way.
                </p>
              </ScrollReveal>
            </div>
          </div>

          <div className="lg:col-span-7">
            {MODULES.map((mod, idx) => (
              <ScrollReveal key={mod.title} delayMs={idx * 60}>
                <div className="group grid grid-cols-[3.5rem_1fr] gap-4 border-t border-white/10 py-9 last:border-b text-white transition hover:border-cyan-400/40">
                  <span className="pt-1.5 font-mono text-xs text-slate-500">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-[clamp(1.5rem,2.6vw,2.25rem)] font-bold tracking-[-0.03em] text-white transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3 group-hover:text-cyan-300">
                        {mod.title}
                      </h3>
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300 transition-colors duration-500 group-hover:border-cyan-400 group-hover:bg-cyan-500/20">
                        {mod.tag}
                      </span>
                    </div>
                    <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-300">
                      {mod.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- Bidding ------------------------------- */}
      <section id="bidding" className="relative z-10 scroll-mt-20 overflow-hidden border-y border-white/10 bg-[#0b101c]/90 backdrop-blur-3xl py-28 text-white lg:py-40">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-16 h-72 w-72 opacity-90">
          <div
            className="cms-float h-full w-full rounded-full"
            style={{ background: SPHERE_GRADIENTS.cyan, animationDuration: '13s' }}
          />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute bottom-20 left-[8%] h-16 w-16">
          <div
            className="cms-float h-full w-full rounded-full"
            style={{ background: SPHERE_GRADIENTS.pearl, animationDuration: '9s', animationDelay: '1s' }}
          />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10">
          <ScrollReveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
              (03) — RA 12009 Bidding
            </p>
            <h2 className="mt-6 max-w-5xl text-[clamp(2.6rem,6vw,6rem)] font-black leading-[0.92] tracking-[-0.045em] text-white">
              From invitation to award,{' '}
              <span className="font-serif font-normal italic tracking-[-0.02em] text-cyan-400">
                in one flow.
              </span>
            </h2>
            <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-slate-300">
              A guided beginner mode walks first-time bidders through every stage, while seasoned
              engineers move straight from estimate to approval.
            </p>
          </ScrollReveal>

          <div className="mt-20 grid gap-px overflow-hidden border-y border-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {BIDDING_STATS.map((stat, idx) => (
              <ScrollReveal key={stat.value} delayMs={idx * 120}>
                <div className="group h-full py-10 pr-8 transition-colors duration-700 sm:border-r sm:border-white/10 sm:pl-6 lg:first:pl-0 lg:last:border-r-0">
                  <p className="text-[clamp(3rem,5vw,4.75rem)] font-black leading-none tracking-[-0.05em] text-white transition-colors duration-700 group-hover:text-cyan-300">
                    {stat.value}
                  </p>
                  <p className="mt-6 max-w-[16rem] text-sm leading-relaxed text-slate-400">
                    {stat.caption}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------- Roles -------------------------------- */}
      <section id="roles" className="relative z-10 scroll-mt-20 py-28 lg:py-40">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <ScrollReveal className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                (04) — Access
              </p>
              <h2 className="mt-6 text-[clamp(2.6rem,5.4vw,5.25rem)] font-black leading-[0.92] tracking-[-0.045em] text-white">
                Four roles.{' '}
                <span className="font-serif font-normal italic tracking-[-0.02em] text-cyan-400">
                  Nothing more.
                </span>
              </h2>
            </div>
            <p className="self-end text-[15px] leading-relaxed text-slate-300 lg:col-span-5">
              Every person sees only the modules their role allows — enforced in the navigation, on
              every route, in the API, and in the database itself.
            </p>
          </ScrollReveal>

          <div className="mt-20">
            {ROLES.map((r, idx) => (
              <ScrollReveal key={r.role} delayMs={idx * 90}>
                <div className="group grid items-baseline gap-4 border-t border-white/10 py-8 last:border-b text-white md:grid-cols-12 transition hover:border-cyan-400/40">
                  <div className="flex items-center gap-4 md:col-span-5">
                    <span className={`h-2.5 w-2.5 rounded-full ${r.dot} transition-transform duration-500 group-hover:scale-150`} />
                    <h3 className="text-[clamp(1.6rem,3vw,2.6rem)] font-bold tracking-[-0.035em] text-white group-hover:text-cyan-300 transition">
                      {r.role}
                    </h3>
                  </div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300 md:col-span-2">
                    {r.count}
                  </p>
                  <p className="text-[15px] leading-relaxed text-slate-300 md:col-span-5">
                    {r.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- Closing ------------------------------- */}
      <section className="relative z-10 overflow-hidden border-t border-white/10 bg-[#070a14]/90 backdrop-blur-2xl py-32 lg:py-40 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute left-[12%] top-14 h-20 w-20">
          <div className="cms-float h-full w-full rounded-full" style={{ background: SPHERE_GRADIENTS.ink, animationDuration: '10s' }} />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute bottom-16 right-[14%] h-32 w-32">
          <div className="cms-float h-full w-full rounded-full" style={{ background: SPHERE_GRADIENTS.cyan, animationDuration: '12s', animationDelay: '1.5s' }} />
        </div>

        <ScrollReveal className="relative mx-auto max-w-[1400px] px-6 text-center lg:px-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300 backdrop-blur-md">
            Ready to Streamline Your Sites?
          </span>
          <h2 className="mt-6 text-[clamp(2.8rem,7.5vw,7.5rem)] font-black leading-[0.9] tracking-[-0.05em] text-white">
            Built for the jobsite.
            <br />
            <span className="font-serif font-normal italic tracking-[-0.02em] text-cyan-400">
              Designed for the office.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base text-slate-300 leading-relaxed">
            Eliminate fragmented spreadsheets and bid miscalculations. Get complete RA 12009 compliance, live site logs, and real-time expense approvals in one unified workspace.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
            {isSignedIn ? (
              <Link
                href="/"
                className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-4 text-sm font-black text-slate-950 shadow-xl shadow-cyan-500/30 transition hover:from-cyan-300 hover:to-blue-400 hover:scale-105"
              >
                Go to Dashboard
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-cyan-300 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-4 text-sm font-black text-slate-950 shadow-xl shadow-cyan-500/30 transition hover:from-cyan-300 hover:to-blue-400 hover:scale-105"
                >
                  Start a Project Free
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-cyan-300 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-7 py-4 text-sm font-bold text-white backdrop-blur-xl transition hover:border-cyan-400/50 hover:bg-white/10"
                >
                  Sign in to Workspace
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group mt-14 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400 hover:text-white transition"
          >
            Back to top
            <span className="transition-transform duration-500 group-hover:-translate-y-1">↑</span>
          </button>
        </ScrollReveal>
      </section>

      {/* -------------------------------- Footer -------------------------------- */}
      <footer className="relative z-10 border-t border-white/10 bg-[#05070e] text-slate-400">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 px-6 py-8 text-xs sm:flex-row lg:px-10">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/constructms-sculpture.png"
              alt="ConstructMS Logo"
              className="h-7 w-auto object-contain"
            />
            <span className="font-bold text-white">ConstructMS</span>
            <span>— Construction Management &amp; RA 12009 Bidding</span>
          </div>
          <p>© 2026 ConstructMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
