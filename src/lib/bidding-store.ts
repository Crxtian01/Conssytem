import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { getAdminDb } from '@/lib/db'
import { readStore, writeStore, newId, trySupabaseInsert, type ProjectRecord } from '@/lib/module-store'

export type BidStage =
  | 'draft'
  | 'estimating'
  | 'checklist'
  | 'approved'
  | 'submitted'
  | 'awarded'
  | 'lost'
  | 'converted'

export const ASSISTANT_EDITABLE_STAGES: BidStage[] = ['draft', 'estimating', 'checklist']

export interface BiddingRulesRecord {
  id: string
  procurement_law: string
  default_ocm_pct: number
  default_profit_pct: number
  default_vat_pct: number
  nfcc_multiplier: number
  max_bid_abc_pct: number
  reminder_days_before: number
  require_philgeps: boolean
  require_pcab: boolean
  require_nfcc: boolean
  require_bid_security: boolean
  require_omnibus_sworn: boolean
  updated_by_email: string
  updated_at: string
}

export interface BidRecord {
  id: string
  reference_no: string
  title: string
  procuring_entity: string
  location: string
  procurement_mode: string
  pcab_category: string
  abc_amount: number
  bid_amount: number
  current_assets: number
  current_liabilities: number
  ongoing_contracts_value: number
  nfcc_computed: number
  bid_security_type: string
  bid_security_amount: number
  pre_bid_date: string
  submission_deadline: string
  opening_date: string
  contract_duration_days: number
  status: BidStage
  prepared_by_email: string
  approved_by_email?: string
  approved_at?: string
  submitted_at?: string
  award_notice_no?: string
  award_date?: string
  award_remarks?: string
  converted_project_id?: string
  notes: string
  created_at: string
  updated_at: string
}

export interface BidEstimateRecord {
  id: string
  bid_id: string
  item_no: string
  category: 'Materials' | 'Labor' | 'Equipment' | 'Mobilization & Overhead'
  description: string
  unit: string
  quantity: number
  unit_cost: number
  direct_cost: number
  ocm_pct: number
  profit_pct: number
  vat_pct: number
  total_amount: number
  created_at: string
}

export interface BidChecklistItemRecord {
  id: string
  bid_id: string
  envelope: 'technical' | 'financial'
  code: string
  label: string
  ra12009_clause: string
  beginner_tip: string
  is_required: boolean
  is_completed: boolean
  document_url?: string
  verified_by_email?: string
  updated_at: string
}

export interface BidDocumentRecord {
  id: string
  bid_id: string
  envelope: 'technical' | 'financial'
  title: string
  file_url: string
  file_type: string
  uploaded_by_email: string
  created_at: string
}

export interface BiddingStoreData {
  rules: BiddingRulesRecord
  bids: BidRecord[]
  estimates: BidEstimateRecord[]
  checklist_items: BidChecklistItemRecord[]
  documents: BidDocumentRecord[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const BIDDING_STORE_PATH = path.join(DATA_DIR, 'bidding.json')

export function buildDefaultChecklistForBid(bidId: string): BidChecklistItemRecord[] {
  const now = new Date().toISOString()
  return [
    {
      id: `${bidId}-chk-1`,
      bid_id: bidId,
      envelope: 'technical',
      code: 'TECH-01',
      label: 'PhilGEPS Certificate of Platinum Registration & Membership (All Pages)',
      ra12009_clause: 'RA 12009 Sec. 23 & IRR Eligibility Class "A" Legal/Technical',
      beginner_tip:
        'Must be valid and current on the date of bid opening. Verify that Annex "A" (Mayor’s Permit, Tax Clearance, Audited FS, PCAB) has no expired dates.',
      is_required: true,
      is_completed: true,
      updated_at: now,
    },
    {
      id: `${bidId}-chk-2`,
      bid_id: bidId,
      envelope: 'technical',
      code: 'TECH-02',
      label: 'Valid PCAB License & Registration for the Size Range of the Contract',
      ra12009_clause: 'RA 12009 Infrastructure Contractor Eligibility',
      beginner_tip:
        'Check the Invitation to Bid (ITB) for the required PCAB License Category (e.g., Category B / Medium A) and make sure your license covers this project size.',
      is_required: true,
      is_completed: true,
      updated_at: now,
    },
    {
      id: `${bidId}-chk-3`,
      bid_id: bidId,
      envelope: 'technical',
      code: 'TECH-03',
      label: 'Statement of All Ongoing Government & Private Construction Contracts + SLCC',
      ra12009_clause: 'RA 12009 Technical Capability (Single Largest Completed Contract >= 50% of ABC)',
      beginner_tip:
        'List all unfinished contracts and attach your Single Largest Completed Contract (SLCC) of similar nature worth at least 50% of the ABC.',
      is_required: true,
      is_completed: true,
      updated_at: now,
    },
    {
      id: `${bidId}-chk-4`,
      bid_id: bidId,
      envelope: 'technical',
      code: 'TECH-04',
      label: 'Net Financial Contracting Capacity (NFCC) Computation >= ABC',
      ra12009_clause: 'RA 12009 Financial Eligibility (NFCC = [(CA - CL) x 15] - Ongoing Contracts)',
      beginner_tip:
        'Formula: ((Current Assets minus Current Liabilities) × 15) minus value of all outstanding/ongoing works. Your NFCC must be at least equal to the ABC!',
      is_required: true,
      is_completed: true,
      updated_at: now,
    },
    {
      id: `${bidId}-chk-5`,
      bid_id: bidId,
      envelope: 'technical',
      code: 'TECH-05',
      label: 'Bid Security (Bid Securing Declaration or 2% Cash/Bank Guarantee or 5% Surety Bond)',
      ra12009_clause: 'RA 12009 Sec. 27 Bid Security',
      beginner_tip:
        'A notarized Bid Securing Declaration (BSD) is free and accepted by most procuring entities, or you can post a 2% Bank Guarantee / 5% Surety Bond.',
      is_required: true,
      is_completed: true,
      updated_at: now,
    },
    {
      id: `${bidId}-chk-6`,
      bid_id: bidId,
      envelope: 'technical',
      code: 'TECH-06',
      label: 'Organizational Chart, Key Personnel (Project Manager, Materials Engineer, Safety Officer) & Major Equipment Pledge',
      ra12009_clause: 'RA 12009 Technical Component - Project Requirements',
      beginner_tip:
        'Attach PRC IDs, accredited Materials Engineer certificate, DOLE-accredited Safety Officer certificate, and proof of ownership/lease of pledged equipment.',
      is_required: true,
      is_completed: false,
      updated_at: now,
    },
    {
      id: `${bidId}-chk-7`,
      bid_id: bidId,
      envelope: 'technical',
      code: 'TECH-07',
      label: 'Notarized Omnibus Sworn Statement (OSS)',
      ra12009_clause: 'RA 12009 GPPB Standard Form OSS',
      beginner_tip:
        'Must use the latest GPPB-prescribed template, signed by the authorized representative with valid government ID and Secretary’s Certificate / SPA.',
      is_required: true,
      is_completed: false,
      updated_at: now,
    },
    {
      id: `${bidId}-chk-8`,
      bid_id: bidId,
      envelope: 'financial',
      code: 'FIN-01',
      label: 'Signed Financial Bid Form (Total Bid Price in Words & Figures <= ABC)',
      ra12009_clause: 'RA 12009 Second Envelope - Financial Component',
      beginner_tip:
        'Any bid price above the Approved Budget for the Contract (ABC) is automatically disqualified at opening. Double-check words vs. figures!',
      is_required: true,
      is_completed: true,
      updated_at: now,
    },
    {
      id: `${bidId}-chk-9`,
      bid_id: bidId,
      envelope: 'financial',
      code: 'FIN-02',
      label: 'Priced Bill of Quantities (BOQ) & Detailed Estimates (DUPA)',
      ra12009_clause: 'RA 12009 Financial Component - Detailed Unit Price Analysis',
      beginner_tip:
        'Show direct costs (Materials, Labor, Equipment) plus indirect costs (OCM, Contractor’s Profit, and 5% VAT) for every pay item.',
      is_required: true,
      is_completed: true,
      updated_at: now,
    },
    {
      id: `${bidId}-chk-10`,
      bid_id: bidId,
      envelope: 'financial',
      code: 'FIN-03',
      label: 'Cash Flow by Quarter & Payment Schedule',
      ra12009_clause: 'RA 12009 Financial Envelope S-Curve & Cash Flow',
      beginner_tip:
        'Break down projected quarterly accomplishment and billing schedule across the contract duration.',
      is_required: true,
      is_completed: false,
      updated_at: now,
    },
  ]
}

const INITIAL_BIDDING_SEED: BiddingStoreData = {
  rules: {
    id: 'default-rules',
    procurement_law: 'RA 12009 (New Government Procurement Act)',
    default_ocm_pct: 12,
    default_profit_pct: 8,
    default_vat_pct: 5,
    nfcc_multiplier: 15,
    max_bid_abc_pct: 100,
    reminder_days_before: 3,
    require_philgeps: true,
    require_pcab: true,
    require_nfcc: true,
    require_bid_security: true,
    require_omnibus_sworn: true,
    updated_by_email: 'lacuatachristian01@gmail.com',
    updated_at: '2026-11-01T08:00:00Z',
  },
  bids: [
    {
      id: 'bid-1',
      reference_no: 'ITB-2026-DPWH-014',
      title: 'Construction of 4-Storey Municipal Disaster Operations Center',
      procuring_entity: 'DPWH Regional Office IV-A / LGU Cavite',
      location: 'Imus City, Cavite',
      procurement_mode: 'Competitive Bidding (RA 12009)',
      pcab_category: 'Category B - Medium A',
      abc_amount: 18500000,
      bid_amount: 17480000,
      current_assets: 9500000,
      current_liabilities: 2200000,
      ongoing_contracts_value: 24500000,
      nfcc_computed: 85000000,
      bid_security_type: 'Bid Securing Declaration (BSD)',
      bid_security_amount: 0,
      pre_bid_date: '2026-11-01',
      submission_deadline: '2026-11-07',
      opening_date: '2026-11-07',
      contract_duration_days: 240,
      status: 'checklist',
      prepared_by_email: 'christianlacuata83@gmail.com',
      notes: 'Envelope 1 & 2 nearly complete. Waiting for final Engineer review before sealing.',
      created_at: '2026-10-25T09:00:00Z',
      updated_at: '2026-11-04T09:00:00Z',
    },
    {
      id: 'bid-2',
      reference_no: 'ITB-2026-DEPED-089',
      title: 'Rehabilitation & Seismic Retrofitting of Science Building',
      procuring_entity: 'DepEd Division of Quezon City',
      location: 'Quezon City, Metro Manila',
      procurement_mode: 'Competitive Bidding (RA 12009)',
      pcab_category: 'Category C - Small B',
      abc_amount: 9200000,
      bid_amount: 8795000,
      current_assets: 6000000,
      current_liabilities: 1500000,
      ongoing_contracts_value: 12000000,
      nfcc_computed: 55500000,
      bid_security_type: 'Surety Bond (5% of ABC)',
      bid_security_amount: 460000,
      pre_bid_date: '2026-10-18',
      submission_deadline: '2026-10-29',
      opening_date: '2026-10-29',
      contract_duration_days: 150,
      status: 'awarded',
      prepared_by_email: 'lacuatachristian01@gmail.com',
      approved_by_email: 'lacuatachristian01@gmail.com',
      approved_at: '2026-10-27T14:00:00Z',
      submitted_at: '2026-10-28T10:30:00Z',
      award_notice_no: 'NOA-2026-QC-104',
      award_date: '2026-11-02',
      award_remarks: 'Lowest Calculated and Responsive Bid (LCRB) under RA 12009 post-qualification.',
      notes: 'Notice of Award received — ready for Admin/Engineer to convert into an active project!',
      created_at: '2026-10-12T08:30:00Z',
      updated_at: '2026-11-02T16:00:00Z',
    },
    {
      id: 'bid-3',
      reference_no: 'ITB-2026-LGU-112',
      title: 'Drainage & Concrete Road Widening along Barangay San Isidro',
      procuring_entity: 'City Government of Santa Rosa',
      location: 'Santa Rosa, Laguna',
      procurement_mode: 'Competitive Bidding (RA 12009)',
      pcab_category: 'Category B - Medium A',
      abc_amount: 14000000,
      bid_amount: 13125000,
      current_assets: 9500000,
      current_liabilities: 2200000,
      ongoing_contracts_value: 24500000,
      nfcc_computed: 85000000,
      bid_security_type: 'Bid Securing Declaration (BSD)',
      bid_security_amount: 0,
      pre_bid_date: '2026-11-05',
      submission_deadline: '2026-11-16',
      opening_date: '2026-11-16',
      contract_duration_days: 180,
      status: 'estimating',
      prepared_by_email: 'christianlacuata83@gmail.com',
      notes: 'Computing BOQ concrete & rebar quantities and equipment rental rates.',
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-04T11:00:00Z',
    },
  ],
  estimates: [
    {
      id: 'est-1',
      bid_id: 'bid-1',
      item_no: 'PART I - B.5',
      category: 'Mobilization & Overhead',
      description: 'Project Billboard, OSH Program, Mobilization & Demobilization',
      unit: 'lump sum',
      quantity: 1,
      unit_cost: 380000,
      direct_cost: 380000,
      ocm_pct: 12,
      profit_pct: 8,
      vat_pct: 5,
      total_amount: 478800,
      created_at: '2026-10-26T08:00:00Z',
    },
    {
      id: 'est-2',
      bid_id: 'bid-1',
      item_no: 'PART II - 900(1)c',
      category: 'Materials',
      description: 'Structural Concrete (Class A, 28 days, 4000 psi) & Deformed Reinforcing Steel Grade 60',
      unit: 'cu.m',
      quantity: 1150,
      unit_cost: 8400,
      direct_cost: 9660000,
      ocm_pct: 12,
      profit_pct: 8,
      vat_pct: 5,
      total_amount: 12171600,
      created_at: '2026-10-26T09:00:00Z',
    },
    {
      id: 'est-3',
      bid_id: 'bid-1',
      item_no: 'PART III - 1000',
      category: 'Labor',
      description: 'Skilled Structural Masons, Steelmen, Formworks Carpenters & MEPFS Crew',
      unit: 'man-days',
      quantity: 3200,
      unit_cost: 950,
      direct_cost: 3040000,
      ocm_pct: 12,
      profit_pct: 8,
      vat_pct: 5,
      total_amount: 3830400,
      created_at: '2026-10-27T09:00:00Z',
    },
    {
      id: 'est-4',
      bid_id: 'bid-1',
      item_no: 'PART IV - EQ-01',
      category: 'Equipment',
      description: 'Backhoe, Transit Mixer, Tower Hoist & Vibrator Rental',
      unit: 'hours',
      quantity: 396.5,
      unit_cost: 2000,
      direct_cost: 793000,
      ocm_pct: 12,
      profit_pct: 8,
      vat_pct: 5,
      total_amount: 999180,
      created_at: '2026-10-27T10:00:00Z',
    },
    {
      id: 'est-5',
      bid_id: 'bid-2',
      item_no: 'ITEM 101',
      category: 'Materials',
      description: 'Carbon Fiber Wrapping (CFRP), Structural Epoxy Injection & Steel Jacketing',
      unit: 'lot',
      quantity: 1,
      unit_cost: 5200000,
      direct_cost: 5200000,
      ocm_pct: 12,
      profit_pct: 8,
      vat_pct: 5,
      total_amount: 6552000,
      created_at: '2026-10-15T10:00:00Z',
    },
    {
      id: 'est-6',
      bid_id: 'bid-2',
      item_no: 'ITEM 102',
      category: 'Labor',
      description: 'Retrofitting Specialists, Structural Welders & Architectural Restoration Crew',
      unit: 'lot',
      quantity: 1,
      unit_cost: 1780158.73,
      direct_cost: 1780158.73,
      ocm_pct: 12,
      profit_pct: 8,
      vat_pct: 5,
      total_amount: 2243000,
      created_at: '2026-10-15T11:00:00Z',
    },
    {
      id: 'est-7',
      bid_id: 'bid-3',
      item_no: 'ITEM 311(1)e1',
      category: 'Materials',
      description: 'Portland Cement Concrete Pavement (PCCP, 280mm thick) & Reinforced Box Culvert',
      unit: 'sq.m',
      quantity: 4200,
      unit_cost: 2480,
      direct_cost: 10416666.67,
      ocm_pct: 12,
      profit_pct: 8,
      vat_pct: 5,
      total_amount: 13125000,
      created_at: '2026-11-02T10:00:00Z',
    },
  ],
  checklist_items: [
    ...buildDefaultChecklistForBid('bid-1'),
    ...buildDefaultChecklistForBid('bid-2').map((item) => ({
      ...item,
      is_completed: true,
      verified_by_email: 'lacuatachristian01@gmail.com',
    })),
    ...buildDefaultChecklistForBid('bid-3').map((item, idx) => ({
      ...item,
      is_completed: idx < 3,
    })),
  ],
  documents: [
    {
      id: 'bdoc-1',
      bid_id: 'bid-1',
      envelope: 'technical',
      title: 'PhilGEPS Platinum Certificate & Annex A (Valid 2026).pdf',
      file_url: 'https://vpzorfwfbgyttsuwjshx.supabase.co/storage/v1/object/public/bidding/philgeps-platinum-2026.pdf',
      file_type: 'PDF',
      uploaded_by_email: 'christianlacuata83@gmail.com',
      created_at: '2026-10-28T09:30:00Z',
    },
    {
      id: 'bdoc-2',
      bid_id: 'bid-1',
      envelope: 'technical',
      title: 'PCAB License Category B & NFCC Computation Sheet.pdf',
      file_url: 'https://vpzorfwfbgyttsuwjshx.supabase.co/storage/v1/object/public/bidding/pcab-nfcc-bid1.pdf',
      file_type: 'PDF',
      uploaded_by_email: 'christianlacuata83@gmail.com',
      created_at: '2026-10-29T11:15:00Z',
    },
    {
      id: 'bdoc-3',
      bid_id: 'bid-1',
      envelope: 'financial',
      title: 'Priced Bill of Quantities (BOQ) & DUPA Breakdown.xlsx',
      file_url: 'https://vpzorfwfbgyttsuwjshx.supabase.co/storage/v1/object/public/bidding/boq-dupa-bid1.xlsx',
      file_type: 'XLSX',
      uploaded_by_email: 'christianlacuata83@gmail.com',
      created_at: '2026-11-01T14:20:00Z',
    },
    {
      id: 'bdoc-4',
      bid_id: 'bid-2',
      envelope: 'technical',
      title: 'Notice of Award (NOA-2026-QC-104) & BAC Resolution.pdf',
      file_url: 'https://vpzorfwfbgyttsuwjshx.supabase.co/storage/v1/object/public/bidding/noa-deped-bid2.pdf',
      file_type: 'PDF',
      uploaded_by_email: 'lacuatachristian01@gmail.com',
      created_at: '2026-11-02T15:00:00Z',
    },
  ],
}

export function readBiddingStore(): BiddingStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(BIDDING_STORE_PATH)) {
      fs.writeFileSync(BIDDING_STORE_PATH, JSON.stringify(INITIAL_BIDDING_SEED, null, 2), 'utf-8')
      return INITIAL_BIDDING_SEED
    }
    const raw = fs.readFileSync(BIDDING_STORE_PATH, 'utf-8')
    return JSON.parse(raw) as BiddingStoreData
  } catch {
    return INITIAL_BIDDING_SEED
  }
}

export function writeBiddingStore(data: BiddingStoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  fs.writeFileSync(BIDDING_STORE_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

async function trySyncSupabase(table: string, record: Record<string, unknown>, mode: 'insert' | 'upsert' = 'upsert') {
  try {
    const db = getAdminDb()
    if (mode === 'insert') {
      await db.from(table).insert(record)
    } else {
      await db.from(table).upsert(record)
    }
  } catch {
    // Local store already updated
  }
}

export function computeNfcc(
  currentAssets: number,
  currentLiabilities: number,
  ongoingContracts: number,
  multiplier = 15
): number {
  return Math.max(0, (currentAssets - currentLiabilities) * multiplier - ongoingContracts)
}

export function recalculateBidTotal(store: BiddingStoreData, bidId: string): number {
  const items = store.estimates.filter((e) => e.bid_id === bidId)
  const sum = items.reduce((acc, item) => acc + Number(item.total_amount || 0), 0)
  const bid = store.bids.find((b) => b.id === bidId)
  if (bid && items.length > 0) {
    bid.bid_amount = Math.round(sum * 100) / 100
    bid.updated_at = new Date().toISOString()
  }
  return bid?.bid_amount ?? 0
}

export async function createBid(
  input: {
    reference_no: string
    title: string
    procuring_entity: string
    location: string
    procurement_mode?: string
    pcab_category?: string
    abc_amount: number
    current_assets?: number
    current_liabilities?: number
    ongoing_contracts_value?: number
    bid_security_type?: string
    bid_security_amount?: number
    pre_bid_date?: string
    submission_deadline: string
    opening_date?: string
    contract_duration_days?: number
    notes?: string
  },
  userEmail: string
): Promise<BidRecord> {
  const store = readBiddingStore()
  const id = `bid-${randomUUID().slice(0, 8)}`
  const now = new Date().toISOString()
  const ca = Number(input.current_assets ?? 9500000)
  const cl = Number(input.current_liabilities ?? 2200000)
  const ongoing = Number(input.ongoing_contracts_value ?? 20000000)
  const nfcc = computeNfcc(ca, cl, ongoing, store.rules.nfcc_multiplier)

  const record: BidRecord = {
    id,
    reference_no: input.reference_no,
    title: input.title,
    procuring_entity: input.procuring_entity,
    location: input.location || 'Metro Manila',
    procurement_mode: input.procurement_mode || 'Competitive Bidding (RA 12009)',
    pcab_category: input.pcab_category || 'Category B - Medium A',
    abc_amount: Number(input.abc_amount) || 0,
    bid_amount: 0,
    current_assets: ca,
    current_liabilities: cl,
    ongoing_contracts_value: ongoing,
    nfcc_computed: nfcc,
    bid_security_type: input.bid_security_type || 'Bid Securing Declaration (BSD)',
    bid_security_amount: Number(input.bid_security_amount) || 0,
    pre_bid_date: input.pre_bid_date || input.submission_deadline,
    submission_deadline: input.submission_deadline,
    opening_date: input.opening_date || input.submission_deadline,
    contract_duration_days: Number(input.contract_duration_days) || 180,
    status: 'draft',
    prepared_by_email: userEmail,
    notes: input.notes || '',
    created_at: now,
    updated_at: now,
  }

  const defaultChecklists = buildDefaultChecklistForBid(id).map((c) => ({
    ...c,
    is_completed: false,
  }))

  store.bids.unshift(record)
  store.checklist_items.push(...defaultChecklists)
  writeBiddingStore(store)
  await trySyncSupabase('bids', record as unknown as Record<string, unknown>, 'insert')
  return record
}

export async function addBidEstimateItem(input: {
  bid_id: string
  item_no: string
  category: BidEstimateRecord['category']
  description: string
  unit: string
  quantity: number
  unit_cost: number
  ocm_pct?: number
  profit_pct?: number
  vat_pct?: number
}): Promise<BidEstimateRecord> {
  const store = readBiddingStore()
  const qty = Number(input.quantity) || 1
  const unitCost = Number(input.unit_cost) || 0
  const directCost = Math.round(qty * unitCost * 100) / 100
  const ocmPct = Number(input.ocm_pct ?? store.rules.default_ocm_pct)
  const profitPct = Number(input.profit_pct ?? store.rules.default_profit_pct)
  const vatPct = Number(input.vat_pct ?? store.rules.default_vat_pct)
  const markupMultiplier = 1 + (ocmPct + profitPct) / 100
  const withMarkup = directCost * markupMultiplier
  const totalAmount = Math.round(withMarkup * (1 + vatPct / 100) * 100) / 100

  const record: BidEstimateRecord = {
    id: `est-${randomUUID().slice(0, 8)}`,
    bid_id: input.bid_id,
    item_no: input.item_no || 'ITEM-01',
    category: input.category,
    description: input.description,
    unit: input.unit || 'lot',
    quantity: qty,
    unit_cost: unitCost,
    direct_cost: directCost,
    ocm_pct: ocmPct,
    profit_pct: profitPct,
    vat_pct: vatPct,
    total_amount: totalAmount,
    created_at: new Date().toISOString(),
  }

  store.estimates.push(record)
  const bid = store.bids.find((b) => b.id === input.bid_id)
  if (bid && bid.status === 'draft') {
    bid.status = 'estimating'
  }
  recalculateBidTotal(store, input.bid_id)
  writeBiddingStore(store)
  await trySyncSupabase('bid_estimates', record as unknown as Record<string, unknown>, 'insert')
  return record
}

export async function deleteBidEstimateItem(estimateId: string, bidId: string): Promise<void> {
  const store = readBiddingStore()
  store.estimates = store.estimates.filter((e) => e.id !== estimateId)
  recalculateBidTotal(store, bidId)
  writeBiddingStore(store)
}

export async function toggleBidChecklistItem(
  itemId: string,
  userEmail: string
): Promise<BidChecklistItemRecord | null> {
  const store = readBiddingStore()
  const item = store.checklist_items.find((c) => c.id === itemId)
  if (!item) return null
  item.is_completed = !item.is_completed
  item.verified_by_email = item.is_completed ? userEmail : undefined
  item.updated_at = new Date().toISOString()

  const bid = store.bids.find((b) => b.id === item.bid_id)
  if (bid && (bid.status === 'draft' || bid.status === 'estimating')) {
    bid.status = 'checklist'
    bid.updated_at = new Date().toISOString()
  }

  writeBiddingStore(store)
  await trySyncSupabase('bid_checklist_items', item as unknown as Record<string, unknown>)
  return item
}

export async function addBidDocument(
  input: {
    bid_id: string
    envelope: 'technical' | 'financial'
    title: string
    file_url: string
    file_type: string
  },
  userEmail: string
): Promise<BidDocumentRecord> {
  const store = readBiddingStore()
  const record: BidDocumentRecord = {
    id: `bdoc-${randomUUID().slice(0, 8)}`,
    bid_id: input.bid_id,
    envelope: input.envelope,
    title: input.title,
    file_url: input.file_url,
    file_type: input.file_type || 'PDF',
    uploaded_by_email: userEmail,
    created_at: new Date().toISOString(),
  }
  store.documents.unshift(record)
  writeBiddingStore(store)
  await trySyncSupabase('bid_documents', record as unknown as Record<string, unknown>, 'insert')
  return record
}

export async function updateBidStageOrDetails(
  bidId: string,
  patch: Partial<BidRecord>
): Promise<BidRecord | null> {
  const store = readBiddingStore()
  const bid = store.bids.find((b) => b.id === bidId)
  if (!bid) return null

  Object.assign(bid, patch)
  if (
    patch.current_assets !== undefined ||
    patch.current_liabilities !== undefined ||
    patch.ongoing_contracts_value !== undefined
  ) {
    bid.nfcc_computed = computeNfcc(
      Number(bid.current_assets),
      Number(bid.current_liabilities),
      Number(bid.ongoing_contracts_value),
      store.rules.nfcc_multiplier
    )
  }
  bid.updated_at = new Date().toISOString()
  writeBiddingStore(store)
  await trySyncSupabase('bids', bid as unknown as Record<string, unknown>)
  return bid
}

export async function convertAwardedBidToProject(
  bidId: string,
  adminEmail: string
): Promise<{ bid: BidRecord; projectId: string } | null> {
  const store = readBiddingStore()
  const bid = store.bids.find((b) => b.id === bidId)
  if (!bid) return null

  const startDate = new Date().toISOString().slice(0, 10)
  const endDateObj = new Date()
  endDateObj.setDate(endDateObj.getDate() + (bid.contract_duration_days || 180))
  const endDate = endDateObj.toISOString().slice(0, 10)

  const newProject: ProjectRecord = {
    id: newId('proj'),
    name: `${bid.title} (${bid.reference_no})`,
    location: bid.location,
    description: `Converted from Awarded RA 12009 Bid ${bid.reference_no} (${bid.procuring_entity}). Approved by ${adminEmail}.`,
    budget: bid.bid_amount > 0 ? bid.bid_amount : bid.abc_amount,
    start_date: startDate,
    end_date: endDate,
    status: 'active',
    progress: 0,
    created_at: new Date().toISOString(),
  }

  const mainStore = readStore()
  mainStore.projects.unshift(newProject)
  writeStore(mainStore)
  await trySupabaseInsert('projects', newProject as unknown as Record<string, unknown>)

  bid.status = 'converted'
  bid.converted_project_id = newProject.id
  bid.updated_at = new Date().toISOString()
  writeBiddingStore(store)
  await trySyncSupabase('bids', bid as unknown as Record<string, unknown>)

  return { bid, projectId: newProject.id }
}

export async function updateBiddingRules(
  patch: Partial<BiddingRulesRecord>,
  adminEmail: string
): Promise<BiddingRulesRecord> {
  const store = readBiddingStore()
  store.rules = {
    ...store.rules,
    ...patch,
    updated_by_email: adminEmail,
    updated_at: new Date().toISOString(),
  }
  writeBiddingStore(store)
  await trySyncSupabase('bidding_rules', store.rules as unknown as Record<string, unknown>)
  return store.rules
}
