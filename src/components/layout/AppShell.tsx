'use client'

import { useEffect, useState } from 'react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [switchingRole, setSwitchingRole] = useState(false)
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    setNavigatingTo(null)
  }, [pathname])

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
    <div className="relative min-h-screen flex flex-col md:flex-row overflow-x-hidden bg-[#f2efe9] text-gray-900">
      {/* Ambient Liquid Glass Mesh & Refracting Orbs Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div
          className="liquid-orb absolute -top-28 -left-24 h-[28rem] w-[28rem] rounded-full opacity-70 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(251,191,36,0.42) 0%, rgba(245,158,11,0.18) 55%, transparent 75%)',
          }}
        />
        <div
          className="liquid-orb absolute top-[18%] right-[-8%] h-[32rem] w-[32rem] rounded-full opacity-65 blur-3xl"
          style={{
            animationDelay: '-5s',
            background:
              'radial-gradient(circle, rgba(147,197,253,0.42) 0%, rgba(196,181,253,0.24) 55%, transparent 75%)',
          }}
        />
        <div
          className="liquid-orb absolute bottom-[-10%] left-[28%] h-[30rem] w-[30rem] rounded-full opacity-65 blur-3xl"
          style={{
            animationDelay: '-11s',
            background:
              'radial-gradient(circle, rgba(253,224,71,0.32) 0%, rgba(110,231,183,0.22) 55%, transparent 75%)',
          }}
        />
        <div
          className="

          absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Top animated progress bar when switching modules or roles */}
      {(isTransitioning || signingOut) && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/40 backdrop-blur-md overflow-hidden">
          <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />
        </div>
      )}

      {/* Mobile Liquid Glass top bar */}
      <header className="liquid-glass-sidebar sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-lg text-white shadow-sm">
            🏗️
          </span>
          <span className="font-bold text-gray-900">ConstructMS</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md ${roleInfo.badgeColor}`}
          >
            {roleInfo.label}
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="rounded-xl border border-white/80 bg-white/60 p-2 text-gray-700 backdrop-blur-md hover:bg-white/90"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Floating Liquid Glass Sidebar navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } liquid-glass-sidebar relative z-20 w-full md:m-3 md:flex md:w-64 md:flex-col md:rounded-3xl md:shrink-0`}
      >
        <div className="hidden items-center gap-3 border-b border-white/60 px-5 py-4 md:flex">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-xl text-white shadow-[0_6px_16px_rgba(217,119,6,0.35),inset_0_1px_1px_rgba(255,255,255,0.6)]">
            🏗️
          </span>
          <div>
            <p className="font-extrabold text-gray-900 leading-tight tracking-tight">
              ConstructMS
            </p>
            <p className="text-[11px] font-medium text-gray-500">
              Liquid Glass Workspace
            </p>
          </div>
        </div>

        {/* Logged-in user summary + 4-Role Switcher */}
        <div className="border-b border-white/60 p-4 space-y-3">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-10 w-10 rounded-full border-2 border-white/90 object-cover shadow-xs"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-gradient-to-br from-amber-100 to-amber-200/80 font-bold text-amber-900 shadow-xs">
                {(user.fullName || user.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900">
                {user.fullName || user.email}
              </p>
              <p className="truncate text-xs text-gray-600">{user.email}</p>
            </div>
          </div>

          <div>
            <label
              htmlFor="sidebarRoleSelect"
              className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1"
            >
              Active Role (4 System Roles)
            </label>
            <select
              id="sidebarRoleSelect"
              value={user.role}
              disabled={switchingRole}
              onChange={(e) => handleQuickRoleSwitch(e.target.value as UserRole)}
              className="w-full rounded-xl border border-white/80 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md focus:border-amber-500 focus:outline-none disabled:opacity-50"
            >
              <option value="admin_engineer">Admin / Engineer (15 Modules)</option>
              <option value="assistant">Assistant (15 Modules)</option>
              <option value="contractor">Contractor (6 Site Modules)</option>
              <option value="client">Client (5 Read-Only Modules)</option>
            </select>
          </div>
        </div>

        {/* Strictly Limited Role-Filtered Module Links */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
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
                    ? 'border border-white/90 bg-white/85 text-amber-950 font-semibold shadow-[0_6px_20px_-4px_rgba(217,119,6,0.16),inset_0_1px_1px_rgba(255,255,255,1)]'
                    : 'border border-transparent text-gray-700 hover:border-white/60 hover:bg-white/50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-xl border transition ${
                      active || isLoadingThis
                        ? 'border-amber-300/80 bg-gradient-to-br from-amber-100 to-amber-200/70 text-amber-900 shadow-2xs'
                        : 'border-white/80 bg-white/65 text-gray-700 group-hover:border-amber-200/70 group-hover:bg-white/90'
                    }`}
                  >
                    {isLoadingThis ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-700 border-t-transparent" />
                    ) : (
                      <SidebarModuleIcon id={mod.id} fallback={mod.icon} />
                    )}
                  </span>
                  <span>{mod.name}</span>
                </span>
                {isLoadingThis && (
                  <span className="text-[10px] font-semibold text-amber-700">
                    Opening…
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out Trigger Button (Opens Confirmation Modal) */}
        <div className="border-t border-white/60 p-3">
          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/60 px-3 py-2 text-sm font-semibold text-gray-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md transition hover:border-red-200 hover:bg-red-50/80 hover:text-red-700"
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

      {/* Main content area — Liquid Glass Workspace for Dashboard & All Modules */}
      <main className="liquid-workspace relative z-10 flex-1 p-4 pb-24 md:p-7 md:pb-8 overflow-y-auto">
        {isTransitioning && (
          <div className="liquid-glass-card mb-4 rounded-2xl px-4 py-2.5 text-xs font-semibold text-amber-950 flex items-center gap-2.5">
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
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-200/80 bg-red-100/80 text-2xl shadow-xs">
                🔒
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Access Denied — Module Restricted for {roleInfo.label}
              </h1>
              <p className="text-sm text-gray-600">
                Your current role (<strong>{roleInfo.label}</strong>) does not have permission to
                open{' '}
                <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs font-mono text-red-700">
                  {pathname}
                </code>
                . You only have access to <strong>{allowedModules.length} permitted modules</strong>:
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {allowedModules.map((m) => (
                  <Link
                    key={m.id}
                    href={m.href}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/90 bg-white/75 px-3 py-1.5 text-xs font-semibold text-amber-950 shadow-2xs backdrop-blur-md hover:bg-white"
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
                active ? 'text-amber-700 font-bold' : 'text-gray-700'
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-200/80 bg-red-50/90 text-red-600 shadow-xs">
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
                <h2 className="text-lg font-bold text-gray-900">
                  Sign out of ConstructMS?
                </h2>
                <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                  Are you sure you want to log out of your account? You can sign back in anytime
                  using Google or your email and password.
                </p>
              </div>
            </div>

            {/* Account Summary Card */}
            <div className="flex items-center justify-between rounded-2xl border border-white/90 bg-white/65 p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md">
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
                  <p className="truncate text-xs font-bold text-gray-900">
                    {user.fullName || user.email}
                  </p>
                  <p className="truncate text-[11px] text-gray-600">{user.email}</p>
                </div>
              </div>
              <span
                className={`ml-2 shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${roleInfo.badgeColor}`}
              >
                {roleInfo.label}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={signingOut}
                onClick={() => setShowSignOutModal(false)}
                className="rounded-xl border border-white/90 bg-white/75 px-4 py-2 text-xs font-semibold text-gray-800 shadow-2xs hover:bg-white disabled:opacity-50"
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
