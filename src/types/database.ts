import type { UserRole } from '@/lib/roles'

export interface UserStory {
  id: string
  role: UserRole | 'any'
  roleLabel: string
  story: string
  acceptanceCriteria: string
  module: string
  tableNames: string[]
}

// Section 3: Requirements written as User Stories
export const USER_STORIES: UserStory[] = [
  {
    id: 'US-01',
    role: 'any',
    roleLabel: 'Any User',
    story: 'As a user, I sign in with my Google account in one click.',
    acceptanceCriteria: 'OAuth flow links or creates a verified profile with default worker role.',
    module: 'Authentication & Roles',
    tableNames: ['profiles'],
  },
  {
    id: 'US-02',
    role: 'any',
    roleLabel: 'New User',
    story: 'As a new user, I receive a confirmation email and must confirm before I can use the system.',
    acceptanceCriteria: 'Unconfirmed accounts are redirected to /verify with a 60s rate-limited resend button.',
    module: 'Authentication & Roles',
    tableNames: ['profiles', 'email_verifications'],
  },
  {
    id: 'US-03',
    role: 'admin_engineer',
    roleLabel: 'Admin / Engineer',
    story: 'As an Admin/Engineer, I manage all user accounts, projects, budgets, approvals, and engineering tasks.',
    acceptanceCriteria: 'Full access to all modules and role assignment (Admin/Engineer, Assistant, Contractor, Client).',
    module: 'Users & Roles',
    tableNames: ['profiles', 'project_members'],
  },
  {
    id: 'US-04',
    role: 'assistant',
    roleLabel: 'Assistant',
    story: 'As an Assistant, I can access all modules across the system to help manage projects, logs, inventory, attendance, and documents.',
    acceptanceCriteria: 'Assistant role has full module access across the sidebar.',
    module: 'All Modules',
    tableNames: ['projects', 'tasks', 'materials', 'attendance', 'expenses', 'documents'],
  },
  {
    id: 'US-05',
    role: 'contractor',
    roleLabel: 'Contractor',
    story: 'As a Contractor, I record daily site progress with photos, update tasks, log materials, and record worker attendance.',
    acceptanceCriteria: 'Strictly limited to Tasks, Daily Logs, Materials, Attendance, and Equipment (no Budgets/Expenses).',
    module: 'Daily Logs & Site Ops',
    tableNames: ['daily_logs', 'tasks', 'materials', 'attendance', 'equipment'],
  },
  {
    id: 'US-06',
    role: 'admin_engineer',
    roleLabel: 'Admin / Engineer',
    story: 'As an Engineer, I assign tasks to contractors and update task completion percentages and status.',
    acceptanceCriteria: 'Tasks move from todo -> in_progress -> review -> completed with 0–100% progress.',
    module: 'Tasks & Progress',
    tableNames: ['tasks'],
  },
  {
    id: 'US-07',
    role: 'contractor',
    roleLabel: 'Contractor',
    story: 'As a Contractor, I log materials received and used on site, and I am warned when stock is low.',
    acceptanceCriteria: 'Stock IN increases current_stock, Stock OUT decreases it, and current_stock <= reorder_level triggers a low-stock alert.',
    module: 'Materials & Inventory',
    tableNames: ['materials', 'material_transactions'],
  },
  {
    id: 'US-08',
    role: 'contractor',
    roleLabel: 'Contractor',
    story: 'As a Contractor, I record daily worker attendance and hours worked per project site.',
    acceptanceCriteria: 'Attendance logs hours (0–24) per worker, project, and date and calculates labor cost from daily_rate.',
    module: 'Workers & Attendance',
    tableNames: ['workers', 'attendance'],
  },
  {
    id: 'US-09',
    role: 'contractor',
    roleLabel: 'Contractor / Engineer',
    story: 'As a Contractor or Engineer, I track heavy equipment availability, site assignment, and maintenance status.',
    acceptanceCriteria: 'Equipment shows status (available, in_use, maintenance, retired) and current project.',
    module: 'Equipment',
    tableNames: ['equipment'],
  },
  {
    id: 'US-10',
    role: 'admin_engineer',
    roleLabel: 'Admin / Engineer',
    story: 'As an Admin/Engineer, I see budget versus actual cost per project and approve or reject submitted expenses.',
    acceptanceCriteria: 'Only Admin/Engineer can approve expenses; Contractors cannot access budgets or expenses.',
    module: 'Expenses & Budget',
    tableNames: ['expenses', 'projects'],
  },
  {
    id: 'US-11',
    role: 'client',
    roleLabel: 'Client',
    story: 'As a client, I view read-only project progress, daily logs, documents, and weekly progress reports.',
    acceptanceCriteria: 'Client role can view progress and export reports but cannot create, edit, or delete records.',
    module: 'Dashboard & Reports',
    tableNames: ['projects', 'daily_logs', 'documents'],
  },
]

// Section 4: The 13 Database Tables specification
export interface DatabaseTableSpec {
  table: string
  purpose: string
  primaryKey: string
  foreignKeys: string[]
  indexes: string[]
  keyColumns: string[]
}

export const DATABASE_TABLES: DatabaseTableSpec[] = [
  {
    table: 'profiles',
    purpose: 'Account, role, email, email_verified, avatar (maps to "users" in the guide)',
    primaryKey: 'id (uuid -> auth.users.id)',
    foreignKeys: ['id -> auth.users(id)'],
    indexes: ['profiles_role_idx (role)'],
    keyColumns: ['id', 'email', 'full_name', 'avatar_url', 'role', 'email_verified'],
  },
  {
    table: 'projects',
    purpose: 'Name, location, budget, start and end dates, status',
    primaryKey: 'id (uuid)',
    foreignKeys: ['created_by -> profiles(id)'],
    indexes: ['projects_status_idx (status)'],
    keyColumns: ['id', 'name', 'location', 'budget', 'start_date', 'end_date', 'status', 'progress'],
  },
  {
    table: 'project_members',
    purpose: 'Which users belong to which project and their project role',
    primaryKey: 'id (uuid)',
    foreignKeys: ['project_id -> projects(id)', 'user_id -> profiles(id)'],
    indexes: ['project_members_project_idx', 'project_members_user_idx'],
    keyColumns: ['id', 'project_id', 'user_id', 'project_role'],
  },
  {
    table: 'tasks',
    purpose: 'Title, status, percent complete, assigned user, due date',
    primaryKey: 'id (uuid)',
    foreignKeys: ['project_id -> projects(id)', 'assigned_user_id -> profiles(id)'],
    indexes: ['tasks_project_idx', 'tasks_status_idx', 'tasks_assigned_user_idx'],
    keyColumns: ['id', 'project_id', 'title', 'status', 'percent_complete', 'assigned_user_id', 'due_date'],
  },
  {
    table: 'materials',
    purpose: 'Name, unit, current stock, reorder level',
    primaryKey: 'id (uuid)',
    foreignKeys: [],
    indexes: [],
    keyColumns: ['id', 'name', 'unit', 'current_stock', 'reorder_level', 'unit_cost'],
  },
  {
    table: 'material_transactions',
    purpose: 'Stock in and out, project, date, quantity',
    primaryKey: 'id (uuid)',
    foreignKeys: ['material_id -> materials(id)', 'project_id -> projects(id)', 'recorded_by -> profiles(id)'],
    indexes: ['material_tx_material_idx', 'material_tx_project_idx', 'material_tx_date_idx'],
    keyColumns: ['id', 'material_id', 'project_id', 'transaction_type', 'quantity', 'transaction_date'],
  },
  {
    table: 'workers',
    purpose: 'Worker details and daily rate',
    primaryKey: 'id (uuid)',
    foreignKeys: ['profile_id -> profiles(id)'],
    indexes: [],
    keyColumns: ['id', 'full_name', 'trade', 'phone', 'daily_rate', 'active'],
  },
  {
    table: 'attendance',
    purpose: 'Worker, project, date, hours',
    primaryKey: 'id (uuid)',
    foreignKeys: ['worker_id -> workers(id)', 'project_id -> projects(id)', 'recorded_by -> profiles(id)'],
    indexes: ['attendance_project_idx', 'attendance_date_idx', 'attendance_worker_idx'],
    keyColumns: ['id', 'worker_id', 'project_id', 'attendance_date', 'hours_worked', 'status'],
  },
  {
    table: 'equipment',
    purpose: 'Equipment list and status',
    primaryKey: 'id (uuid)',
    foreignKeys: ['project_id -> projects(id)'],
    indexes: ['equipment_project_idx', 'equipment_status_idx'],
    keyColumns: ['id', 'name', 'serial_code', 'status', 'project_id'],
  },
  {
    table: 'expenses',
    purpose: 'Amount, category, project, approval status',
    primaryKey: 'id (uuid)',
    foreignKeys: ['project_id -> projects(id)', 'submitted_by -> profiles(id)', 'approved_by -> profiles(id)'],
    indexes: ['expenses_project_idx', 'expenses_status_idx', 'expenses_date_idx'],
    keyColumns: ['id', 'project_id', 'category', 'amount', 'expense_date', 'approval_status'],
  },
  {
    table: 'daily_logs',
    purpose: 'Date, weather, notes, photos, author',
    primaryKey: 'id (uuid)',
    foreignKeys: ['project_id -> projects(id)', 'author_id -> profiles(id)'],
    indexes: ['daily_logs_project_idx', 'daily_logs_date_idx'],
    keyColumns: ['id', 'project_id', 'log_date', 'weather', 'notes', 'photos', 'author_id'],
  },
  {
    table: 'documents',
    purpose: 'Files linked to a project',
    primaryKey: 'id (uuid)',
    foreignKeys: ['project_id -> projects(id)', 'uploaded_by -> profiles(id)'],
    indexes: ['documents_project_idx'],
    keyColumns: ['id', 'project_id', 'title', 'file_url', 'file_type'],
  },
  {
    table: 'email_verifications',
    purpose: 'Token, user, target email, expiry, used flag',
    primaryKey: 'id (uuid)',
    foreignKeys: ['user_id -> profiles(id)'],
    indexes: ['email_verifications_token_idx', 'email_verifications_user_idx'],
    keyColumns: ['id', 'user_id', 'target_email', 'token', 'expires_at', 'used'],
  },
]

