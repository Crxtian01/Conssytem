'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type {
  BiddingStoreData,
  BidRecord,
  BidStage,
} from '@/lib/bidding-store'
import type { UserRole } from '@/lib/roles'

interface BiddingWorkspaceProps {
  initialStore: BiddingStoreData
  userRole: UserRole
  userEmail: string
  userName?: string
}

const STAGE_ORDER: { key: BidStage; label: string; desc: string }[] = [
  { key: 'draft', label: '1. Draft / ITB', desc: 'Encode Invitation to Bid (ITB), ABC & NFCC' },
  { key: 'estimating', label: '2. BOQ Estimating', desc: 'Build Direct + Indirect Cost (DUPA) <= ABC' },
  { key: 'checklist', label: '3. RA 12009 Checklist', desc: 'Complete Envelope 1 (Tech) & Envelope 2 (Fin)' },
  { key: 'approved', label: '4. Engineer Approved', desc: 'Internal Admin / Engineer sign-off' },
  { key: 'submitted', label: '5. Bid Submitted', desc: 'Sealed & lodged before BAC opening deadline' },
  { key: 'awarded', label: '6. Notice of Award', desc: 'Post-qualified LCRB winner' },
  { key: 'converted', label: '7. Active Project', desc: 'Converted into Projects & Sites' },
]

const STAGE_BADGE: Record<BidStage, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  estimating: 'bg-blue-100 text-blue-800 border-blue-200',
  checklist: 'bg-amber-100 text-amber-900 border-amber-300',
  approved: 'bg-purple-100 text-purple-800 border-purple-200',
  submitted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  awarded: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  lost: 'bg-red-100 text-red-800 border-red-200',
  converted: 'bg-teal-100 text-teal-900 border-teal-300',
}

function formatPHP(num: number): string {
  return `₱${Number(num || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function getDaysRemaining(dateStr: string): number {
  const target = new Date(`${dateStr}T23:59:59`)
  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default function BiddingWorkspace({
  initialStore,
  userRole,
  userEmail,
  userName,
}: BiddingWorkspaceProps) {
  const router = useRouter()
  const [store, setStore] = useState<BiddingStoreData>(initialStore)
  const [selectedBidId, setSelectedBidId] = useState<string>(
    initialStore.bids[0]?.id ?? ''
  )
  const [activeTab, setActiveTab] = useState<
    'overview' | 'estimates' | 'checklist' | 'documents' | 'rules'
  >('overview')
  const [guidedMode, setGuidedMode] = useState<boolean>(true)
  const [showNewBidModal, setShowNewBidModal] = useState<boolean>(false)
  const [busy, setBusy] = useState<boolean>(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Contractor proposal form state
  const [propBidId, setPropBidId] = useState<string>(
    initialStore.bids.find((b) => !['awarded', 'lost', 'converted'].includes(b.status))?.id ??
      initialStore.bids[0]?.id ??
      ''
  )
  const [propContractorName, setPropContractorName] = useState<string>(
    userName || 'Apex Builders Corp.'
  )
  const [propPcab, setPropPcab] = useState<string>('PCAB #44912 - Category B (Medium A)')
  const [propAmount, setPropAmount] = useState<string>('')
  const [propNotes, setPropNotes] = useState<string>('')
  const [propDocUrl, setPropDocUrl] = useState<string>('')

  // New Bid form state
  const [newRefNo, setNewRefNo] = useState('ITB-2026-DPWH-045')
  const [newTitle, setNewTitle] = useState('')
  const [newEntity, setNewEntity] = useState('DPWH / Municipal Government')
  const [newLocation, setNewLocation] = useState('')
  const [newPcab, setNewPcab] = useState('Category B - Medium A')
  const [newAbc, setNewAbc] = useState('15000000')
  const [newDeadline, setNewDeadline] = useState('2026-11-20')
  const [newDuration, setNewDuration] = useState('180')
  const [newNotes, setNewNotes] = useState('')

  // New BOQ Estimate form state
  const [estItemNo, setEstItemNo] = useState('PART II - 900(1)')
  const [estCategory, setEstCategory] = useState<
    'Materials' | 'Labor' | 'Equipment' | 'Mobilization & Overhead'
  >('Materials')
  const [estDesc, setEstDesc] = useState('')
  const [estUnit, setEstUnit] = useState('cu.m')
  const [estQty, setEstQty] = useState('100')
  const [estUnitCost, setEstUnitCost] = useState('4500')

  // New Document form state
  const [docEnvelope, setDocEnvelope] = useState<'technical' | 'financial'>('technical')
  const [docTitle, setDocTitle] = useState('')
  const [docType, setDocType] = useState('PDF')
  const [docUrl, setDocUrl] = useState('')

  // Rules form state
  const [rulesOcm, setRulesOcm] = useState(String(store.rules.default_ocm_pct))
  const [rulesProfit, setRulesProfit] = useState(String(store.rules.default_profit_pct))
  const [rulesVat, setRulesVat] = useState(String(store.rules.default_vat_pct))
  const [rulesMultiplier, setRulesMultiplier] = useState(String(store.rules.nfcc_multiplier))
  const [rulesReminderDays, setRulesReminderDays] = useState(
    String(store.rules.reminder_days_before)
  )

  const isAdminEngineer = userRole === 'admin_engineer'
  const selectedBid: BidRecord | undefined =
    store.bids.find((b) => b.id === selectedBidId) ?? store.bids[0]

  const isBidEditableByCurrentUser = selectedBid
    ? isAdminEngineer ||
      ['draft', 'estimating', 'checklist'].includes(selectedBid.status)
    : false

  const bidEstimates = store.estimates.filter((e) => e.bid_id === selectedBid?.id)
  const bidChecklists = store.checklist_items.filter((c) => c.bid_id === selectedBid?.id)
  const bidDocs = store.documents.filter((d) => d.bid_id === selectedBid?.id)

  const completedChecklistCount = bidChecklists.filter((c) => c.is_completed).length
  const totalChecklistCount = bidChecklists.length || 1
  const checklistPct = Math.round((completedChecklistCount / totalChecklistCount) * 100)

  const isBidOverAbc =
    selectedBid && selectedBid.abc_amount > 0 && selectedBid.bid_amount > selectedBid.abc_amount
  const isNfccShort =
    selectedBid && selectedBid.abc_amount > 0 && selectedBid.nfcc_computed < selectedBid.abc_amount

  async function callBiddingApi(action: string, payload: Record<string, unknown>) {
    setBusy(true)
    setNotice(null)
    setError(null)
    try {
      const res = await fetch('/api/bidding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      })
      const data = await res.json()
      setBusy(false)

      if (!res.ok) {
        setError(data.error || 'Operation failed')
        return null
      }
      if (data.store) {
        setStore(data.store)
      }
      router.refresh()
      return data
    } catch {
      setBusy(false)
      setError('Network error while contacting /api/bidding')
      return null
    }
  }

  async function handleCreateBid(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    const data = await callBiddingApi('create_bid', {
      reference_no: newRefNo,
      title: newTitle,
      procuring_entity: newEntity,
      location: newLocation || 'Metro Manila',
      pcab_category: newPcab,
      abc_amount: Number(newAbc),
      submission_deadline: newDeadline,
      contract_duration_days: Number(newDuration) || 180,
      notes: newNotes,
    })
    if (data?.record) {
      setSelectedBidId(data.record.id)
      setShowNewBidModal(false)
      setNewTitle('')
      setNewNotes('')
      setNotice(`Created new bid "${data.record.reference_no}" in Draft stage.`)
    }
  }

  async function handleAddEstimate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBid || !estDesc.trim()) return
    const data = await callBiddingApi('add_estimate', {
      bid_id: selectedBid.id,
      item_no: estItemNo,
      category: estCategory,
      description: estDesc,
      unit: estUnit,
      quantity: Number(estQty),
      unit_cost: Number(estUnitCost),
    })
    if (data?.ok) {
      setEstDesc('')
      setNotice('Added BOQ item and recalculated total bid price.')
    }
  }

  async function handleUploadDocument(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBid || !docTitle.trim()) return
    const data = await callBiddingApi('upload_document', {
      bid_id: selectedBid.id,
      envelope: docEnvelope,
      title: docTitle,
      file_type: docType,
      file_url:
        docUrl.trim() ||
        `https://vpzorfwfbgyttsuwjshx.supabase.co/storage/v1/object/public/bidding/${encodeURIComponent(
          docTitle.toLowerCase().replace(/\s+/g, '-')
        )}`,
    })
    if (data?.ok) {
      setDocTitle('')
      setDocUrl('')
      setNotice('Attached bid document to envelope.')
    }
  }

  async function handleConvertAwardedBid() {
    if (!selectedBid) return
    const data = await callBiddingApi('convert_to_project', {
      bid_id: selectedBid.id,
    })
    if (data?.projectId) {
      setNotice(
        `Converted awarded bid "${selectedBid.reference_no}" into active Project (${data.projectId}) in Projects & Sites!`
      )
    }
  }

  async function handleSaveRules(e: React.FormEvent) {
    e.preventDefault()
    const data = await callBiddingApi('update_rules', {
      default_ocm_pct: Number(rulesOcm),
      default_profit_pct: Number(rulesProfit),
      default_vat_pct: Number(rulesVat),
      nfcc_multiplier: Number(rulesMultiplier),
      max_bid_abc_pct: 100,
      reminder_days_before: Number(rulesReminderDays),
    })
    if (data?.ok) {
      setNotice('Updated RA 12009 Bidding Rules and default markups.')
    }
  }

  async function handleSubmitContractorProposal(e: React.FormEvent) {
    e.preventDefault()
    if (!propBidId || !propAmount) return
    const data = await callBiddingApi('submit_contractor_proposal', {
      bid_id: propBidId,
      contractor_name: propContractorName,
      pcab_license: propPcab,
      bid_amount: Number(propAmount),
      proposal_notes: propNotes,
      document_url: propDocUrl || undefined,
    })
    if (data?.ok) {
      setPropAmount('')
      setPropNotes('')
      setNotice('Your bid proposal has been submitted and is now visible in My Submitted Bids & Status.')
    }
  }

  // =========================================================================
  // CONTRACTOR PORTAL: View Open Bids, Submit Own Bid, View Own Status
  // =========================================================================
  if (userRole === 'contractor') {
    const openBids = store.bids.filter((b) => !['awarded', 'lost', 'converted'].includes(b.status))
    const myProposals = (store.contractor_proposals || []).filter(
      (p) =>
        p.contractor_email.toLowerCase() === userEmail.toLowerCase() ||
        p.contractor_email === 'contractor@constructms.ph'
    )
    const selectedOpenBid = openBids.find((b) => b.id === propBidId) || openBids[0]

    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-900">
                  Contractor Bidding Portal
                </span>
                <span className="text-xs text-gray-500">RA 12009 Compliant</span>
              </div>
              <h1 className="mt-1.5 text-2xl font-bold text-gray-900">
                Open Invitations to Bid &amp; My Bid Submissions
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                View open Invitations to Bid (ITB), submit your own contractor bid proposal, and track your evaluation &amp; award status.
              </p>
            </div>
          </div>
        </div>

        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-center justify-between">
            <span>✅ {notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="text-xs font-semibold">
              Dismiss
            </button>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button type="button" onClick={() => setError(null)} className="text-xs font-semibold">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Open Bids List */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              Open Invitations to Bid ({openBids.length})
            </h2>
            {openBids.map((b) => {
              const myExisting = myProposals.find((p) => p.bid_id === b.id)
              return (
                <div
                  key={b.id}
                  className={`rounded-2xl border p-5 transition ${
                    propBidId === b.id
                      ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-400'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-amber-800">
                      {b.reference_no}
                    </span>
                    <div className="flex items-center gap-2">
                      {myExisting && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          ✓ Bid Submitted ({myExisting.status})
                        </span>
                      )}
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
                        Open for Bids
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-1.5 text-base font-bold text-gray-900">{b.title}</h3>
                  <p className="text-xs text-gray-500">
                    {b.procuring_entity} • {b.location} • Required: {b.pcab_category}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 block">ABC Ceiling</span>
                      <span className="font-bold text-gray-900">{formatPHP(b.abc_amount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 block">Deadline</span>
                      <span className="font-semibold text-gray-800">{b.submission_deadline}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 block">Duration</span>
                      <span className="font-semibold text-gray-800">{b.contract_duration_days} CD</span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setPropBidId(b.id)
                        if (myExisting) {
                          setPropAmount(String(myExisting.bid_amount))
                          setPropNotes(myExisting.proposal_notes)
                        }
                      }}
                      className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                    >
                      {myExisting ? 'Update My Submitted Bid' : 'Select & Submit My Bid →'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Submit Own Bid Form */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleSubmitContractorProposal}
              className="rounded-2xl border border-amber-300 bg-white p-5 shadow-sm space-y-4"
            >
              <div>
                <h2 className="text-base font-bold text-gray-900">Submit Own Bid Proposal</h2>
                <p className="text-xs text-gray-500">
                  Your bid amount must not exceed the Approved Budget for the Contract (ABC).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Open Bid (ITB) *
                </label>
                <select
                  value={propBidId}
                  onChange={(e) => setPropBidId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium"
                >
                  {openBids.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.reference_no} — {b.title} (ABC: {formatPHP(b.abc_amount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Contractor / Firm Name *
                </label>
                <input
                  type="text"
                  required
                  value={propContractorName}
                  onChange={(e) => setPropContractorName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  PCAB License No. &amp; Category *
                </label>
                <input
                  type="text"
                  required
                  value={propPcab}
                  onChange={(e) => setPropPcab(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Proposed Financial Bid Amount (₱) *{' '}
                  {selectedOpenBid && (
                    <span className="text-gray-500 font-normal">
                      (Max ABC: {formatPHP(selectedOpenBid.abc_amount)})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedOpenBid?.abc_amount || undefined}
                  step="0.01"
                  value={propAmount}
                  onChange={(e) => setPropAmount(e.target.value)}
                  placeholder="Enter your total bid price in PHP"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Technical &amp; Financial Proposal Summary *
                </label>
                <textarea
                  rows={3}
                  required
                  value={propNotes}
                  onChange={(e) => setPropNotes(e.target.value)}
                  placeholder="Include Bid Security type, key personnel, and delivery commitment..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sealed Bid Package URL (Optional)
                </label>
                <input
                  type="url"
                  value={propDocUrl}
                  onChange={(e) => setPropDocUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={busy || openBids.length === 0}
                className="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {busy ? 'Submitting Bid…' : 'Submit Official Contractor Bid'}
              </button>
            </form>
          </div>
        </div>

        {/* My Submitted Bids & Status */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">
            My Submitted Bids &amp; Status ({myProposals.length})
          </h2>
          <p className="text-xs text-gray-500">
            Track the live status of your submitted bids from submission through post-qualification and award.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] uppercase text-gray-500">
                  <th className="py-2.5 pr-3">Reference No.</th>
                  <th className="py-2.5 px-3">Project Title</th>
                  <th className="py-2.5 px-3">PCAB License</th>
                  <th className="py-2.5 px-3 text-right">My Bid Amount</th>
                  <th className="py-2.5 px-3">Submitted At</th>
                  <th className="py-2.5 pl-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myProposals.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-3 font-mono font-bold text-amber-800">
                      {p.reference_no}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900">{p.bid_title}</div>
                      <div className="text-[11px] text-gray-500">{p.proposal_notes}</div>
                    </td>
                    <td className="py-3 px-3 text-gray-600">{p.pcab_license}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">
                      {formatPHP(p.bid_amount)}
                    </td>
                    <td className="py-3 px-3 text-gray-500">{p.submitted_at.slice(0, 10)}</td>
                    <td className="py-3 pl-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                          p.status === 'awarded'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'not_selected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Top Header + Guided Beginner Mode Toggle + New Bid Button */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold">
                🔨
              </span>
              <h1 className="text-2xl font-bold text-gray-900">
                Bidding Management (RA 12009)
              </h1>
              <span
                className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${
                  isAdminEngineer
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : 'bg-blue-100 text-blue-800 border-blue-200'
                }`}
              >
                {isAdminEngineer
                  ? 'Admin / Engineer — Full Approval & Award Authority'
                  : 'Assistant — Draft, Estimating & Checklist Mode'}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-gray-600">
              Philippine Government &amp; Private Construction Bidding pipeline under{' '}
              <strong>RA 12009 (New Government Procurement Act)</strong>: Invitation to Bid, BOQ
              Cost Estimating (DUPA), 2-Envelope Checklist, Approval, and Award-to-Project conversion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setGuidedMode((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                guidedMode
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>🎓 Guided Beginner Mode:</span>
              <span className="font-bold">{guidedMode ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNewBidModal((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
            >
              <span>＋ New Bid Opportunity</span>
            </button>
          </div>
        </div>

        {/* Role Enforcement Banner for Assistant */}
        {!isAdminEngineer && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
            <div>
              <strong>Assistant Role Permissions:</strong> You can create bids, build BOQ estimates,
              check off RA 12009 requirements, and upload documents while a bid is in{' '}
              <span className="font-semibold underline">Draft, Estimating, or Checklist</span> stages.
              Approving, submitting, recording award results, converting to project, and editing rules
              require <strong>Admin / Engineer</strong>.
            </div>
            <span className="rounded-md bg-blue-100 px-2.5 py-1 font-semibold text-blue-800">
              Strict Server + RLS Guard Active
            </span>
          </div>
        )}
      </div>

      {/* Feedback banners */}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-center justify-between">
          <span>✅ {notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-semibold text-red-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Guided Beginner Mode Interactive Coach */}
      {guidedMode && (
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 p-5 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-950">
                🎓 RA 12009 Guided Beginner Mode
              </span>
              <h2 className="mt-2 text-base font-bold text-gray-900">
                How Philippine Construction Bidding Works (Step-by-Step)
              </h2>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="rounded-xl border border-amber-200 bg-white p-3.5">
              <p className="font-bold text-amber-900">Step 1: Check ABC &amp; NFCC</p>
              <p className="mt-1 text-gray-600 leading-relaxed">
                <strong>ABC</strong> (Approved Budget for the Contract) is the ceiling price. Your{' '}
                <strong>NFCC</strong> = <code>[(Current Assets - Current Liabilities) × 15] - Ongoing Contracts</code>{' '}
                must be <strong>≥ ABC</strong> to qualify.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-white p-3.5">
              <p className="font-bold text-amber-900">Step 2: Build BOQ &amp; DUPA</p>
              <p className="mt-1 text-gray-600 leading-relaxed">
                Compute <strong>Direct Costs</strong> (Materials + Labor + Equipment) plus{' '}
                <strong>Indirect Costs</strong> ({store.rules.default_ocm_pct}% OCM +{' '}
                {store.rules.default_profit_pct}% Profit + {store.rules.default_vat_pct}% VAT). Total
                Bid must NEVER exceed ABC.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-white p-3.5">
              <p className="font-bold text-amber-900">Step 3: Two-Envelope Rule</p>
              <p className="mt-1 text-gray-600 leading-relaxed">
                <strong>Envelope 1 (Technical)</strong> holds PhilGEPS Platinum, PCAB, SLCC, NFCC, Bid
                Security &amp; Omnibus Sworn Statement. <strong>Envelope 2 (Financial)</strong> holds
                the signed Bid Form, BOQ &amp; Cash Flow.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-white p-3.5">
              <p className="font-bold text-amber-900">Step 4: Approve, Submit &amp; Convert</p>
              <p className="mt-1 text-gray-600 leading-relaxed">
                <strong>Admin / Engineer</strong> reviews and approves the bid, lodges it before
                opening, records the <strong>Notice of Award (NOA)</strong>, and converts it into an
                active Project in 1 click.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Bid Modal / Collapsible Form */}
      {showNewBidModal && (
        <form
          onSubmit={handleCreateBid}
          className="rounded-2xl border border-amber-300 bg-white p-6 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Create New Bid Opportunity (Draft Stage)
              </h2>
              <p className="text-xs text-gray-500">
                Automatically generates the 10-point RA 12009 Technical &amp; Financial Checklist.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewBidModal(false)}
              className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              Close ✕
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                ITB / Solicitation Reference No. *
              </label>
              <input
                type="text"
                required
                value={newRefNo}
                onChange={(e) => setNewRefNo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. ITB-2026-DPWH-045"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contract / Project Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. Construction of 3-Storey Public Market Building"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Procuring Entity / Client *
              </label>
              <input
                type="text"
                required
                value={newEntity}
                onChange={(e) => setNewEntity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Site Location *
              </label>
              <input
                type="text"
                required
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. Calamba City, Laguna"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Required PCAB Category
              </label>
              <select
                value={newPcab}
                onChange={(e) => setNewPcab(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                <option value="Category AAA - Large B">Category AAA - Large B</option>
                <option value="Category A - Medium B">Category A - Medium B</option>
                <option value="Category B - Medium A">Category B - Medium A</option>
                <option value="Category C - Small B">Category C - Small B</option>
                <option value="Category D - Small A">Category D - Small A</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Approved Budget for the Contract (ABC ₱) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={newAbc}
                onChange={(e) => setNewAbc(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Bid Submission &amp; Opening Deadline *
              </label>
              <input
                type="date"
                required
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contract Duration (Calendar Days)
              </label>
              <input
                type="number"
                required
                min="1"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Initial Preparation Notes
            </label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Pre-bid conference notes, site inspection schedule, etc."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowNewBidModal(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {busy ? 'Creating…' : 'Create Bid & Generate RA 12009 Checklist'}
            </button>
          </div>
        </form>
      )}

      {/* KPI Summary & Deadline Reminder Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Total Bids in Pipeline</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{store.bids.length}</p>
          <p className="mt-1 text-[11px] text-gray-500">
            {
              store.bids.filter((b) =>
                ['draft', 'estimating', 'checklist'].includes(b.status)
              ).length
            }{' '}
            in preparation
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Total ABC Value</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {formatPHP(store.bids.reduce((sum, b) => sum + Number(b.abc_amount || 0), 0))}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">Approved Budget Ceiling</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-gray-500">Awarded / Converted</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {store.bids.filter((b) => b.status === 'awarded' || b.status === 'converted').length}
          </p>
          <p className="mt-1 text-[11px] text-emerald-700">
            Ready or converted to Projects &amp; Sites
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <p className="text-xs font-semibold text-amber-900">Upcoming Deadlines</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">
            {
              store.bids.filter((b) => {
                const d = getDaysRemaining(b.submission_deadline)
                return d >= 0 && d <= 14 && !['awarded', 'lost', 'converted'].includes(b.status)
              }).length
            }
          </p>
          <p className="mt-1 text-[11px] text-amber-800">
            Alert threshold: {store.rules.reminder_days_before} days before opening
          </p>
        </div>
      </div>

      {/* Main Layout: Bid Pipeline Selector (Left) + Selected Bid Workspace (Right) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column: Bid Cards list */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Bid Opportunities ({store.bids.length})
            </h2>
          </div>

          {store.bids.map((b) => {
            const active = b.id === selectedBid?.id
            const daysLeft = getDaysRemaining(b.submission_deadline)
            const isUrgent =
              daysLeft >= 0 &&
              daysLeft <= store.rules.reminder_days_before &&
              !['submitted', 'awarded', 'lost', 'converted'].includes(b.status)

            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBidId(b.id)}
                className={`w-full text-left rounded-2xl border p-4 transition ${
                  active
                    ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-400'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-amber-800">
                    {b.reference_no}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                      STAGE_BADGE[b.status]
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <h3 className="mt-1.5 font-bold text-gray-900 text-sm leading-snug">
                  {b.title}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {b.procuring_entity} • {b.location}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-2.5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 block">ABC Ceiling</span>
                    <span className="font-semibold text-gray-800">{formatPHP(b.abc_amount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 block">Our Bid Price</span>
                    <span
                      className={`font-bold ${
                        b.bid_amount > b.abc_amount ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {b.bid_amount > 0 ? formatPHP(b.bid_amount) : 'Estimating…'}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-500">
                  <span>📅 Opening: {b.submission_deadline}</span>
                  {isUrgent && (
                    <span className="rounded bg-red-100 px-2 py-0.5 font-bold text-red-700">
                      ⏰ {daysLeft === 0 ? 'Due Today!' : `${daysLeft}d left`}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Right column: Active Bid Detail Workspace */}
        <div className="lg:col-span-8 space-y-5">
          {selectedBid ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
              {/* Selected Bid Header */}
              <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-amber-100 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-900">
                      {selectedBid.reference_no}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-0.5 text-xs font-semibold uppercase ${
                        STAGE_BADGE[selectedBid.status]
                      }`}
                    >
                      Stage: {selectedBid.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      • {selectedBid.pcab_category}
                    </span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-gray-900">
                    {selectedBid.title}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Procuring Entity: <strong>{selectedBid.procuring_entity}</strong> | Location:{' '}
                    <strong>{selectedBid.location}</strong> | Duration:{' '}
                    <strong>{selectedBid.contract_duration_days} CD</strong>
                  </p>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    const res = await callBiddingApi('send_deadline_reminder', {
                      bid_id: selectedBid.id,
                    })
                    if (res?.message) setNotice(res.message)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 shrink-0"
                >
                  🔔 Send Email Deadline Reminder
                </button>
              </div>

              {/* Visual 7-Stage RA 12009 Workflow Pipeline */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  RA 12009 Workflow Stage Progression
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {STAGE_ORDER.map((st) => {
                    const isCurrent = selectedBid.status === st.key
                    return (
                      <div
                        key={st.key}
                        className={`rounded-xl border p-2.5 text-left ${
                          isCurrent
                            ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-1 ring-amber-400'
                            : 'border-gray-200 bg-gray-50/70 text-gray-600'
                        }`}
                      >
                        <p className="text-[11px] font-bold leading-tight">{st.label}</p>
                        <p className="mt-1 text-[10px] leading-snug opacity-80">{st.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Navigation Tabs inside Selected Bid */}
              <div className="flex flex-wrap gap-1.5 border-b border-gray-200 pb-3">
                {[
                  { id: 'overview', label: '📋 Overview, NFCC & Actions' },
                  { id: 'estimates', label: `🧮 BOQ Cost Estimator (${bidEstimates.length})` },
                  {
                    id: 'checklist',
                    label: `✅ RA 12009 Checklist (${completedChecklistCount}/${bidChecklists.length})`,
                  },
                  { id: 'documents', label: `📁 Bid Documents (${bidDocs.length})` },
                  {
                    id: 'rules',
                    label: isAdminEngineer
                      ? '⚙️ Bidding Rules'
                      : '🔒 Bidding Rules (Admin Only)',
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as typeof activeTab)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      activeTab === t.id
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW, NFCC & STAGE APPROVAL / AWARD ACTIONS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* ABC vs Bid Price + NFCC Check Cards */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-medium text-gray-500">
                        Approved Budget (ABC Ceiling)
                      </p>
                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {formatPHP(selectedBid.abc_amount)}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        Max allowed bid under RA 12009
                      </p>
                    </div>

                    <div
                      className={`rounded-xl border p-4 ${
                        isBidOverAbc
                          ? 'border-red-300 bg-red-50'
                          : 'border-emerald-200 bg-emerald-50/60'
                      }`}
                    >
                      <p className="text-xs font-medium text-gray-600">
                        Computed BOQ Bid Price
                      </p>
                      <p
                        className={`mt-1 text-lg font-bold ${
                          isBidOverAbc ? 'text-red-700' : 'text-emerald-800'
                        }`}
                      >
                        {formatPHP(selectedBid.bid_amount)}
                      </p>
                      <p className="mt-1 text-[11px] font-medium">
                        {isBidOverAbc ? (
                          <span className="text-red-700">
                            ⚠️ Exceeds ABC! Disqualification risk
                          </span>
                        ) : selectedBid.abc_amount > 0 ? (
                          <span className="text-emerald-800">
                            ✅{' '}
                            {(
                              ((selectedBid.abc_amount - selectedBid.bid_amount) /
                                selectedBid.abc_amount) *
                              100
                            ).toFixed(2)}
                            % below ABC variance
                          </span>
                        ) : (
                          'Add BOQ items to compute'
                        )}
                      </p>
                    </div>

                    <div
                      className={`rounded-xl border p-4 ${
                        isNfccShort
                          ? 'border-red-300 bg-red-50'
                          : 'border-indigo-200 bg-indigo-50/50'
                      }`}
                    >
                      <p className="text-xs font-medium text-gray-600">
                        Computed NFCC (×{store.rules.nfcc_multiplier})
                      </p>
                      <p
                        className={`mt-1 text-lg font-bold ${
                          isNfccShort ? 'text-red-700' : 'text-indigo-900'
                        }`}
                      >
                        {formatPHP(selectedBid.nfcc_computed)}
                      </p>
                      <p className="mt-1 text-[11px]">
                        {isNfccShort ? (
                          <span className="font-semibold text-red-700">
                            ⚠️ NFCC is below ABC!
                          </span>
                        ) : (
                          <span className="text-indigo-800">
                            ✅ Qualifies (NFCC ≥ ABC)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Early Stage Preparation Controls (Allowed for Admin/Engineer AND Assistant) */}
                  <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900">
                        Preparation Stage Controls (Draft ↔ Estimating ↔ Checklist)
                      </h3>
                      <span className="text-xs text-gray-500">
                        Accessible to Admin / Engineer &amp; Assistant
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['draft', 'estimating', 'checklist'] as BidStage[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={busy || !isBidEditableByCurrentUser || selectedBid.status === st}
                          onClick={async () => {
                            const res = await callBiddingApi('update_bid_details', {
                              bid_id: selectedBid.id,
                              status: st,
                            })
                            if (res?.ok) {
                              setNotice(`Moved bid ${selectedBid.reference_no} to "${st}" stage.`)
                            }
                          }}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase transition ${
                            selectedBid.status === st
                              ? 'border-amber-500 bg-amber-100 text-amber-900'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                          }`}
                        >
                          Move to {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ADMIN / ENGINEER ONLY: Approval, Submission, Award & Convert-to-Project Box */}
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-purple-950">
                          Official Bid Approval, Submission, Award &amp; Project Conversion
                        </h3>
                        <p className="text-xs text-purple-800">
                          Strictly enforced on both UI and server API — only{' '}
                          <strong>Admin / Engineer</strong> can execute these actions.
                        </p>
                      </div>
                      {!isAdminEngineer && (
                        <span className="rounded-full border border-purple-300 bg-purple-100 px-3 py-1 text-xs font-bold text-purple-900">
                          🔒 Locked for Assistant Role
                        </span>
                      )}
                    </div>

                    {isAdminEngineer ? (
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          disabled={busy || isBidOverAbc}
                          onClick={async () => {
                            const res = await callBiddingApi('approve_bid', {
                              bid_id: selectedBid.id,
                            })
                            if (res?.ok) {
                              setNotice(
                                `Approved bid ${selectedBid.reference_no} (${userEmail}). Ready for submission!`
                              )
                            }
                          }}
                          className="rounded-xl bg-purple-700 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
                        >
                          1. Approve Bid for Submission
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            const res = await callBiddingApi('submit_bid', {
                              bid_id: selectedBid.id,
                            })
                            if (res?.ok) {
                              setNotice(`Marked ${selectedBid.reference_no} as Submitted to BAC.`)
                            }
                          }}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          2. Mark Bid Submitted
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            const res = await callBiddingApi('record_award', {
                              bid_id: selectedBid.id,
                              outcome: 'awarded',
                            })
                            if (res?.ok) {
                              setNotice(
                                `Recorded Notice of Award (NOA) for ${selectedBid.reference_no}!`
                              )
                            }
                          }}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          3. Record Notice of Award (Won)
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            const res = await callBiddingApi('record_award', {
                              bid_id: selectedBid.id,
                              outcome: 'lost',
                            })
                            if (res?.ok) {
                              setNotice(`Recorded bid ${selectedBid.reference_no} as Lost.`)
                            }
                          }}
                          className="rounded-xl border border-red-300 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Mark Lost
                        </button>

                        <button
                          type="button"
                          disabled={
                            busy ||
                            (selectedBid.status !== 'awarded' &&
                              selectedBid.status !== 'converted')
                          }
                          onClick={handleConvertAwardedBid}
                          className="rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-40"
                        >
                          🚀 4. Convert Awarded Bid to Active Project
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            const res = await callBiddingApi('delete_bid', {
                              bid_id: selectedBid.id,
                            })
                            if (res?.ok) {
                              setSelectedBidId(res.store?.bids?.[0]?.id ?? '')
                              setNotice(`Deleted bid record ${selectedBid.reference_no}.`)
                            }
                          }}
                          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          🗑️ Delete Bid Record
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-4 pt-1">
                        {[
                          'Issue / Approve Bid',
                          'Submit Bid',
                          'Award Bid',
                          'Delete Bid Record',
                        ].map((label) => (
                          <button
                            key={label}
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-400"
                          >
                            🔒 {label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Contractor Proposals Submitted for this Bid (Admin/Engineer Evaluation & Award) */}
                    {isAdminEngineer && (
                      <div className="mt-4 rounded-xl border border-purple-200 bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                            Submitted Contractor Bid Proposals for {selectedBid.reference_no}
                          </h4>
                          <span className="text-[11px] text-gray-500">
                            {(store.contractor_proposals || []).filter((p) => p.bid_id === selectedBid.id).length} proposal(s)
                          </span>
                        </div>
                        {(store.contractor_proposals || []).filter((p) => p.bid_id === selectedBid.id).length === 0 ? (
                          <p className="text-xs text-gray-500">
                            No contractor proposals submitted for this bid yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {(store.contractor_proposals || [])
                              .filter((p) => p.bid_id === selectedBid.id)
                              .map((p) => (
                                <div
                                  key={p.id}
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs"
                                >
                                  <div>
                                    <div className="font-bold text-gray-900">
                                      {p.contractor_name}{' '}
                                      <span className="font-normal text-gray-500">
                                        ({p.pcab_license})
                                      </span>
                                    </div>
                                    <div className="text-gray-600 mt-0.5">
                                      Bid Offer: <strong className="text-emerald-800">{formatPHP(p.bid_amount)}</strong> — {p.proposal_notes}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                                      {p.status}
                                    </span>
                                    <button
                                      type="button"
                                      disabled={busy || p.status === 'awarded'}
                                      onClick={async () => {
                                        const res = await callBiddingApi('evaluate_contractor_proposal', {
                                          proposal_id: p.id,
                                          status: 'awarded',
                                        })
                                        if (res?.ok) {
                                          setNotice(`Awarded ${selectedBid.reference_no} to ${p.contractor_name}!`)
                                        }
                                      }}
                                      className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                      Award Bid
                                    </button>
                                    <button
                                      type="button"
                                      disabled={busy || p.status === 'not_selected'}
                                      onClick={async () => {
                                        await callBiddingApi('evaluate_contractor_proposal', {
                                          proposal_id: p.id,
                                          status: 'not_selected',
                                        })
                                      }}
                                      className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedBid.converted_project_id && (
                      <div className="rounded-xl border border-teal-300 bg-teal-50 p-3 text-xs text-teal-900 flex items-center justify-between">
                        <span>
                          🎉 This bid has been converted into an active project (
                          <strong>{selectedBid.converted_project_id}</strong>).
                        </span>
                        <Link
                          href="/projects"
                          className="font-bold text-teal-800 underline hover:text-teal-950"
                        >
                          Open Projects &amp; Sites →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: BOQ & COST ESTIMATOR */}
              {activeTab === 'estimates' && (
                <div className="space-y-5">
                  {guidedMode && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                      <strong>🎓 Beginner Tip (DUPA / BOQ):</strong> Add each pay item below. The
                      system automatically multiplies <code>Quantity × Unit Cost</code> for Direct
                      Cost, then adds <strong>{store.rules.default_ocm_pct}% OCM</strong>,{' '}
                      <strong>{store.rules.default_profit_pct}% Profit</strong>, and{' '}
                      <strong>{store.rules.default_vat_pct}% VAT</strong> to compute the Total Bid
                      Price.
                    </div>
                  )}

                  {isBidEditableByCurrentUser ? (
                    <form
                      onSubmit={handleAddEstimate}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Add Bill of Quantities (BOQ) Pay Item
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-6">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Item No.
                          </label>
                          <input
                            type="text"
                            required
                            value={estItemNo}
                            onChange={(e) => setEstItemNo(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Cost Category
                          </label>
                          <select
                            value={estCategory}
                            onChange={(e) =>
                              setEstCategory(e.target.value as typeof estCategory)
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs"
                          >
                            <option value="Materials">Materials</option>
                            <option value="Labor">Labor</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Mobilization & Overhead">Mobilization &amp; Overhead</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Scope / Pay Item Description *
                          </label>
                          <input
                            type="text"
                            required
                            value={estDesc}
                            onChange={(e) => setEstDesc(e.target.value)}
                            placeholder="e.g. Ready-Mix Concrete 4000 psi"
                            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Qty &amp; Unit
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              required
                              min="0.01"
                              step="0.01"
                              value={estQty}
                              onChange={(e) => setEstQty(e.target.value)}
                              className="w-2/3 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs"
                            />
                            <input
                              type="text"
                              required
                              value={estUnit}
                              onChange={(e) => setEstUnit(e.target.value)}
                              className="w-1/3 rounded-lg border border-gray-300 bg-white px-1.5 py-1.5 text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Unit Cost (₱)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={estUnitCost}
                            onChange={(e) => setEstUnitCost(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={busy}
                          className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                        >
                          ＋ Add BOQ Item
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                      🔒 This bid is in <strong>{selectedBid.status}</strong> stage. Estimates are
                      locked for Assistant role.
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 text-[11px] uppercase text-gray-500">
                          <th className="py-2 pr-2">Item</th>
                          <th className="py-2 px-2">Category</th>
                          <th className="py-2 px-2">Description</th>
                          <th className="py-2 px-2 text-right">Qty</th>
                          <th className="py-2 px-2 text-right">Direct Cost</th>
                          <th className="py-2 px-2 text-right">OCM/Profit/VAT</th>
                          <th className="py-2 pl-2 text-right">Total Price</th>
                          <th className="py-2 pl-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bidEstimates.map((est) => (
                          <tr key={est.id}>
                            <td className="py-2.5 pr-2 font-mono font-semibold text-gray-800">
                              {est.item_no}
                            </td>
                            <td className="py-2.5 px-2">{est.category}</td>
                            <td className="py-2.5 px-2 text-gray-700">{est.description}</td>
                            <td className="py-2.5 px-2 text-right">
                              {est.quantity} {est.unit}
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              {formatPHP(est.direct_cost)}
                            </td>
                            <td className="py-2.5 px-2 text-right text-gray-500">
                              +{est.ocm_pct}% / +{est.profit_pct}% / +{est.vat_pct}%
                            </td>
                            <td className="py-2.5 pl-2 text-right font-bold text-gray-900">
                              {formatPHP(est.total_amount)}
                            </td>
                            <td className="py-2.5 pl-2 text-right">
                              {isBidEditableByCurrentUser && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    callBiddingApi('delete_estimate', {
                                      bid_id: selectedBid.id,
                                      estimate_id: est.id,
                                    })
                                  }
                                  className="text-red-600 hover:underline"
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: RA 12009 2-ENVELOPE CHECKLIST */}
              {activeTab === 'checklist' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        RA 12009 Mandatory Two-Envelope Checklist ({completedChecklistCount}/
                        {bidChecklists.length} Complete)
                      </h3>
                      <p className="text-xs text-gray-500">
                        Missing a single required document results in automatic &ldquo;Failed /
                        Ineligible&rdquo; rating during bid opening.
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                      {checklistPct}% Ready
                    </span>
                  </div>

                  {(['technical', 'financial'] as const).map((env) => {
                    const items = bidChecklists.filter((c) => c.envelope === env)
                    return (
                      <div
                        key={env}
                        className="rounded-xl border border-gray-200 p-4 space-y-3"
                      >
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                          {env === 'technical'
                            ? '📂 First Envelope: Eligibility & Technical Component'
                            : '💰 Second Envelope: Financial Component'}
                        </h4>

                        <div className="space-y-2.5">
                          {items.map((chk) => (
                            <div
                              key={chk.id}
                              className={`rounded-xl border p-3 transition ${
                                chk.is_completed
                                  ? 'border-emerald-200 bg-emerald-50/40'
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={chk.is_completed}
                                  disabled={busy || !isBidEditableByCurrentUser}
                                  onChange={() =>
                                    callBiddingApi('toggle_checklist', { item_id: chk.id })
                                  }
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                />
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-700">
                                      {chk.code}
                                    </span>
                                    <span className="text-xs font-bold text-gray-900">
                                      {chk.label}
                                    </span>
                                    <span className="text-[11px] text-gray-500">
                                      ({chk.ra12009_clause})
                                    </span>
                                  </div>
                                  {guidedMode && (
                                    <p className="mt-1 text-xs text-gray-600">
                                      💡 <strong>Beginner Guide:</strong> {chk.beginner_tip}
                                    </p>
                                  )}
                                  {chk.verified_by_email && (
                                    <p className="mt-1 text-[11px] text-emerald-700 font-medium">
                                      ✓ Checked by {chk.verified_by_email}
                                    </p>
                                  )}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* TAB 4: BID DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-5">
                  {isBidEditableByCurrentUser && (
                    <form
                      onSubmit={handleUploadDocument}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Upload / Attach Bid Requirement Document
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Envelope
                          </label>
                          <select
                            value={docEnvelope}
                            onChange={(e) =>
                              setDocEnvelope(e.target.value as 'technical' | 'financial')
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs"
                          >
                            <option value="technical">Envelope 1 (Technical)</option>
                            <option value="financial">Envelope 2 (Financial)</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Document Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={docTitle}
                            onChange={(e) => setDocTitle(e.target.value)}
                            placeholder="e.g. Notarized Omnibus Sworn Statement.pdf"
                            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Format
                          </label>
                          <select
                            value={docType}
                            onChange={(e) => setDocType(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs"
                          >
                            <option value="PDF">PDF</option>
                            <option value="XLSX">XLSX (BOQ)</option>
                            <option value="DOCX">DOCX</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={busy}
                          className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                        >
                          📎 Attach Document
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2">
                    {bidDocs.length === 0 ? (
                      <p className="text-xs text-gray-500 py-4 text-center">
                        No documents attached to this bid yet.
                      </p>
                    ) : (
                      bidDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between rounded-xl border border-gray-200 p-3 text-xs"
                        >
                          <div>
                            <span
                              className={`mr-2 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                doc.envelope === 'technical'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              {doc.envelope}
                            </span>
                            <span className="font-semibold text-gray-900">{doc.title}</span>
                            <span className="ml-2 text-gray-400">
                              ({doc.file_type} • uploaded by {doc.uploaded_by_email})
                            </span>
                          </div>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-amber-700 hover:underline"
                          >
                            View File ↗
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: BIDDING RULES (ADMIN / ENGINEER ONLY) */}
              {activeTab === 'rules' && (
                <form onSubmit={handleSaveRules} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        RA 12009 Default Markup &amp; Eligibility Rules
                      </h3>
                      <p className="text-xs text-gray-500">
                        Controls default DUPA indirect cost percentages and NFCC multiplier. Only{' '}
                        <strong>Admin / Engineer</strong> can edit these rules.
                      </p>
                    </div>
                    {!isAdminEngineer && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                        🔒 Read-Only for Assistant
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Default OCM (Overhead, Contingencies &amp; Misc %)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        disabled={!isAdminEngineer}
                        value={rulesOcm}
                        onChange={(e) => setRulesOcm(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Default Contractor&apos;s Profit (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        disabled={!isAdminEngineer}
                        value={rulesProfit}
                        onChange={(e) => setRulesProfit(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Default VAT / Tax (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        disabled={!isAdminEngineer}
                        value={rulesVat}
                        onChange={(e) => setRulesVat(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        RA 12009 NFCC Multiplier (K = 15)
                      </label>
                      <input
                        type="number"
                        disabled={!isAdminEngineer}
                        value={rulesMultiplier}
                        onChange={(e) => setRulesMultiplier(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Deadline Alert Days Before Opening
                      </label>
                      <input
                        type="number"
                        disabled={!isAdminEngineer}
                        value={rulesReminderDays}
                        onChange={(e) => setRulesReminderDays(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {isAdminEngineer && (
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={busy}
                        className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        Save Bidding Rules
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              Select a bid opportunity on the left or click &ldquo;New Bid Opportunity&rdquo; to
              get started.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

