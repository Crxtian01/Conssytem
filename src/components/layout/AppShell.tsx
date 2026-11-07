'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ScatteredMaterialsBackdrop from '@/components/layout/ScatteredMaterialsBackdrop'
import {
  ROLES,
  getModulesForRole,
  canRoleAccessPath,
  type UserRole,
} from '@/lib/roles'

interface AppShellProps {
  user: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
    role: UserRole
    emailVerified: boolean
  }
  children: React.ReactNode
}

// Module-scoped scroll cache so the desktop sidebar keeps its exact scroll position across route changes
let persistedSidebarScrollTop = 0

export default function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  const shellRef = useRef<HTMLDivElement | null>(null)
  const desktopSidebarRef = useRef<HTMLElement | null>(null)
  const mainScrollRef = useRef<HTMLElement | null>(null)

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [switchingRole, setSwitchingRole] = useState(false)
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showRoleRequestBox, setShowRoleRequestBox] = useState(false)
  const [requestedRole, setRequestedRole] = useState<UserRole>('assistant')
  const [roleReqSent, setRoleReqSent] = useState<string | null>(null)
  const [showDemoPreview, setShowDemoPreview] = useState(false)

  // Restore desktop sidebar scroll position on mount and keep it synced on scroll
  useEffect(() => {
    const sidebarEl = desktopSidebarRef.current
    if (!sidebarEl) return
    sidebarEl.scrollTop = persistedSidebarScrollTop

    function handleSidebarScroll() {
      if (sidebarEl) {
        persistedSidebarScrollTop = sidebarEl.scrollTop
      }
    }
    sidebarEl.addEventListener('scroll', handleSidebarScroll, { passive: true })
    return () => sidebarEl.removeEventListener('scroll', handleSidebarScroll)
  }, [])

  // On route change: reset main content scroll to top, close mobile drawer, and clear loading state
  useEffect(() => {
    setNavigatingTo(null)
    setMobileDrawerOpen(false)
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    }
  }, [pathname])

  // Close mobile drawer or sign-out modal on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (mobileDrawerOpen) setMobileDrawerOpen(false)
        if (showSignOutModal && !signingOut) setShowSignOutModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileDrawerOpen, showSignOutModal, signingOut])

  // Mouse-following liquid light refraction across the workspace
  useEffect(() => {
    const el = shellRef.current
    if (!el) return
    function onPointerMove(e: PointerEvent) {
      el!.style.setProperty('--lx', `${e.clientX}px`)
      el!.style.setProperty('--ly', `${e.clientY}px`)
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  const roleInfo = ROLES[user.role] ?? ROLES.contractor
  const allowedModules = getModulesForRole(user.role)
  const hasAccessToCurrentPath = canRoleAccessPath(user.role, pathname)
  const isTransitioning = Boolean(navigatingTo) || switchingRole

  const currentModule =
    allowedModules.find((m) =>
      m.href === '/' ? pathname === '/' : pathname.startsWith(m.href)
    ) ?? allowedModules[0]

  async function handleQuickRoleSwitch(newRole: UserRole) {
    setSwitchingRole(true)
    await fetch('/api/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, role: newRole }),
    })
    setSwitchingRole(false)
    router.refresh()
  }

  async function handleSubmitRoleRequest() {
    setSwitchingRole(true)
    setRoleReqSent(null)
    const res = await fetch('/api/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'request_role',
        requestedRole,
        reason: `Requested upgrade from ${roleInfo.label} to ${ROLES[requestedRole].label}`,
      }),
    })
    setSwitchingRole(false)
    if (res.ok) {
      setRoleReqSent(`Request for ${ROLES[requestedRole].label} sent to Admin/Engineer!`)
      setShowRoleRequestBox(false)
    }
  }

  function renderSidebarContents(isMobileDrawer: boolean) {
    return (
      <>
        {/* Brand Header inside Sidebar */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/50 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="liquid-droplet-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/constructms-sculpture.png"
                alt="ConstructMS Logo"
                className="h-full w-full object-contain"
              />
            </span>
            <div className="min-w-0">
              <p className="font-extrabold text-slate-900 leading-tight tracking-tight truncate">
                ConstructMS
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600 truncate">
                Construction Management
              </p>
            </div>
          </div>

          {isMobileDrawer && (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="liquid-droplet-pill inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl text-base font-bold text-slate-800 hover:bg-white/80"
              aria-label="Close navigation drawer"
            >
              ✕
            </button>
          )}
        </div>

        {/* User Profile Summary + Role Badge + Switch Role / Request Role */}
        <div className="shrink-0 border-b border-white/50 p-4 space-y-3">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full border-2 border-white/90 object-cover shadow-sm"
              />
            ) : (
              <div className="liquid-droplet-pill flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-amber-900">
                {(user.fullName || user.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {user.fullName || user.email}
              </p>
              <p className="truncate text-xs text-slate-700">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Assigned Role
              </span>
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${roleInfo.badgeColor}`}
              >
                {roleInfo.label}
              </span>
            </div>

            {user.role !== 'admin_engineer' && (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setShowRoleRequestBox((v) => !v)}
                  className="liquid-droplet-pill min-h-11 w-full rounded-xl px-2.5 py-2 text-[11px] font-bold text-slate-800 hover:bg-white/80 transition"
                >
                  {showRoleRequestBox ? 'Cancel Role Request' : 'Request Role Upgrade →'}
                </button>

                {showRoleRequestBox && (
                  <div className="liquid-droplet-pill rounded-xl p-2.5 space-y-2">
                    <p className="text-[10px] font-semibold text-slate-700">
                      Requires Admin / Engineer Approval:
                    </p>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value as UserRole)}
                      className="w-full rounded-lg border border-white/80 bg-white/80 px-2 py-1.5 text-xs font-semibold text-slate-900"
                    >
                      <option value="assistant">Assistant</option>
                      <option value="contractor">Contractor</option>
                      <option value="client">Client</option>
                      <option value="admin_engineer">Admin / Engineer</option>
                    </select>
                    <button
                      type="button"
                      disabled={switchingRole}
                      onClick={handleSubmitRoleRequest}
                      className="w-full rounded-lg bg-amber-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      Submit Request
                    </button>
                  </div>
                )}

                {roleReqSent && (
                  <p className="rounded-lg bg-emerald-50/90 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                    {roleReqSent}
                  </p>
                )}
              </div>
            )}

            {/* Switch Role / Preview Other Role Dashboard */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowDemoPreview((v) => !v)}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline"
              >
                {showDemoPreview ? 'Hide Switch Role' : 'Switch Role (Preview 4 Roles)'}
              </button>
              {showDemoPreview && (
                <select
                  aria-label="Switch role dashboard"
                  value={user.role}
                  disabled={switchingRole}
                  onChange={(e) => handleQuickRoleSwitch(e.target.value as UserRole)}
                  className="liquid-droplet-pill mt-1.5 min-h-11 w-full rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none disabled:opacity-50"
                >
                  <option value="admin_engineer">Admin / Engineer (15 Modules)</option>
                  <option value="assistant">Assistant (10 Modules)</option>
                  <option value="contractor">Contractor (6 Modules)</option>
                  <option value="client">Client (5 Read-Only Modules)</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Role-Filtered Navigation Links (Touch targets >= 48px via min-h-12) */}
        <nav className="flex-1 space-y-1.5 p-3" aria-label="Module navigation">
          <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Allowed Modules ({allowedModules.length})
          </p>
          {allowedModules.map((mod) => {
            const active =
              mod.href === '/' ? pathname === '/' : pathname.startsWith(mod.href)
            const isLoadingThis = navigatingTo === mod.name && !active
            return (
              <Link
                key={mod.id}
                href={mod.href}
                onClick={() => {
                  if (isMobileDrawer) {
                    setMobileDrawerOpen(false)
                  }
                  if (!active) {
                    setNavigatingTo(mod.name)
                  }
                }}
                className={`group flex min-h-12 items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active || isLoadingThis
                    ? 'liquid-droplet-pill text-slate-950 font-bold'
                    : 'border border-transparent text-slate-800 hover:border-white/60 hover:bg-white/35'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {isLoadingThis && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-800 border-t-transparent" />
                  )}
                  <span>{mod.name}</span>
                </span>
                {isLoadingThis && (
                  <span className="text-[10px] font-bold text-amber-800">
                    Opening…
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out Trigger Button (Touch target >= 48px via min-h-12) */}
        <div className="shrink-0 border-t border-white/50 p-3">
          <button
            type="button"
            onClick={() => {
              if (isMobileDrawer) setMobileDrawerOpen(false)
              setShowSignOutModal(true)
            }}
            className="liquid-droplet-pill flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-bold text-slate-800 transition hover:border-red-300 hover:bg-red-500/20 hover:text-red-900"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </>
    )
  }

  return (
    <div
      ref={shellRef}
      className="liquid-mesh-bg relative flex h-dvh w-full overflow-hidden text-slate-900"
    >
      {/* Hidden SVG Optical Liquid Refraction Filter */}
      <svg className="pointer-events-none fixed h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="liquid-glass-refract" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.015"
              numOctaves="2"
              seed="4"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="8"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Scattered Construction Materials & Liquid Orbs Behind the Glass Cards */}
      <ScatteredMaterialsBackdrop />

      {/* Top animated progress bar when switching modules or roles */}
      {(isTransitioning || signingOut) && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/40 backdrop-blur-md overflow-hidden">
          <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-amber-500 via-sky-500 to-indigo-500" />
        </div>
      )}

      {/* =====================================================================
          1. DESKTOP FIXED SIDEBAR (hidden on mobile < md, scrolls independently)
         ===================================================================== */}
      <aside
        ref={desktopSidebarRef}
        aria-label="Sidebar navigation"
        className="liquid-glass-sidebar relative z-20 hidden w-72 shrink-0 flex-col overflow-y-auto border-r border-white/70 md:flex"
      >
        {renderSidebarContents(false)}
      </aside>

      {/* =====================================================================
          2. MOBILE SLIDE-OUT DRAWER (< md, locks background scroll, closes on link/backdrop)
         ===================================================================== */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation drawer"
        >
          {/* Backdrop overlay (click to close) */}
          <div
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out drawer panel (independent overflow-y-auto scroll container) */}
          <aside className="liquid-glass-sidebar relative z-10 flex h-dvh w-78 max-w-[85vw] shrink-0 flex-col overflow-y-auto border-r border-white/80 shadow-2xl">
            {renderSidebarContents(true)}
          </aside>
        </div>
      )}

      {/* =====================================================================
          3. RIGHT SIDE: flex min-w-0 flex-1 flex-col (Fixed Header + Scrollable Main)
         ===================================================================== */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Fixed Top Header (shrink-0, border-b) */}
        <header className="liquid-glass-sidebar shrink-0 border-b border-white/70 px-4 py-2.5 md:px-6">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Mobile Hamburger Button (>= 48px touch target) + Active Module Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="liquid-droplet-pill inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-slate-800 md:hidden"
                aria-label="Open navigation menu"
                aria-expanded={mobileDrawerOpen}
              >
                ☰
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                    {currentModule?.name || 'Dashboard'}
                  </span>
                </div>
                <p className="hidden truncate text-xs text-slate-600 sm:block">
                  {currentModule?.description || roleInfo.typicalAccess}
                </p>
              </div>
            </div>

            {/* Right: Verified Role Badge + Quick Switch Role Selector */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${roleInfo.badgeColor}`}
              >
                {roleInfo.label}
              </span>

              <select
                aria-label="Quick switch role"
                value={user.role}
                disabled={switchingRole}
                onChange={(e) => handleQuickRoleSwitch(e.target.value as UserRole)}
                className="liquid-droplet-pill hidden min-h-10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none disabled:opacity-50 sm:block"
              >
                <option value="admin_engineer">Switch: Admin / Engineer</option>
                <option value="assistant">Switch: Assistant</option>
                <option value="contractor">Switch: Contractor</option>
                <option value="client">Switch: Client</option>
              </select>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content Container (flex-1 overflow-y-auto p-4 md:p-6) */}
        <main
          ref={mainScrollRef}
          className="liquid-workspace flex-1 min-w-0 overflow-y-auto p-4 md:p-6"
        >
          {isTransitioning && (
            <div className="liquid-glass-card mb-4 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 flex items-center gap-2.5">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-700 border-t-transparent" />
              <span>
                {switchingRole
                  ? 'Switching role & updating module permissions…'
                  : `Opening ${navigatingTo}…`}
              </span>
            </div>
          )}

          <div className={`min-w-0 ${isTransitioning ? 'opacity-60 transition-opacity duration-150' : ''}`}>
            {hasAccessToCurrentPath ? (
              children
            ) : (
              <div className="liquid-glass-card mx-auto max-w-2xl rounded-3xl p-8 text-center space-y-4 mt-8">
                <div className="liquid-droplet-pill mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl">
                  🔒
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  Access Denied — Module Restricted for {roleInfo.label}
                </h1>
                <p className="text-sm text-slate-700">
                  Your current role (<strong>{roleInfo.label}</strong>) does not have permission to
                  open{' '}
                  <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs font-mono text-red-700">
                    {pathname}
                  </code>
                  . You only have access to <strong>{allowedModules.length} permitted modules</strong>:
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {allowedModules.map((m) => (
                    <Link
                      key={m.id}
                      href={m.href}
                      className="liquid-droplet-pill inline-flex min-h-11 items-center rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 hover:bg-white/80"
                    >
                      <span>{m.name}</span>
                    </Link>
                  ))}
                </div>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
                  >
                    ← Return to Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Liquid Glass Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-md"
          onClick={() => {
            if (!signingOut) setShowSignOutModal(false)
          }}
        >
          <div
            className="liquid-glass-card w-full max-w-md rounded-3xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="liquid-droplet-pill flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-red-600">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  Sign out of ConstructMS?
                </h2>
                <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                  Are you sure you want to log out of your account? You can sign back in anytime
                  using Google or your email and password.
                </p>
              </div>
            </div>

            <div className="liquid-droplet-pill flex items-center justify-between rounded-2xl p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-9 w-9 rounded-full border border-white object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
                    {(user.fullName || user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {user.fullName || user.email}
                  </p>
                  <p className="truncate text-[11px] text-slate-700">{user.email}</p>
                </div>
              </div>
              <span
                className={`ml-2 shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${roleInfo.badgeColor}`}
              >
                {roleInfo.label}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={signingOut}
                onClick={() => setShowSignOutModal(false)}
                className="liquid-droplet-pill min-h-11 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 hover:bg-white/80 disabled:opacity-50"
              >
                Stay Signed In
              </button>

              <form
                action="/auth/signout"
                method="post"
                onSubmit={() => setSigningOut(true)}
              >
                <button
                  type="submit"
                  disabled={signingOut}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-red-700 hover:to-rose-700 disabled:opacity-60"
                >
                  {signingOut ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Signing out…</span>
                    </>
                  ) : (
                    <span>Yes, Sign Out</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
