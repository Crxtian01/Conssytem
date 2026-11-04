'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROLES, getModulesForRole, type UserRole } from '@/lib/roles'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const roleInfo = ROLES[user.role] ?? ROLES.worker
  const allowedModules = getModulesForRole(user.role)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile top bar (designed for phones first per Section 5) */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-lg">
            🏗️
          </span>
          <span className="font-bold text-gray-900">ConstructMS</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleInfo.badgeColor}`}
          >
            {roleInfo.label}
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Sidebar navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } w-full border-b border-gray-200 bg-white md:flex md:w-64 md:flex-col md:border-b-0 md:border-r`}
      >
        <div className="hidden items-center gap-3 border-b border-gray-100 px-5 py-4 md:flex">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-xl shadow-sm">
            🏗️
          </span>
          <div>
            <p className="font-bold text-gray-900 leading-tight">ConstructMS</p>
            <p className="text-xs text-gray-500">Site &amp; Project System</p>
          </div>
        </div>

        {/* Logged-in user summary + Role badge */}
        <div className="border-b border-gray-100 p-4">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-10 w-10 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800">
                {(user.fullName || user.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user.fullName || user.email}
              </p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleInfo.badgeColor}`}
            >
              {roleInfo.label}
            </span>
            <Link
              href="/users"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-medium text-amber-600 hover:text-amber-700"
            >
              Change role →
            </Link>
          </div>
        </div>

        {/* Role-filtered module links */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Modules ({allowedModules.length})
          </p>
          {allowedModules.map((mod) => {
            const active =
              mod.href === '/' ? pathname === '/' : pathname.startsWith(mod.href)
            return (
              <Link
                key={mod.id}
                href={mod.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-amber-50 text-amber-900 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span>{mod.icon}</span>
                  <span>{mod.name}</span>
                </span>
                {mod.phase > 1 && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-normal text-gray-500">
                    Phase {mod.phase}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
    </div>
  )
}
