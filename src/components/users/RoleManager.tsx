'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ROLES,
  getModulesForRole,
  normalizeRole,
  type UserRole,
} from '@/lib/roles'
import type { RoleRequestRecord } from '@/lib/module-store'

interface ProfileRow {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  email_verified: boolean
  created_at: string
}

interface RoleManagerProps {
  currentUserId: string
  currentUserRole: UserRole
  profiles: ProfileRow[]
  roleRequests?: RoleRequestRecord[]
}

export default function RoleManager({
  currentUserId,
  currentUserRole,
  profiles,
  roleRequests = [],
}: RoleManagerProps) {
  const router = useRouter()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRoleRequestDecision(
    requestId: string,
    decision: 'approve_request' | 'reject_request'
  ) {
    setUpdatingId(requestId)
    setMessage(null)
    setError(null)

    const res = await fetch('/api/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: decision, requestId }),
    })

    const data = await res.json()
    setUpdatingId(null)

    if (!res.ok) {
      setError(data.error || 'Failed to process role request')
      return
    }

    setMessage(
      decision === 'approve_request'
        ? 'Role request approved and user permissions updated!'
        : 'Role request rejected.'
    )
    router.refresh()
  }

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

    setMessage(`Role updated to ${ROLES[newRole].label}. Sidebar modules & access updated!`)
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

      {/* Quick Role Switcher for the 4 Project Roles */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Switch Your Role (Current: {ROLES[currentUserRole]?.label})
            </h2>
            <p className="text-xs text-gray-600">
              Click any of the 4 system roles below to see the sidebar strictly limit the modules
              for that role.
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
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                    active
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {ROLES[r].label} ({getModulesForRole(r).length} modules)
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Role Requests Approval Queue (Admin / Engineer Exclusive) */}
      <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-purple-950">
              Role Upgrade Requests Queue ({roleRequests.filter((r) => r.status === 'pending').length} Pending)
            </h2>
            <p className="mt-0.5 text-xs text-purple-800">
              Only <strong>Admin / Engineer</strong> can approve or reject role requests submitted by team members.
            </p>
          </div>
          <span className="rounded-full bg-purple-100 border border-purple-200 px-3 py-1 text-xs font-bold text-purple-900">
            Admin / Engineer Exclusive Authority
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          {roleRequests.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">No role requests submitted yet.</p>
          ) : (
            roleRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-200 bg-white p-3.5 text-xs"
              >
                <div>
                  <div className="font-bold text-gray-900">
                    {req.user_name} ({req.user_email})
                  </div>
                  <div className="mt-0.5 text-gray-600">
                    Current: <strong>{ROLES[req.current_role]?.label ?? req.current_role}</strong> →
                    Requested: <strong className="text-purple-800">{ROLES[req.requested_role]?.label ?? req.requested_role}</strong>
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-500">Reason: {req.reason}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      req.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {req.status}
                  </span>
                  {req.status === 'pending' && currentUserRole === 'admin_engineer' && (
                    <>
                      <button
                        type="button"
                        disabled={updatingId === req.id}
                        onClick={() => handleRoleRequestDecision(req.id, 'approve_request')}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve Role
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === req.id}
                        onClick={() => handleRoleRequestDecision(req.id, 'reject_request')}
                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4 Roles & Strictly Limited Modules Matrix */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          4 System Roles &amp; Strictly Limited Module Access
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Every role can only see and open the modules assigned to it.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 px-4">Access Scope</th>
                <th className="py-3 pl-4">Allowed Modules in Sidebar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(Object.keys(ROLES) as UserRole[]).map((key) => {
                const r = ROLES[key]
                const mods = getModulesForRole(key)
                return (
                  <tr key={key} className="align-top">
                    <td className="py-4 pr-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${r.badgeColor}`}
                      >
                        {r.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-700">{r.typicalAccess}</td>
                    <td className="py-4 pl-4">
                      <div className="flex flex-wrap gap-1.5">
                        {mods.map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-800"
                          >
                            <span>{m.icon}</span>
                            <span>{m.name}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registered Users Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Registered Users ({profiles.length})
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Assign each user one of the 4 project roles: <strong>Admin / Engineer</strong>,{' '}
          <strong>Assistant</strong>, <strong>Contractor</strong>, or <strong>Client</strong>.
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
                const normalized = normalizeRole(p.role)
                const rInfo = ROLES[normalized]
                const canEdit =
                  currentUserRole === 'admin_engineer' || p.id === currentUserId
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
                        value={normalized}
                        disabled={!canEdit || updatingId === p.id}
                        onChange={(e) =>
                          handleRoleChange(p.id, e.target.value as UserRole)
                        }
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
