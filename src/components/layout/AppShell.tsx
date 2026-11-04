'use client'

import { useState } from 'react'
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

export default function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [switchingRole, setSwitchingRole] = useState(false)

  const roleInfo = ROLES[user.role] ?? ROLES.contractor
  const allowedModules = getModulesForRole(user.role)
  const hasAccessToCurrentPath = canRoleAccessPath(user.role, pathname)

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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile top bar */}
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

        {/* Logged-in user summary + 4-Role Switcher */}
        <div className="border-b border-gray-100 p-4 space-y-3">
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

          <div>
            <label
              htmlFor="sidebarRoleSelect"
              className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1"
            >
              Active Role (4 System Roles)
            </label>
            <select
              id="sidebarRoleSelect"
              value={user.role}
              disabled={switchingRole}
              onChange={(e) => handleQuickRoleSwitch(e.target.value as UserRole)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-900 focus:border-amber-500 focus:outline-none disabled:opacity-50"
            >
              <option value="admin_engineer">Admin / Engineer (All Modules)</option>
              <option value="assistant">Assistant (All Modules)</option>
              <option value="contractor">Contractor (Site Modules Only)</option>
              <option value="client">Client (Read-Only Modules)</option>
            </select>
          </div>
        </div>

        {/* Strictly Limited Role-Filtered Module Links */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Allowed Modules ({allowedModules.length})
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

      {/* Main content area — strictly blocks unauthorized modules */}
      <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8 overflow-y-auto">
        {hasAccessToCurrentPath ? (
          children
        ) : (
          <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm text-center space-y-4 mt-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
              🔒
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Module Restricted for {roleInfo.label}
            </h1>
            <p className="text-sm text-gray-600">
              Your current role (<strong>{roleInfo.label}</strong>) only has access to{' '}
              <strong>{allowedModules.length} permitted modules</strong>:
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {allowedModules.map((m) => (
                <Link
                  key={m.id}
                  href={m.href}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                >
                  <span>{m.icon}</span>
                  <span>{m.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Phone-first bottom quick bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
        {allowedModules.slice(0, 5).map((mod) => {
          const active =
            mod.href === '/' ? pathname === '/' : pathname.startsWith(mod.href)
          return (
            <Link
              key={mod.id}
              href={mod.href}
              className={`flex flex-col items-center justify-center py-2 text-[11px] font-medium ${
                active ? 'text-amber-600 font-bold' : 'text-gray-600'
              }`}
            >
              <span className="text-base leading-none">{mod.icon}</span>
              <span className="mt-1 truncate max-w-[64px]">{mod.name.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
