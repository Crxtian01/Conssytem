'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROLES, type UserRole } from '@/lib/roles'

interface ProfileRow {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  email_verified: boolean
  created_at: string
}

interface RoleManagerProps {
  currentUserId: string
  currentUserRole: UserRole
  profiles: ProfileRow[]
}

export default function RoleManager({
  currentUserId,
  currentUserRole,
  profiles,
}: RoleManagerProps) {
  const router = useRouter()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setUpdatingId(userId)
    setMessage(null)
    setError(null)

    const res = await fetch('/api/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })

    const data = await res.json()
    setUpdatingId(null)

    if (!res.ok) {
      setError(data.error || 'Failed to update role')
      return
    }

    setMessage(`Role updated to ${ROLES[newRole].label}. Navigation & permissions refreshed!`)
    router.refresh()
  }

  return (
    <div className="space-y-8">
      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Quick Role Switcher for Testing all 6 Roles from Section 2 */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Test Role View (Your Current Role: {ROLES[currentUserRole]?.label})
            </h2>
            <p className="text-xs text-gray-600">
              Click any role below to switch your account role and see how the sidebar modules and
              permissions change for each user type in Section 2.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ROLES) as UserRole[]).map((r) => {
              const active = r === currentUserRole
              return (
                <button
                  key={r}
                  type="button"
                  disabled={updatingId === currentUserId}
                  onClick={() => handleRoleChange(currentUserId, r)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {ROLES[r].label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Section 2 Roles & Typical Access Matrix */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Section 2: Roles &amp; Typical Access Matrix
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Each role is enforced both in the UI navigation and on the backend.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 px-4">Typical Access (from Guide)</th>
                <th className="py-3 pl-4">Key Permissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(Object.keys(ROLES) as UserRole[]).map((key) => {
                const r = ROLES[key]
                return (
                  <tr key={key}>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${r.badgeColor}`}
                      >
                        {r.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{r.typicalAccess}</td>
                    <td className="py-3 pl-4 text-xs text-gray-500">
                      {r.permissions.manageUsers && 'Users/Roles • '}
                      {r.permissions.manageProjects && 'Projects • '}
                      {r.permissions.viewBudgets && 'Budgets • '}
                      {r.permissions.approveExpenses && 'Approvals • '}
                      {r.permissions.manageTasks && 'Tasks • '}
                      {r.permissions.logDailyProgress && 'Daily Logs • '}
                      {r.permissions.manageMaterials && 'Materials • '}
                      {r.permissions.recordAttendance && 'Attendance • '}
                      {r.permissions.readOnly && 'Read-Only'}
                      {key === 'worker' && 'Own Attendance & Assigned Tasks'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Members & Role Assignment Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Registered Users ({profiles.length})
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          New Google or email sign-ups start with the default <strong>Worker</strong> role until an
          Admin changes it.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-3 pr-4">User</th>
                <th className="py-3 px-4">Email Verified</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 pl-4">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles.map((p) => {
                const rInfo = ROLES[p.role] ?? ROLES.worker
                const canEdit = currentUserRole === 'admin' || p.id === currentUserId
                return (
                  <tr key={p.id}>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-900">
                        {p.full_name || 'Unnamed User'}{' '}
                        {p.id === currentUserId && (
                          <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{p.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      {p.email_verified ? (
                        <span className="text-xs font-medium text-green-700">Verified ✅</span>
                      ) : (
                        <span className="text-xs font-medium text-amber-700">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${rInfo.badgeColor}`}
                      >
                        {rInfo.label}
                      </span>
                    </td>
                    <td className="py-3 pl-4">
                      <select
                        value={p.role}
                        disabled={!canEdit || updatingId === p.id}
                        onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-900 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                      >
                        {(Object.keys(ROLES) as UserRole[]).map((roleKey) => (
                          <option key={roleKey} value={roleKey}>
                            {ROLES[roleKey].label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
