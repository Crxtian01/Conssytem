'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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

function SidebarModuleIcon({ id, fallback }: { id: string; fallback: string }) {
  if (id === 'bidding') {
    return (
      <svg
        className="h-4 w-4 text-amber-700"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
        <path d="m16 16 6-6" />
        <path d="m8 8 6-6" />
        <path d="m9 7 8 8" />
        <path d="m21 11-8-8" />
        <path d="M8 22h8" />
      </svg>
    )
  }
  return <span className="text-sm leading-none">{fallback}</span>
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

      {/* Vivid Iridescent Liquid Blobs & 3D Floating Spheres Behind the Glass Cards */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        {/* Cursor-following liquid refraction spotlight */}
        <div
          className="fixed inset-0 transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(520px circle at var(--lx, 50%) var(--ly, 30%), rgba(255,255,255,0.55), rgba(56,189,248,0.18) 45%, transparent 75%)',
          }}
        />

        {/* Large Liquid Blobs */}
        <div
          className="liquid-orb absolute -top-24 -left-20 h-[32rem] w-[32rem] rounded-full opacity-85 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(251,146,60,0.72) 0%, rgba(245,158,11,0.35) 52%, transparent 75%)',
          }}
        />
        <div
          className="liquid-orb absolute top-[8%] right-[-6%] h-[36rem] w-[36rem] rounded-full opacity-85 blur-3xl"
          style={{
            animationDelay: '-5s',
            background:
              'radial-gradient(circle, rgba(56,189,248,0.72) 0%, rgba(129,140,248,0.45) 55%, transparent 75%)',
          }}
        />
        <div
          className="liquid-orb absolute bottom-[-12%] left-[25%] h-[34rem] w-[34rem] rounded-full opacity-80 blur-3xl"
          style={{
            animationDelay: '-10s',
            background:
              'radial-gradient(circle, rgba(167,139,250,0.68) 0%, rgba(52,211,153,0.42) 55%, transparent 75%)',
          }}
        />

        {/* Crisp 3D Floating Liquid Spheres visible through the frosted glass cards */}
        <div
          className="cms-float absolute top-[14%] left-[26%] h-36 w-36 rounded-full opacity-75"
          style={{
            background:
              'radial-gradient(circle at 30% 28%, #ffffff 0%, #fde68a 25%, #f59e0b 65%, #b45309 100%)',
            boxShadow:
              '0 24px 48px rgba(217,119,6,0.32), inset -8px -10px 20px rgba(120,53,15,0.35), inset 6px 6px 14px rgba(255,255,255,0.9)',
          }}
        />
        <div
          className="cms-float absolute top-[54%] right-[12%] h-44 w-44 rounded-full opacity-70"
          style={{
            animationDelay: '-3s',
            background:
              'radial-gradient(circle at 30% 28%, #ffffff 0%, #bae6fd 28%, #38bdf8 65%, #0284c7 100%)',
            boxShadow:
              '0 28px 54px rgba(2,132,199,0.28), inset -10px -12px 22px rgba(12,74,110,0.35), inset 6px 6px 16px rgba(255,255,255,0.95)',
          }}
        />
        <div
          className="cms-float absolute bottom-[12%] left-[48%] h-28 w-28 rounded-full opacity-70"
          style={{
            animationDelay: '-6s',
            background:
              'radial-gradient(circle at 30% 28%, #ffffff 0%, #ddd6fe 28%, #8b5cf6 68%, #4c1d95 100%)',
            boxShadow:
              '0 20px 40px rgba(109,40,217,0.28), inset -6px -8px 16px rgba(76,29,149,0.35), inset 5px 5px 12px rgba(255,255,255,0.95)',
          }}
        />
      </div>

      {/* Top animated progress bar when switching modules or roles */}
      {(isTransitioning || signingOut) && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/40 backdrop-blur-md overflow-hidden">
          <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-amber-500 via-sky-500 to-indigo-500" />
        </div>
      )}

      {/* Mobile Liquid Glass top bar */}
      <header className="liquid-glass-sidebar sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-lg text-white shadow-sm">
            🏗️
          </span>
          <span className="font-bold text-slate-900">ConstructMS</span>
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
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-xl text-white shadow-[0_8px_20px_rgba(217,119,6,0.4),inset_0_2px_2px_rgba(255,255,255,0.75)]">
            🏗️
          </span>
          <div>
            <p className="font-extrabold text-slate-900 leading-tight tracking-tight">
              ConstructMS
            </p>
            <p className="text-[11px] font-semibold text-slate-600">
              Liquid Glass OS
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

          <div>
            <label
              htmlFor="sidebarRoleSelect"
              className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1"
            >
              Active Role (4 System Roles)
            </label>
            <select
              id="sidebarRoleSelect"
              value={user.role}
              disabled={switchingRole}
              onChange={(e) => handleQuickRoleSwitch(e.target.value as UserRole)}
              className="liquid-droplet-pill w-full rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none disabled:opacity-50"
            >
              <option value="admin_engineer">Admin / Engineer (15 Modules)</option>
              <option value="assistant">Assistant (15 Modules)</option>
              <option value="contractor">Contractor (6 Site Modules)</option>
              <option value="client">Client (5 Read-Only Modules)</option>
            </select>
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
                className={`group flex items-center justify-between rounded-2xl px-2.5 py-2 text-sm font-medium transition-all duration-200 ${
                  active || isLoadingThis
                    ? 'liquid-droplet-pill text-slate-950 font-bold'
                    : 'border border-transparent text-slate-800 hover:border-white/60 hover:bg-white/35'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-xl transition ${
                      active || isLoadingThis
                        ? 'bg-gradient-to-br from-amber-300/90 to-amber-500/80 text-slate-950 shadow-[inset_0_1px_2px_rgba(255,255,255,0.95)]'
                        : 'liquid-droplet-pill text-slate-800'
                    }`}
                  >
                    {isLoadingThis ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-800 border-t-transparent" />
                    ) : (
                      <SidebarModuleIcon id={mod.id} fallback={mod.icon} />
                    )}
                  </span>
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
                    className="liquid-droplet-pill inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-white/80"
                  >
                    <span>{m.icon}</span>
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
              className={`flex flex-col items-center justify-center py-2 text-[11px] font-medium ${
                active ? 'text-amber-800 font-bold' : 'text-slate-800'
              }`}
            >
              <span className="text-base leading-none">{mod.icon}</span>
              <span className="mt-1 truncate max-w-[64px]">{mod.name.split(' ')[0]}</span>
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
