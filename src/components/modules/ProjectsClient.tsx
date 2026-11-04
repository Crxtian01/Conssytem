'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectRecord } from '@/lib/module-store'
import { ROLES, type UserRole } from '@/lib/roles'

export default function ProjectsClient({
  initialProjects,
  role,
}: {
  initialProjects: ProjectRecord[]
  role: UserRole
}) {
  const router = useRouter()
  const perms = ROLES[role].permissions
  const [projects, setProjects] = useState(initialProjects)
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
                  <p className="text-xs font-medium text-amber-700">📍 {p.location}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-amber-900">
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
                  <span className="italic text-gray-400">Budget hidden for {role} role</span>
                )}
              </div>

              <div>
                <div className="mb-1 flex justify-between font-semibold text-gray-800">
                  <span>Overall Progress</span>
                  <span>{p.progress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              {perms.manageProjects && (
                <div className="flex items-center gap-2 pt-1">
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
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

