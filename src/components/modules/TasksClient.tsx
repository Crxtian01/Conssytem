'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TaskRecord, ProjectRecord } from '@/lib/module-store'
import { ROLES, type UserRole } from '@/lib/roles'

export default function TasksClient({
  initialTasks,
  projects,
  role,
}: {
  initialTasks: TaskRecord[]
  projects: ProjectRecord[]
  role: UserRole
}) {
  const router = useRouter()
  const perms = ROLES[role].permissions
  const [tasks, setTasks] = useState(initialTasks)
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('2026-11-15')
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/modules/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        project_id: projectId,
        title,
        description,
        assigned_user_name: assignedTo || 'Site Crew',
        due_date: dueDate,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setTasks([data.item, ...tasks])
    setTitle('')
    setDescription('')
    setAssignedTo('')
    router.refresh()
  }

  async function handleUpdateTask(
    id: string,
    percent_complete: number,
    status: TaskRecord['status']
  ) {
    const res = await fetch('/api/modules/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id, percent_complete, status }),
    })
    const data = await res.json()
    if (res.ok) {
      setTasks(tasks.map((t) => (t.id === id ? data.item : t)))
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch('/api/modules/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    if (res.ok) {
      setTasks(tasks.filter((t) => t.id !== id))
      router.refresh()
    }
  }

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]))

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {perms.manageTasks && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-gray-900">
            + Assign New Task (Sends Email Notice)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder="Task Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
            <input
              type="text"
              placeholder="Assigned Worker / Contractor"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
          </div>
          <input
            type="text"
            placeholder="Task instructions / blueprint reference"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Create &amp; Assign Task
          </button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold text-amber-700">
                  {projectMap[t.project_id] || 'Project'}
                </span>
                <h3 className="font-bold text-gray-900">{t.title}</h3>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-gray-700">
                {t.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-gray-600">{t.description}</p>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Assigned: {t.assigned_user_name}</span>
              <span>Due: {t.due_date}</span>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold text-gray-800">
                <span>Completion</span>
                <span>{t.percent_complete}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${t.percent_complete}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {perms.updateTaskProgress && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-gray-500">Update Status/%:</span>
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() =>
                        handleUpdateTask(
                          t.id,
                          pct,
                          pct === 100 ? 'completed' : pct > 0 ? 'in_progress' : 'todo'
                        )
                      }
                      className="rounded border border-gray-300 px-2 py-0.5 text-xs font-medium hover:bg-gray-50"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              )}

              {perms.deleteRecords && (
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="rounded border border-red-200 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
