'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MaterialRecord, MaterialTxRecord, ProjectRecord } from '@/lib/module-store'
import { ROLES, type UserRole } from '@/lib/roles'

export default function MaterialsClient({
  initialMaterials,
  initialTransactions,
  projects,
  role,
}: {
  initialMaterials: MaterialRecord[]
  initialTransactions: MaterialTxRecord[]
  projects: ProjectRecord[]
  role: UserRole
}) {
  const router = useRouter()
  const perms = ROLES[role].permissions
  const [materials, setMaterials] = useState(initialMaterials)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [selectedMaterialId, setSelectedMaterialId] = useState(initialMaterials[0]?.id ?? '')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [txType, setTxType] = useState<'in' | 'out'>('out')
  const [quantity, setQuantity] = useState('10')
  const [notes, setNotes] = useState('')
  const [alertMsg, setAlertMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const lowStockItems = materials.filter((m) => m.current_stock <= m.reorder_level)

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
        `⚠️ LOW-STOCK WARNING: "${data.item.name}" is now at ${data.item.current_stock} ${data.item.unit} (Reorder level: ${data.item.reorder_level}). Email alert sent!`
      )
    }
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Low-stock warning banner per User Story US-07 */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-bold">
            ⚠️ Low-Stock Alert ({lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}{' '}
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
        <form
          onSubmit={handleTransaction}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-gray-900">
            Log Material Stock In / Stock Out
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

            <input
              type="text"
              placeholder="Notes (e.g. Delivery receipt #)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Record Stock Transaction
          </button>
        </form>
      )}

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
                          LOW STOCK ⚠️
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                          In Stock ✅
                        </span>
                      )}
                    </td>
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
