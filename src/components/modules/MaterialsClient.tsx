'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  MaterialRecord,
  MaterialTxRecord,
  MaterialRequestRecord,
  ProjectRecord,
} from '@/lib/module-store'
import { ROLES, type UserRole } from '@/lib/roles'

export default function MaterialsClient({
  initialMaterials,
  initialTransactions,
  initialRequests = [],
  projects,
  role,
}: {
  initialMaterials: MaterialRecord[]
  initialTransactions: MaterialTxRecord[]
  initialRequests?: MaterialRequestRecord[]
  projects: ProjectRecord[]
  role: UserRole
}) {
  const router = useRouter()
  const perms = ROLES[role].permissions
  const [materials, setMaterials] = useState(initialMaterials)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [requests, setRequests] = useState(initialRequests)
  const [selectedMaterialId, setSelectedMaterialId] = useState(initialMaterials[0]?.id ?? '')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [txType, setTxType] = useState<'in' | 'out'>('out')
  const [quantity, setQuantity] = useState('10')
  const [notes, setNotes] = useState('')

  // Material Request state
  const [reqMaterialId, setReqMaterialId] = useState(initialMaterials[0]?.id ?? '')
  const [reqProjectId, setReqProjectId] = useState(projects[0]?.id ?? '')
  const [reqQty, setReqQty] = useState('50')
  const [reqUrgency, setReqUrgency] = useState<'Normal' | 'High' | 'Critical'>('High')
  const [reqNotes, setReqNotes] = useState('')

  const [alertMsg, setAlertMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const lowStockItems = materials.filter((m) => m.current_stock <= m.reorder_level)
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]))

  async function handleTransaction(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setAlertMsg(null)

    const res = await fetch('/api/modules/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'transaction',
        material_id: selectedMaterialId,
        project_id: projectId,
        transaction_type: txType,
        quantity: Number(quantity),
        notes,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setMaterials(materials.map((m) => (m.id === data.item.id ? data.item : m)))
    setTransactions([data.transaction, ...transactions])
    setNotes('')
    if (data.lowStockTriggered) {
      setAlertMsg(
        `Low-stock warning: "${data.item.name}" is now at ${data.item.current_stock} ${data.item.unit} (Reorder level: ${data.item.reorder_level}). Email alert sent!`
      )
    }
    router.refresh()
  }

  async function handleCreateRequest(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setAlertMsg(null)

    const res = await fetch('/api/modules/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_request',
        material_id: reqMaterialId,
        project_id: reqProjectId,
        quantity: Number(reqQty),
        urgency: reqUrgency,
        notes: reqNotes,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setRequests([data.item, ...requests])
    setReqNotes('')
    setAlertMsg('Material Request submitted as Pending for Admin / Engineer approval.')
    router.refresh()
  }

  async function handleRequestDecision(
    id: string,
    action: 'approve_request' | 'reject_request'
  ) {
    setError(null)
    const res = await fetch('/api/modules/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setRequests(requests.map((r) => (r.id === id ? data.item : r)))
    if (data.updatedMaterial) {
      setMaterials(
        materials.map((m) => (m.id === data.updatedMaterial.id ? data.updatedMaterial : m))
      )
    }
    router.refresh()
  }

  async function handleDeleteMaterial(id: string) {
    const res = await fetch('/api/modules/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    if (res.ok) {
      setMaterials(materials.filter((m) => m.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-bold">
            Low-Stock Alert ({lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}{' '}
            at or below reorder level):
          </p>
          <ul className="mt-1 list-disc pl-5 text-xs space-y-0.5">
            {lowStockItems.map((m) => (
              <li key={m.id}>
                <strong>{m.name}</strong>: {m.current_stock} {m.unit} remaining (Reorder level:{' '}
                {m.reorder_level} {m.unit})
              </li>
            ))}
          </ul>
        </div>
      )}

      {alertMsg && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          {alertMsg}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {perms.manageMaterials && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Encode Stock In / Stock Out */}
          <form
            onSubmit={handleTransaction}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
          >
            <h2 className="text-base font-bold text-gray-900">
              1. Encode Material Stock In / Stock Out
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.current_stock} {m.unit})
                  </option>
                ))}
              </select>

              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as 'in' | 'out')}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900"
              >
                <option value="in">+ Stock IN (Received)</option>
                <option value="out">- Stock OUT (Used on Site)</option>
              </select>

              <input
                type="number"
                min="1"
                required
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
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
            </div>
            <input
              type="text"
              placeholder="Notes (e.g. Delivery receipt #)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Record Stock Transaction
            </button>
          </form>

          {/* Create Material Request */}
          <form
            onSubmit={handleCreateRequest}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
          >
            <div>
              <h2 className="text-base font-bold text-gray-900">
                2. Create Material Request (Requires Admin/Engineer Approval)
              </h2>
              <p className="text-xs text-gray-500">
                Submit a requisition for low-stock or needed site materials.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={reqMaterialId}
                onChange={(e) => setReqMaterialId(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>

              <select
                value={reqProjectId}
                onChange={(e) => setReqProjectId(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                required
                placeholder="Requested Quantity"
                value={reqQty}
                onChange={(e) => setReqQty(e.target.value)}
                className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
              />

              <select
                value={reqUrgency}
                onChange={(e) =>
                  setReqUrgency(e.target.value as 'Normal' | 'High' | 'Critical')
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900"
              >
                <option value="Normal">Urgency: Normal</option>
                <option value="High">Urgency: High</option>
                <option value="Critical">Urgency: Critical</option>
              </select>
            </div>
            <input
              type="text"
              required
              placeholder="Purpose / Justification (e.g. For 9th floor slab pouring)"
              value={reqNotes}
              onChange={(e) => setReqNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Submit Material Request (Pending)
            </button>
          </form>
        </div>
      )}

      {/* Material Requests & Admin/Engineer Approvals */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Material Requests &amp; Requisition Approvals ({requests.length})
            </h2>
            <p className="text-xs text-gray-500">
              Only Admin / Engineer can approve or reject material requests.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-2.5">
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">
                    {r.quantity} {r.unit} × {r.material_name}
                  </span>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                    {r.urgency}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {projectMap[r.project_id] || 'Project'} • Requested by {r.requested_by_email} —{' '}
                  {r.notes}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                    r.approval_status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : r.approval_status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {r.approval_status}
                </span>

                {perms.approveMaterialRequests && r.approval_status === 'pending' && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRequestDecision(r.id, 'approve_request')}
                      className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestDecision(r.id, 'reject_request')}
                      className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Current Material Inventory</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-3 pr-4">Material</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Reorder Level</th>
                <th className="py-3 px-4">Unit Cost</th>
                <th className="py-3 pl-4">Status</th>
                {perms.deleteRecords && <th className="py-3 pl-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materials.map((m) => {
                const isLow = m.current_stock <= m.reorder_level
                return (
                  <tr key={m.id}>
                    <td className="py-3 pr-4 font-semibold text-gray-900">{m.name}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {m.current_stock} {m.unit}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {m.reorder_level} {m.unit}
                    </td>
                    <td className="py-3 px-4 text-gray-600">₱{m.unit_cost.toLocaleString()}</td>
                    <td className="py-3 pl-4">
                      {isLow ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    {perms.deleteRecords && (
                      <td className="py-3 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteMaterial(m.id)}
                          className="rounded border border-red-200 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Recent Stock In / Out Transactions</h2>
        <div className="mt-4 space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs"
            >
              <div>
                <span
                  className={`mr-2 rounded px-2 py-0.5 font-bold uppercase ${
                    tx.transaction_type === 'in'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Stock {tx.transaction_type}
                </span>
                <strong className="text-gray-900">
                  {tx.quantity} × {tx.material_name}
                </strong>
                {tx.notes && <span className="ml-2 text-gray-500">— {tx.notes}</span>}
              </div>
              <span className="text-gray-400">{tx.transaction_date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
