'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectRecord, CooperationRequestRecord } from '@/lib/module-store'
import { ROLES, type UserRole } from '@/lib/roles'

export default function ProjectsClient({
  initialProjects,
  role,
  joinedMembers = [],
}: {
  initialProjects: ProjectRecord[]
  role: UserRole
  joinedMembers?: CooperationRequestRecord[]
}) {
  const router = useRouter()
  const perms = ROLES[role].permissions
  const [projects, setProjects] = useState(initialProjects)
  const [members, setMembers] = useState<CooperationRequestRecord[]>(joinedMembers)
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [startDate, setStartDate] = useState('2026-11-04')
  const [endDate, setEndDate] = useState('2027-06-30')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/modules/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        name,
        location,
        description,
        budget: Number(budget || 0),
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        progress: 0,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(data.error)
      return
    }
    setProjects([data.item, ...projects])
    setName('')
    setLocation('')
    setDescription('')
    setBudget('')
    router.refresh()
  }

  async function handleProgressUpdate(id: string, progress: number) {
    const res = await fetch('/api/modules/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_progress',
        id,
        progress,
        status: progress === 100 ? 'completed' : 'active',
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setProjects(projects.map((p) => (p.id === id ? data.item : p)))
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch('/api/modules/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    if (res.ok) {
      setProjects(projects.filter((p) => p.id !== id))
      router.refresh()
    }
  }

  async function handleApproveMember(requestId: string) {
    setBusyMemberId(requestId)
    const res = await fetch('/api/cooperation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve_request', requestId }),
    })
    const data = await res.json()
    setBusyMemberId(null)
    if (res.ok && data.request) {
      setMembers((prev) =>
        prev.map((m) => (m.id === requestId ? data.request : m))
      )
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {perms.manageProjects && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-gray-900">+ Create New Construction Project</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input
              type="text"
              required
              placeholder="Project Name (e.g. North Wing Hospital)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
            <input
              type="text"
              required
              placeholder="Site Location (e.g. Cebu IT Park)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
            <input
              type="number"
              min="0"
              required
              placeholder="Budget (₱)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
            <input
              type="text"
              placeholder="Scope / Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create Project'}
          </button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((p) => (
          <div
            key={p.id}
            className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                  <p className="text-xs font-medium text-amber-700">{p.location}</p>
                </div>
                <span className="inline-flex items-center whitespace-nowrap shrink-0 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 text-xs font-semibold uppercase shadow-xs">
                  {p.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-600">{p.description}</p>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-3 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>
                  Timeline: {p.start_date} → {p.end_date || 'TBD'}
                </span>
                {perms.viewBudgets ? (
                  <span className="font-bold text-gray-900">
                    Budget: ₱{p.budget.toLocaleString()}
                  </span>
                ) : (
                  <span className="italic text-gray-400">
                    Assigned Site ({ROLES[role].label})
                  </span>
                )}
              </div>

              <div>
                <div className="mb-1 flex justify-between font-semibold text-gray-800">
                  <span>Overall Progress</span>
                  <span>{p.progress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90 border border-white/10 shadow-inner">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-teal-400 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              {/* Only display Joined Project Members on the specific project they chose */}
              {(() => {
                const membersForProject = members.filter(
                  (m) =>
                    m.project_name.toLowerCase() === p.name.toLowerCase() &&
                    m.status !== 'rejected'
                )
                if (membersForProject.length === 0) return null

                return (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 space-y-2.5 backdrop-blur-md shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        Joined Project Team ({membersForProject.length})
                      </span>
                      <span className="text-[10px] font-medium text-emerald-300/80">
                        Lead Engineer: lacuatachristian01@gmail.com
                      </span>
                    </div>
                    <div className="space-y-2">
                      {membersForProject.map((m) => {
                        const roleLabel =
                          ROLES[m.requested_role]?.label || 'Contractor'
                        return (
                          <div
                            key={m.id}
                            className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-white/10 bg-slate-900/90 p-3 text-xs shadow-xs backdrop-blur-md"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-white text-xs">
                                  {m.full_name || 'Project Member'}
                                </span>
                                <span className="text-slate-400 font-mono text-[11px]">
                                  ({m.email})
                                </span>
                              </div>
                              <div className="mt-1 text-[11px] font-semibold text-amber-300">
                                Role: {roleLabel}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center whitespace-nowrap shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  m.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_10px_rgba(52,211,153,0.15)]'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                                }`}
                              >
                                {m.status === 'approved'
                                  ? `${roleLabel} • Joined`
                                  : 'Pending Approval'}
                              </span>
                              {m.status === 'pending' && role === 'admin_engineer' && (
                                <button
                                  type="button"
                                  disabled={busyMemberId === m.id}
                                  onClick={() => handleApproveMember(m.id)}
                                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-500 shadow-xs disabled:opacity-50 transition"
                                >
                                  Approve
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              <div className="flex items-center justify-between pt-1">
                {perms.updateProjectProgress ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Update %:</span>
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleProgressUpdate(p.id, pct)}
                        className="rounded border border-gray-300 px-2 py-0.5 text-[11px] font-medium hover:bg-amber-50"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-400">Progress view only</span>
                )}

                {perms.deleteRecords && (
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="rounded border border-red-200 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
