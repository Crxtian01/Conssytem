import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { getAdminDb } from '@/lib/db'
import type { UserRole } from '@/lib/roles'

export interface ProjectRecord {
  id: string
  name: string
  location: string
  description: string
  budget: number
  start_date: string
  end_date: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  progress: number
  assigned_assistant?: boolean
  assigned_contractor?: boolean
  created_at: string
}

export interface TaskRecord {
  id: string
  project_id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'review' | 'completed'
  percent_complete: number
  assigned_user_name: string
  due_date: string
  photo_url?: string
  created_at: string
}

export interface MaterialRecord {
  id: string
  name: string
  unit: string
  current_stock: number
  reorder_level: number
  unit_cost: number
  created_at: string
}

export interface MaterialTxRecord {
  id: string
  material_id: string
  material_name: string
  project_id: string
  transaction_type: 'in' | 'out'
  quantity: number
  transaction_date: string
  notes: string
  created_at: string
}

export interface MaterialRequestRecord {
  id: string
  material_id: string
  material_name: string
  project_id: string
  quantity: number
  unit: string
  urgency: 'Normal' | 'High' | 'Critical'
  notes: string
  approval_status: 'pending' | 'approved' | 'rejected'
  requested_by_email: string
  approved_by_email?: string
  created_at: string
}

export interface WorkerRecord {
  id: string
  full_name: string
  trade: string
  phone: string
  daily_rate: number
  active: boolean
  created_at: string
}

export interface AttendanceRecord {
  id: string
  worker_id: string
  worker_name: string
  project_id: string
  attendance_date: string
  hours_worked: number
  status: 'present' | 'half_day' | 'absent'
  created_at: string
}

export interface EquipmentRecord {
  id: string
  name: string
  serial_code: string
  status: 'available' | 'in_use' | 'maintenance' | 'retired'
  project_id: string
  notes: string
  created_at: string
}

export interface ExpenseRecord {
  id: string
  project_id: string
  category: string
  description: string
  amount: number
  expense_date: string
  approval_status: 'pending' | 'approved' | 'rejected'
  submitted_by_email: string
  approved_by_email?: string
  created_at: string
}

export interface DailyLogRecord {
  id: string
  project_id: string
  log_date: string
  weather: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy'
  notes: string
  photos: string[]
  author_email: string
  approval_status?: 'pending' | 'approved'
  created_at: string
}

export interface DocumentRecord {
  id: string
  project_id: string
  title: string
  file_url: string
  file_type: string
  uploaded_by_email: string
  shared_with_client?: boolean
  created_at: string
}

export interface RoleRequestRecord {
  id: string
  user_id: string
  user_email: string
  user_name: string
  current_role: UserRole
  requested_role: UserRole
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by_email?: string
  created_at: string
}

export interface StoreData {
  projects: ProjectRecord[]
  tasks: TaskRecord[]
  materials: MaterialRecord[]
  material_transactions: MaterialTxRecord[]
  material_requests: MaterialRequestRecord[]
  workers: WorkerRecord[]
  attendance: AttendanceRecord[]
  equipment: EquipmentRecord[]
  expenses: ExpenseRecord[]
  daily_logs: DailyLogRecord[]
  documents: DocumentRecord[]
  role_requests: RoleRequestRecord[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const STORE_PATH = path.join(DATA_DIR, 'store.json')

const INITIAL_SEED: StoreData = {
  projects: [
    {
      id: 'proj-1',
      name: 'Metro Commercial Tower Phase 1',
      location: 'Makati Central Business District',
      description: '18-story reinforced concrete commercial building with basement parking.',
      budget: 12500000,
      start_date: '2026-01-15',
      end_date: '2026-12-20',
      status: 'active',
      progress: 62,
      assigned_assistant: true,
      assigned_contractor: true,
      created_at: '2026-01-15T08:00:00Z',
    },
    {
      id: 'proj-2',
      name: 'Riverside Warehouse & Logistics Hub',
      location: 'Laguna Technopark, Biñan',
      description: 'Steel-frame industrial warehouse with loading bays and solar roof.',
      budget: 5800000,
      start_date: '2026-03-01',
      end_date: '2026-10-30',
      status: 'active',
      progress: 40,
      assigned_assistant: true,
      assigned_contractor: true,
      created_at: '2026-03-01T08:00:00Z',
    },
    {
      id: 'proj-3',
      name: 'Greenview Residential Townhomes',
      location: 'Quezon City',
      description: '12-unit gated residential townhome complex.',
      budget: 4200000,
      start_date: '2026-06-01',
      end_date: '2027-02-28',
      status: 'planning',
      progress: 15,
      assigned_assistant: true,
      assigned_contractor: false,
      created_at: '2026-06-01T08:00:00Z',
    },
  ],
  tasks: [
    {
      id: 'task-1',
      project_id: 'proj-1',
      title: 'Pour 8th Floor Concrete Slab',
      description: 'Complete rebar inspection and pour 3500 PSI ready-mix concrete.',
      status: 'in_progress',
      percent_complete: 70,
      assigned_user_name: 'Engr. Marco Santos',
      due_date: '2026-11-12',
      created_at: '2026-11-01T08:00:00Z',
    },
    {
      id: 'task-2',
      project_id: 'proj-1',
      title: 'Install Electrical Conduits (Floors 4–6)',
      description: 'Rough-in PVC and EMT conduits per approved MEP blueprint.',
      status: 'completed',
      percent_complete: 100,
      assigned_user_name: 'Foreman Noel Reyes',
      due_date: '2026-11-03',
      created_at: '2026-10-25T08:00:00Z',
    },
    {
      id: 'task-3',
      project_id: 'proj-2',
      title: 'Erect Steel Roof Trusses Bay A–D',
      description: 'Crane lift and bolt structural steel trusses.',
      status: 'todo',
      percent_complete: 15,
      assigned_user_name: 'Christian Lacuata',
      due_date: '2026-11-18',
      created_at: '2026-11-02T08:00:00Z',
    },
  ],
  materials: [
    {
      id: 'mat-1',
      name: 'Portland Cement (40kg)',
      unit: 'bags',
      current_stock: 340,
      reorder_level: 100,
      unit_cost: 245,
      created_at: '2026-10-01T08:00:00Z',
    },
    {
      id: 'mat-2',
      name: 'Deformed Steel Rebar 16mm',
      unit: 'pcs',
      current_stock: 42,
      reorder_level: 60,
      unit_cost: 410,
      created_at: '2026-10-01T08:00:00Z',
    },
    {
      id: 'mat-3',
      name: 'Marine Plywood 3/4"',
      unit: 'sheets',
      current_stock: 18,
      reorder_level: 25,
      unit_cost: 1350,
      created_at: '2026-10-01T08:00:00Z',
    },
    {
      id: 'mat-4',
      name: 'Crushed Gravel 3/4"',
      unit: 'm3',
      current_stock: 55,
      reorder_level: 20,
      unit_cost: 1600,
      created_at: '2026-10-01T08:00:00Z',
    },
  ],
  material_transactions: [
    {
      id: 'mtx-1',
      material_id: 'mat-1',
      material_name: 'Portland Cement (40kg)',
      project_id: 'proj-1',
      transaction_type: 'out',
      quantity: 80,
      transaction_date: '2026-11-03',
      notes: 'Used for 8th floor columns',
      created_at: '2026-11-03T10:00:00Z',
    },
    {
      id: 'mtx-2',
      material_id: 'mat-2',
      material_name: 'Deformed Steel Rebar 16mm',
      project_id: 'proj-1',
      transaction_type: 'out',
      quantity: 35,
      transaction_date: '2026-11-04',
      notes: 'Slab reinforcement — triggered low stock warning',
      created_at: '2026-11-04T09:00:00Z',
    },
  ],
  material_requests: [
    {
      id: 'mreq-1',
      material_id: 'mat-2',
      material_name: 'Deformed Steel Rebar 16mm',
      project_id: 'proj-1',
      quantity: 120,
      unit: 'pcs',
      urgency: 'Critical',
      notes: 'Urgent replenishment for 9th floor structural slab rebar tying',
      approval_status: 'pending',
      requested_by_email: 'christianlacuata83@gmail.com',
      created_at: '2026-11-05T08:30:00Z',
    },
    {
      id: 'mreq-2',
      material_id: 'mat-3',
      material_name: 'Marine Plywood 3/4"',
      project_id: 'proj-2',
      quantity: 40,
      unit: 'sheets',
      urgency: 'High',
      notes: 'Formwork replacement for warehouse loading bay',
      approval_status: 'approved',
      requested_by_email: 'christianlacuata83@gmail.com',
      approved_by_email: 'lacuatachristian01@gmail.com',
      created_at: '2026-11-04T14:00:00Z',
    },
  ],
  workers: [
    {
      id: 'wrk-1',
      full_name: 'Ramon Bautista',
      trade: 'Master Mason',
      phone: '0917-555-0142',
      daily_rate: 950,
      active: true,
      created_at: '2026-09-01T08:00:00Z',
    },
    {
      id: 'wrk-2',
      full_name: 'Arnel Villanueva',
      trade: 'Lead Carpenter',
      phone: '0918-555-0198',
      daily_rate: 900,
      active: true,
      created_at: '2026-09-01T08:00:00Z',
    },
    {
      id: 'wrk-3',
      full_name: 'Dennis Mendoza',
      trade: 'Licensed Electrician',
      phone: '0919-555-0221',
      daily_rate: 1100,
      active: true,
      created_at: '2026-09-01T08:00:00Z',
    },
    {
      id: 'wrk-4',
      full_name: 'Jomar Aquino',
      trade: 'Steelman / Welder',
      phone: '0920-555-0311',
      daily_rate: 950,
      active: true,
      created_at: '2026-09-01T08:00:00Z',
    },
  ],
  attendance: [
    {
      id: 'att-1',
      worker_id: 'wrk-1',
      worker_name: 'Ramon Bautista',
      project_id: 'proj-1',
      attendance_date: '2026-11-04',
      hours_worked: 8,
      status: 'present',
      created_at: '2026-11-04T08:00:00Z',
    },
    {
      id: 'att-2',
      worker_id: 'wrk-2',
      worker_name: 'Arnel Villanueva',
      project_id: 'proj-1',
      attendance_date: '2026-11-04',
      hours_worked: 8,
      status: 'present',
      created_at: '2026-11-04T08:00:00Z',
    },
    {
      id: 'att-3',
      worker_id: 'wrk-3',
      worker_name: 'Dennis Mendoza',
      project_id: 'proj-2',
      attendance_date: '2026-11-04',
      hours_worked: 4,
      status: 'half_day',
      created_at: '2026-11-04T08:00:00Z',
    },
  ],
  equipment: [
    {
      id: 'eq-1',
      name: 'Liebherr Tower Crane 85 EC-B',
      serial_code: 'TC-2026-01',
      status: 'in_use',
      project_id: 'proj-1',
      notes: 'Operating on 8th floor lift schedule',
      created_at: '2026-02-01T08:00:00Z',
    },
    {
      id: 'eq-2',
      name: 'CAT 320 Hydraulic Excavator',
      serial_code: 'EX-2025-09',
      status: 'in_use',
      project_id: 'proj-2',
      notes: 'Site grading and drainage trenching',
      created_at: '2026-02-01T08:00:00Z',
    },
    {
      id: 'eq-3',
      name: 'Diesel Concrete Mixer 1-Bag',
      serial_code: 'CM-2024-14',
      status: 'maintenance',
      project_id: 'proj-1',
      notes: 'Belt replacement in progress',
      created_at: '2026-02-01T08:00:00Z',
    },
  ],
  expenses: [
    {
      id: 'exp-1',
      project_id: 'proj-1',
      category: 'Materials',
      description: 'Ready-Mix Concrete batch delivery (24 cubic meters)',
      amount: 148000,
      expense_date: '2026-11-02',
      approval_status: 'approved',
      submitted_by_email: 'lacuatachristian01@gmail.com',
      approved_by_email: 'lacuatachristian01@gmail.com',
      created_at: '2026-11-02T11:00:00Z',
    },
    {
      id: 'exp-2',
      project_id: 'proj-1',
      category: 'Labor',
      description: 'Weekly site crew payroll (Week 44)',
      amount: 92500,
      expense_date: '2026-11-03',
      approval_status: 'approved',
      submitted_by_email: 'lacuatachristian01@gmail.com',
      approved_by_email: 'lacuatachristian01@gmail.com',
      created_at: '2026-11-03T15:00:00Z',
    },
    {
      id: 'exp-3',
      project_id: 'proj-2',
      category: 'Equipment',
      description: 'Mobile Crane 50-Ton 3-day rental for roof trusses',
      amount: 65000,
      expense_date: '2026-11-04',
      approval_status: 'pending',
      submitted_by_email: 'christianlacuata83@gmail.com',
      created_at: '2026-11-04T09:30:00Z',
    },
  ],
  daily_logs: [
    {
      id: 'log-1',
      project_id: 'proj-1',
      log_date: '2026-11-04',
      weather: 'Sunny',
      notes:
        'Completed rebar tying for Zone B 8th floor slab. City structural inspector approved formwork before concrete pour.',
      photos: [
        'https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
      ],
      author_email: 'lacuatachristian01@gmail.com',
      approval_status: 'approved',
      created_at: '2026-11-04T17:00:00Z',
    },
    {
      id: 'log-2',
      project_id: 'proj-2',
      log_date: '2026-11-03',
      weather: 'Cloudy',
      notes:
        'Delivered 12 steel roof trusses on site. Unloaded safely with crane and staged at Bay A.',
      photos: [
        'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
      ],
      author_email: 'christianlacuata83@gmail.com',
      approval_status: 'approved',
      created_at: '2026-11-03T16:30:00Z',
    },
  ],
  documents: [
    {
      id: 'doc-1',
      project_id: 'proj-1',
      title: 'Approved Structural & Foundation Blueprint v3.pdf',
      file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_type: 'PDF Blueprint',
      uploaded_by_email: 'lacuatachristian01@gmail.com',
      shared_with_client: true,
      created_at: '2026-10-15T09:00:00Z',
    },
    {
      id: 'doc-2',
      project_id: 'proj-1',
      title: 'City Building Permit & Safety Clearance.pdf',
      file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_type: 'Permit',
      uploaded_by_email: 'lacuatachristian01@gmail.com',
      shared_with_client: true,
      created_at: '2026-10-18T11:00:00Z',
    },
  ],
  role_requests: [],
}

let memoryStoreCache: StoreData | null = null

export function readStore(): StoreData {
  if (memoryStoreCache) {
    return memoryStoreCache
  }
  try {
    if (!fs.existsSync(STORE_PATH)) {
      memoryStoreCache = structuredClone(INITIAL_SEED)
      return memoryStoreCache
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw) as Partial<StoreData>
    memoryStoreCache = {
      projects: (parsed.projects ?? INITIAL_SEED.projects).map((p) => ({
        assigned_assistant: true,
        assigned_contractor: p.status === 'active',
        ...p,
      })),
      tasks: parsed.tasks ?? INITIAL_SEED.tasks,
      materials: parsed.materials ?? INITIAL_SEED.materials,
      material_transactions: parsed.material_transactions ?? INITIAL_SEED.material_transactions,
      material_requests: parsed.material_requests ?? INITIAL_SEED.material_requests,
      workers: parsed.workers ?? INITIAL_SEED.workers,
      attendance: parsed.attendance ?? INITIAL_SEED.attendance,
      equipment: parsed.equipment ?? INITIAL_SEED.equipment,
      expenses: parsed.expenses ?? INITIAL_SEED.expenses,
      daily_logs: (parsed.daily_logs ?? INITIAL_SEED.daily_logs).map((l) => ({
        approval_status: 'approved',
        ...l,
      })),
      documents: (parsed.documents ?? INITIAL_SEED.documents).map((d) => ({
        shared_with_client: true,
        ...d,
      })),
      role_requests: parsed.role_requests ?? INITIAL_SEED.role_requests,
    }
    return memoryStoreCache
  } catch {
    memoryStoreCache = structuredClone(INITIAL_SEED)
    return memoryStoreCache
  }
}

export function writeStore(data: StoreData): void {
  memoryStoreCache = data
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8')
  } catch {
    // On Vercel serverless (read-only filesystem), keep changes in memoryStoreCache
  }
}

export function newId(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`
}

// Sync helper: also mirrors into Supabase tables when 002_full_database_schema.sql has been run
export async function trySupabaseInsert(table: string, payload: Record<string, unknown>) {
  try {
    const adminDb = getAdminDb()
    await adminDb.from(table).insert(payload)
  } catch {
    // Ignore if table not created yet in Supabase; local store has it
  }
}
