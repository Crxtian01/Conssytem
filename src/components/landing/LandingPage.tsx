'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import FabricSculpture from '@/components/landing/FabricSculpture'

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

type SphereTone = 'amber' | 'ink' | 'pearl'

const SPHERE_GRADIENTS: Record<SphereTone, string> = {
  amber:
    'radial-gradient(circle at 32% 28%, #fff6e0 0%, #fbbf24 20%, #d97706 58%, #7c2d12 100%)',
  ink: 'radial-gradient(circle at 32% 28%, #a1a1aa 0%, #3f3f46 22%, #18181b 62%, #000 100%)',
  pearl:
    'radial-gradient(circle at 32% 28%, #ffffff 0%, #f6f0e6 30%, #d8ccbb 70%, #a6978a 100%)',
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
          )}px rgba(60, 38, 16, 0.38), inset -${Math.round(size * 0.08)}px -${Math.round(
            size * 0.1
          )}px ${Math.round(size * 0.22)}px rgba(0,0,0,0.18)`,
        }}
      />
    </div>
  )
}

const HERO_SPHERES: SphereSpec[] = [
  { size: 132, top: '14%', left: '50%', depth: 26, tone: 'amber', duration: 10, delay: 0 },
  { size: 58, top: '70%', left: '44%', depth: 44, tone: 'ink', duration: 8, delay: 1.2 },
  { size: 34, top: '22%', left: '90%', depth: 62, tone: 'pearl', duration: 7, delay: 0.6 },
  { size: 196, top: '60%', left: '80%', depth: 14, tone: 'pearl', duration: 12, delay: 2, hideOnMobile: true },
  { size: 22, top: '84%', left: '62%', depth: 72, tone: 'amber', duration: 6, delay: 0.3 },
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
    <div className="relative min-h-screen overflow-x-hidden bg-[#f3efe8] font-sans text-[#111] selection:bg-amber-300/60">
      {/* ------------------------------ Navigation ------------------------------ */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-[#f3efe8]/80 backdrop-blur-md' : 'bg-transparent'
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
              <span className="block text-[16px] font-extrabold tracking-tight text-[#111]">
                ConstructMS
              </span>
              <span className="mt-0.5 block text-[8.5px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Construction Management
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-10 text-[13px] font-medium text-neutral-600 md:flex">
            {[
              { id: 'modules', label: 'Modules' },
              { id: 'bidding', label: 'Bidding' },
              { id: 'roles', label: 'Access' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToId(item.id)}
                className="group relative transition-colors hover:text-black"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-black transition-all duration-500 group-hover:w-full" />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-5 text-[13px]">
            {isSignedIn ? (
              <Link
                href="/"
                className="rounded-full bg-[#111] px-5 py-2.5 font-semibold text-[#f3efe8] transition hover:bg-amber-700"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="font-medium text-neutral-700 transition hover:text-black">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-[#111] px-5 py-2.5 font-semibold text-[#f3efe8] transition hover:bg-amber-700"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="h-px w-full bg-black/5">
          <div className="h-full bg-amber-600 transition-[width] duration-150" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* --------------------------------- Hero --------------------------------- */}
      <section ref={heroRef} className="relative flex min-h-[100svh] flex-col overflow-hidden">
        {/* 3D Isometric Architectural Frame & Brass T-Square Sculpture */}
        <div
          className="pointer-events-none absolute inset-0 lg:left-[34%]"
          style={{
            transform: 'translate3d(calc(var(--mx, 0) * -10px), calc(var(--my, 0) * -10px), 0)',
            transition: 'transform 1.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <FabricSculpture className="h-full w-full opacity-45 md:opacity-75 lg:opacity-100" />
        </div>

        {/* Floating spheres */}
        {HERO_SPHERES.map((s, idx) => (
          <FloatingSphere key={idx} {...s} />
        ))}

        {/* Hero content */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-between px-6 pb-10 pt-32 lg:px-10">
          <div
            className="cms-fade-in flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500"
            style={{ animationDelay: '80ms' }}
          >
            <span>(01)</span>
            <span className="h-px w-10 bg-neutral-400" />
            <span>Construction Management System — Philippines</span>
          </div>

          <h1 className="my-10 text-[clamp(3.2rem,9.2vw,9.75rem)] font-black leading-[0.86] tracking-[-0.055em]">
            <HeadlineLine delayMs={150}>Bid smarter.</HeadlineLine>
            <HeadlineLine delayMs={280}>
              Build{' '}
              <span className="font-serif text-[1.04em] font-normal italic tracking-[-0.02em] text-amber-700">
                with
              </span>
            </HeadlineLine>
            <HeadlineLine delayMs={410}>certainty.</HeadlineLine>
          </h1>

          <div className="grid items-end gap-10 md:grid-cols-12">
            <div className="cms-fade-in md:col-span-5" style={{ animationDelay: '650ms' }}>
              <p className="max-w-md text-[15px] leading-relaxed text-neutral-600">
                One quiet system for the engineering office, the jobsite, and the project owner — from
                RA 12009 bid preparation to daily logs, inventory, attendance, and approvals.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                {isSignedIn ? (
                  <Link
                    href="/"
                    className="group inline-flex items-center gap-3 rounded-full bg-[#111] py-3.5 pl-6 pr-3.5 text-sm font-semibold text-[#f3efe8] transition hover:bg-amber-700"
                  >
                    Open dashboard
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f3efe8] text-[#111] transition-transform duration-500 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="group inline-flex items-center gap-3 rounded-full bg-[#111] py-3.5 pl-6 pr-3.5 text-sm font-semibold text-[#f3efe8] transition hover:bg-amber-700"
                    >
                      Start a project
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f3efe8] text-[#111] transition-transform duration-500 group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                    <Link
                      href="/login"
                      className="group relative text-sm font-semibold text-neutral-800"
                    >
                      Sign in
                      <span className="absolute -bottom-1 left-0 h-px w-full origin-left bg-neutral-800 transition-transform duration-500 group-hover:scale-x-0" />
                    </Link>
                  </>
                )}
              </div>
              {isSignedIn && userEmail && (
                <p className="mt-4 text-xs text-neutral-500">Signed in as {userEmail}</p>
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
                  <p className="text-3xl font-black tracking-tight">{stat.k}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-neutral-500">{stat.v}</p>
                </div>
              ))}
              <button
                type="button"
                onClick={() => scrollToId('modules')}
                className="flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-neutral-500 hover:text-black"
              >
                <span className="relative h-12 w-px overflow-hidden bg-neutral-300">
                  <span className="cms-scroll-cue absolute inset-x-0 top-0 h-1/2 bg-neutral-900" />
                </span>
                Scroll
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- Marquee ------------------------------- */}
      <div className="relative z-10 overflow-hidden border-y border-black/10 bg-[#f3efe8] py-5">
        <div className="cms-marquee flex w-max gap-12 whitespace-nowrap text-[clamp(1.2rem,2.4vw,2rem)] font-semibold tracking-tight">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <span key={idx} className="flex items-center gap-12">
              <span className={idx % 2 ? 'font-serif font-normal italic text-amber-700' : ''}>{item}</span>
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
            </span>
          ))}
        </div>
      </div>

      {/* -------------------------------- Modules ------------------------------- */}
      <section id="modules" className="relative z-10 scroll-mt-20 bg-[#f3efe8] py-28 lg:py-40">
        <div className="mx-auto grid max-w-[1400px] gap-16 px-6 lg:grid-cols-12 lg:px-10">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <ScrollReveal>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500">
                  (02) — Modules
                </p>
                <h2 className="mt-6 text-[clamp(2.6rem,5.4vw,5.25rem)] font-black leading-[0.92] tracking-[-0.045em]">
                  Fifteen modules.
                  <br />
                  <span className="font-serif font-normal italic tracking-[-0.02em] text-amber-700">
                    One quiet system.
                  </span>
                </h2>
                <p className="mt-8 max-w-sm text-[15px] leading-relaxed text-neutral-600">
                  Designed for a phone on the scaffolding and a wide monitor in the engineering office.
                  Everything connected, nothing in the way.
                </p>
              </ScrollReveal>
            </div>
          </div>

          <div className="lg:col-span-7">
            {MODULES.map((mod, idx) => (
              <ScrollReveal key={mod.title} delayMs={idx * 60}>
                <div className="group grid grid-cols-[3.5rem_1fr] gap-4 border-t border-black/10 py-9 last:border-b">
                  <span className="pt-1.5 font-mono text-xs text-neutral-400">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-[clamp(1.5rem,2.6vw,2.25rem)] font-bold tracking-[-0.03em] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3">
                        {mod.title}
                      </h3>
                      <span className="rounded-full border border-black/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600 transition-colors duration-500 group-hover:border-amber-600 group-hover:text-amber-700">
                        {mod.tag}
                      </span>
                    </div>
                    <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-600">
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
      <section id="bidding" className="relative z-10 scroll-mt-20 overflow-hidden bg-[#0f0f0f] py-28 text-[#f3efe8] lg:py-40">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-16 h-72 w-72 opacity-90">
          <div
            className="cms-float h-full w-full rounded-full"
            style={{ background: SPHERE_GRADIENTS.amber, animationDuration: '13s' }}
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
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500">
              (03) — RA 12009 Bidding
            </p>
            <h2 className="mt-6 max-w-5xl text-[clamp(2.6rem,6vw,6rem)] font-black leading-[0.92] tracking-[-0.045em]">
              From invitation to award,{' '}
              <span className="font-serif font-normal italic tracking-[-0.02em] text-amber-400">
                in one flow.
              </span>
            </h2>
            <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-neutral-400">
              A guided beginner mode walks first-time bidders through every stage, while seasoned
              engineers move straight from estimate to approval.
            </p>
          </ScrollReveal>

          <div className="mt-20 grid gap-px overflow-hidden border-y border-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {BIDDING_STATS.map((stat, idx) => (
              <ScrollReveal key={stat.value} delayMs={idx * 120}>
                <div className="group h-full py-10 pr-8 transition-colors duration-700 sm:border-r sm:border-white/10 sm:pl-6 lg:first:pl-0 lg:last:border-r-0">
                  <p className="text-[clamp(3rem,5vw,4.75rem)] font-black leading-none tracking-[-0.05em] transition-colors duration-700 group-hover:text-amber-400">
                    {stat.value}
                  </p>
                  <p className="mt-6 max-w-[16rem] text-sm leading-relaxed text-neutral-400">
                    {stat.caption}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------- Roles -------------------------------- */}
      <section id="roles" className="relative z-10 scroll-mt-20 bg-[#f3efe8] py-28 lg:py-40">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <ScrollReveal className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500">
                (04) — Access
              </p>
              <h2 className="mt-6 text-[clamp(2.6rem,5.4vw,5.25rem)] font-black leading-[0.92] tracking-[-0.045em]">
                Four roles.{' '}
                <span className="font-serif font-normal italic tracking-[-0.02em] text-amber-700">
                  Nothing more.
                </span>
              </h2>
            </div>
            <p className="self-end text-[15px] leading-relaxed text-neutral-600 lg:col-span-5">
              Every person sees only the modules their role allows — enforced in the navigation, on
              every route, in the API, and in the database itself.
            </p>
          </ScrollReveal>

          <div className="mt-20">
            {ROLES.map((r, idx) => (
              <ScrollReveal key={r.role} delayMs={idx * 90}>
                <div className="group grid items-baseline gap-4 border-t border-black/10 py-8 last:border-b md:grid-cols-12">
                  <div className="flex items-center gap-4 md:col-span-5">
                    <span className={`h-2.5 w-2.5 rounded-full ${r.dot} transition-transform duration-500 group-hover:scale-150`} />
                    <h3 className="text-[clamp(1.6rem,3vw,2.6rem)] font-bold tracking-[-0.035em]">
                      {r.role}
                    </h3>
                  </div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500 md:col-span-2">
                    {r.count}
                  </p>
                  <p className="text-[15px] leading-relaxed text-neutral-600 md:col-span-5">
                    {r.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- Closing ------------------------------- */}
      <section className="relative z-10 overflow-hidden border-t border-black/10 bg-[#f3efe8] py-32 lg:py-44">
        <div aria-hidden="true" className="pointer-events-none absolute left-[12%] top-14 h-20 w-20">
          <div className="cms-float h-full w-full rounded-full" style={{ background: SPHERE_GRADIENTS.ink, animationDuration: '10s' }} />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute bottom-16 right-[14%] h-32 w-32">
          <div className="cms-float h-full w-full rounded-full" style={{ background: SPHERE_GRADIENTS.amber, animationDuration: '12s', animationDelay: '1.5s' }} />
        </div>

        <ScrollReveal className="relative mx-auto max-w-[1400px] px-6 text-center lg:px-10">
          <h2 className="text-[clamp(2.8rem,7.5vw,7.5rem)] font-black leading-[0.9] tracking-[-0.05em]">
            Built for the jobsite.
            <br />
            <span className="font-serif font-normal italic tracking-[-0.02em] text-amber-700">
              Designed for the office.
            </span>
          </h2>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group mt-14 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-600 hover:text-black"
          >
            Back to top
            <span className="transition-transform duration-500 group-hover:-translate-y-1">↑</span>
          </button>
        </ScrollReveal>
      </section>

      {/* -------------------------------- Footer -------------------------------- */}
      <footer className="relative z-10 border-t border-black/10 bg-[#f3efe8]">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-neutral-500 sm:flex-row lg:px-10">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/constructms-sculpture.png"
              alt="ConstructMS Logo"
              className="h-7 w-auto object-contain"
            />
            <span className="font-bold text-neutral-900">ConstructMS</span>
            <span>— Construction Management &amp; RA 12009 Bidding</span>
          </div>
          <p>© 2026 ConstructMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
