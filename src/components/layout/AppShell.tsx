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

export default function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const shellRef = useRef<HTMLDivElement | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [switchingRole, setSwitchingRole] = useState(false)
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showRoleRequestBox, setShowRoleRequestBox] = useState(false)
  const [requestedRole, setRequestedRole] = useState<UserRole>('assistant')
  const [roleReqSent, setRoleReqSent] = useState<string | null>(null)
  const [showDemoPreview, setShowDemoPreview] = useState(false)

  useEffect(() => {
    setNavigatingTo(null)
  }, [pathname])

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

  // Close sign-out confirmation modal on Escape key
  useEffect(() => {
    if (!showSignOutModal) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !signingOut) {
        setShowSignOutModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSignOutModal, signingOut])

  const roleInfo = ROLES[user.role] ?? ROLES.contractor
  const allowedModules = getModulesForRole(user.role)
  const hasAccessToCurrentPath = canRoleAccessPath(user.role, pathname)
  const isTransitioning = Boolean(navigatingTo) || switchingRole

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

  return (
    <div
      ref={shellRef}
      className="liquid-mesh-bg relative min-h-screen flex flex-col md:flex-row overflow-x-hidden text-slate-900"
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

      {/* Mobile Liquid Glass top bar */}
      <header className="liquid-glass-sidebar sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="liquid-droplet-pill flex h-9 w-9 items-center justify-center rounded-xl p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/constructms-sculpture.png"
              alt="ConstructMS Logo"
              className="h-full w-full object-contain"
            />
          </span>
          <div className="leading-none">
            <span className="block font-extrabold tracking-tight text-slate-900">ConstructMS</span>
            <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-slate-600">
              Construction Management
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`liquid-droplet-pill rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleInfo.badgeColor}`}
          >
            {roleInfo.label}
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="liquid-droplet-pill rounded-xl p-2 text-slate-800"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Floating Liquid Glass Sidebar Dock */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } liquid-glass-sidebar relative z-20 w-full md:m-3.5 md:flex md:w-64 md:flex-col md:rounded-[28px] md:shrink-0`}
      >
        {/* Specular Top Glint Line */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
        />

        <div className="hidden items-center gap-3 border-b border-white/50 px-5 py-4 md:flex">
          <span className="liquid-droplet-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/constructms-sculpture.png"
              alt="ConstructMS Logo"
              className="h-full w-full object-contain"
            />
          </span>
          <div>
            <p className="font-extrabold text-slate-900 leading-tight tracking-tight">
              ConstructMS
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
              Construction Management
            </p>
          </div>
        </div>

        {/* Logged-in user summary + 4-Role Switcher */}
        <div className="border-b border-white/50 p-4 space-y-3">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-10 w-10 rounded-full border-2 border-white/90 object-cover shadow-sm"
              />
            ) : (
              <div className="liquid-droplet-pill flex h-10 w-10 items-center justify-center rounded-full font-bold text-amber-900">
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
            <div className="flex items-center justify-between">
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
                  className="liquid-droplet-pill w-full rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-800 hover:bg-white/80 transition"
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
                      className="w-full rounded-lg border border-white/80 bg-white/80 px-2 py-1 text-xs font-semibold text-slate-900"
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
                      className="w-full rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-700 disabled:opacity-50"
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

            {/* Discrete Demo Role Preview toggle for testing the 4 separate role dashboards */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowDemoPreview((v) => !v)}
                className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 underline"
              >
                {showDemoPreview ? 'Hide Role Preview' : 'Demo: Preview Other Role Dashboard'}
              </button>
              {showDemoPreview && (
                <select
                  aria-label="Preview role dashboard"
                  value={user.role}
                  disabled={switchingRole}
                  onChange={(e) => handleQuickRoleSwitch(e.target.value as UserRole)}
                  className="liquid-droplet-pill mt-1 w-full rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none disabled:opacity-50"
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

        {/* Strictly Limited Role-Filtered Module Links */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
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
                  setMobileMenuOpen(false)
                  if (!active) {
                    setNavigatingTo(mod.name)
                  }
                }}
                className={`group flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
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

        {/* Sign Out Trigger Button */}
        <div className="border-t border-white/50 p-3">
          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="liquid-droplet-pill flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold text-slate-800 transition hover:border-red-300 hover:bg-red-500/20 hover:text-red-900"
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
      </aside>

      {/* Main content area — Liquid Glassmorphism Workspace for Dashboard & All Modules */}
      <main className="liquid-workspace relative z-10 flex-1 p-4 pb-24 md:p-7 md:pb-8 overflow-y-auto">
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

        <div className={isTransitioning ? 'opacity-60 transition-opacity duration-150' : ''}>
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
                    className="liquid-droplet-pill inline-flex items-center rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-900 hover:bg-white/80"
                  >
                    <span>{m.name}</span>
                  </Link>
                ))}
              </div>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
                >
                  ← Return to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Phone-first bottom Liquid Glass quick bar */}
      <nav className="liquid-glass-sidebar fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 md:hidden">
        {allowedModules.slice(0, 5).map((mod) => {
          const active =
            mod.href === '/' ? pathname === '/' : pathname.startsWith(mod.href)
          return (
            <Link
              key={mod.id}
              href={mod.href}
              onClick={() => {
                if (!active) setNavigatingTo(mod.name)
              }}
              className={`flex items-center justify-center py-3 text-[11px] font-medium ${
                active ? 'text-amber-800 font-bold' : 'text-slate-800'
              }`}
            >
              <span className="truncate max-w-[68px]">{mod.name.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>

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
                className="liquid-droplet-pill rounded-xl px-4 py-2 text-xs font-bold text-slate-800 hover:bg-white/80 disabled:opacity-50"
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
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-red-700 hover:to-rose-700 disabled:opacity-60"
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
