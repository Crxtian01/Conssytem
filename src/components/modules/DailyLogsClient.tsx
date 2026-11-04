'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DailyLogRecord, ProjectRecord } from '@/lib/module-store'
import { ROLES, type UserRole } from '@/lib/roles'

export default function DailyLogsClient({
  initialLogs,
  projects,
  role,
}: {
  initialLogs: DailyLogRecord[]
  projects: ProjectRecord[]
  role: UserRole
}) {
  const router = useRouter()
  const perms = ROLES[role].permissions
  const [logs, setLogs] = useState(initialLogs)
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [weather, setWeather] = useState<'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy'>('Sunny')
  const [notes, setNotes] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/modules/daily_logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        project_id: projectId,
        weather,
        notes,
        photos: photoUrl ? [photoUrl] : [],
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setLogs([data.item, ...logs])
    setNotes('')
    setPhotoUrl('')
    router.refresh()
  }

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]))

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {perms.logDailyProgress && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-gray-900">
            + Record Daily Site Progress Log (with Photo Upload)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
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

            <select
              value={weather}
              onChange={(e) =>
                setWeather(e.target.value as 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy')
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="Sunny">☀️ Sunny</option>
              <option value="Cloudy">⛅ Cloudy</option>
              <option value="Rainy">🌧️ Rainy</option>
              <option value="Stormy">⛈️ Stormy</option>
            </select>
          </div>

          <textarea
            rows={3}
            required
            placeholder="Describe site progress, milestones completed, safety checks, or delays today…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Upload Site Photo from Phone / Computer
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-amber-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Or Paste Photo URL
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Submit Daily Log
          </button>
        </form>
      )}

      <div className="space-y-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-amber-700">
                  {projectMap[log.project_id] || 'Project Site'}
                </span>
                <p className="text-xs text-gray-500">
                  📅 {log.log_date} • Author: {log.author_email}
                </p>
              </div>
              <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                Weather: {log.weather}
              </span>
            </div>

            <p className="text-sm text-gray-800 leading-relaxed">{log.notes}</p>

            {log.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 pt-2">
                {log.photos.map((url, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={idx}
                    src={url}
                    alt="Site progress"
                    className="h-40 w-full rounded-xl object-cover border border-gray-200"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
