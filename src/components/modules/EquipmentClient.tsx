'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EquipmentRecord, ProjectRecord } from '@/lib/module-store'

export default function EquipmentClient({
  initialEquipment,
  projects,
}: {
  initialEquipment: EquipmentRecord[]
  projects: ProjectRecord[]
}) {
  const router = useRouter()
  const [equipment, setEquipment] = useState(initialEquipment)
  const [name, setName] = useState('')
  const [serialCode, setSerialCode] = useState('')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [notes, setNotes] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/modules/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        name,
        serial_code: serialCode,
        project_id: projectId,
        status: 'available',
        notes,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setEquipment([...equipment, data.item])
      setName('')
      setSerialCode('')
      setNotes('')
      router.refresh()
    }
  }

  async function handleStatusChange(id: string, status: EquipmentRecord['status']) {
    const res = await fetch('/api/modules/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', id, status }),
    })
    const data = await res.json()
    if (res.ok) {
      setEquipment(equipment.map((eq) => (eq.id === id ? data.item : eq)))
      router.refresh()
    }
  }

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]))

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
      >
        <h2 className="text-base font-bold text-gray-900">+ Register Heavy Equipment / Tool</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            required
            placeholder="Equipment Name (e.g. Backhoe Loader)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
          />
          <input
            type="text"
            placeholder="Serial / Asset Code"
            value={serialCode}
            onChange={(e) => setSerialCode(e.target.value)}
            className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
          />
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
            placeholder="Condition / Operator notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Add Equipment
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        {equipment.map((eq) => (
          <div
            key={eq.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{eq.name}</h3>
                <p className="font-mono text-xs text-gray-500">{eq.serial_code}</p>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-amber-900">
                {eq.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Site: <strong>{projectMap[eq.project_id] || 'Unassigned'}</strong>
            </p>
            <p className="text-xs text-gray-500">{eq.notes}</p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {(['available', 'in_use', 'maintenance'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(eq.id, st)}
                  className="rounded border border-gray-300 px-2 py-1 text-[11px] font-medium capitalize hover:bg-gray-50"
                >
                  Set {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

