'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WorkerRecord, AttendanceRecord, ProjectRecord } from '@/lib/module-store'

export default function AttendanceClient({
  initialWorkers,
  initialAttendance,
  projects,
}: {
  initialWorkers: WorkerRecord[]
  initialAttendance: AttendanceRecord[]
  projects: ProjectRecord[]
}) {
  const router = useRouter()
  const [workers] = useState(initialWorkers)
  const [attendance, setAttendance] = useState(initialAttendance)
  const [workerId, setWorkerId] = useState(initialWorkers[0]?.id ?? '')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [date, setDate] = useState('2026-11-04')
  const [hours, setHours] = useState('8')
  const [status, setStatus] = useState<'present' | 'half_day' | 'absent'>('present')
  const [error, setError] = useState<string | null>(null)

  async function handleLogAttendance(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/modules/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'log_attendance',
        worker_id: workerId,
        project_id: projectId,
        attendance_date: date,
        hours_worked: Number(hours),
        status,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setAttendance([data.item, ...attendance])
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

      <form
        onSubmit={handleLogAttendance}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
      >
        <h2 className="text-base font-bold text-gray-900">Record Daily Worker Attendance</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <select
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name} ({w.trade})
              </option>
            ))}
          </select>

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
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
          />

          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Hours (e.g. 8)"
            className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'present' | 'half_day' | 'absent')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            <option value="present">Present (Full Day)</option>
            <option value="half_day">Half Day</option>
            <option value="absent">Absent</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Save Attendance Record
        </button>
      </form>

      {/* Worker Roster */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Site Workers &amp; Daily Rates</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {workers.map((w) => (
            <div key={w.id} className="rounded-xl border border-gray-200 p-4 text-xs space-y-1">
              <p className="text-sm font-bold text-gray-900">{w.full_name}</p>
              <p className="font-medium text-amber-700">{w.trade}</p>
              <p className="text-gray-500">📞 {w.phone}</p>
              <p className="font-semibold text-gray-900">Daily Rate: ₱{w.daily_rate}/day</p>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Log */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Attendance Log</h2>
        <div className="mt-4 space-y-2">
          {attendance.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs"
            >
              <div>
                <strong className="text-gray-900">{a.worker_name}</strong> •{' '}
                <span className="text-gray-600">{projectMap[a.project_id] || 'Site'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">{a.hours_worked} hrs</span>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 font-semibold uppercase text-green-800">
                  {a.status.replace('_', ' ')}
                </span>
                <span className="text-gray-400">{a.attendance_date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

