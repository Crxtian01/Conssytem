export type UserRole = 'admin_engineer' | 'assistant' | 'contractor' | 'client'

export interface RoleDefinition {
  role: UserRole
  label: string
  badgeColor: string
  typicalAccess: string
  allowedModuleIds: string[]
  permissions: {
    manageUsers: boolean
    approveRoleRequests: boolean
    manageProjects: boolean
    updateProjectProgress: boolean
    prepareBids: boolean
    submitContractorBid: boolean
    approveAndAwardBids: boolean
    viewBudgets: boolean
    viewFinancialSummaries: boolean
    createPendingExpenses: boolean
    approveExpenses: boolean
    approveMaterialRequests: boolean
    deleteRecords: boolean
    manageTasks: boolean
    updateTaskProgress: boolean
    logDailyProgress: boolean
    approveDailyLogs: boolean
    manageMaterials: boolean
    recordAttendance: boolean
    manageEquipment: boolean
    uploadDocuments: boolean
    viewReports: boolean
    readOnly: boolean
  }
}

export const ROLES: Record<UserRole, RoleDefinition> = {
  admin_engineer: {
    role: 'admin_engineer',
    label: 'Admin / Engineer',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    typicalAccess:
      'Full access to all modules. Only role that can approve expenses and material requests, delete records, issue/award bids, manage users, and approve role requests.',
    allowedModuleIds: [
      'dashboard',
      'projects',
      'bidding',
      'tasks',
      'daily-logs',
      'materials',
      'attendance',
      'equipment',
      'expenses',
      'documents',
      'reports',
      'notifications',
      'users',
      'architecture',
      'screen-design',
    ],
    permissions: {
      manageUsers: true,
      approveRoleRequests: true,
      manageProjects: true,
      updateProjectProgress: true,
      prepareBids: true,
      submitContractorBid: false,
      approveAndAwardBids: true,
      viewBudgets: true,
      viewFinancialSummaries: true,
      createPendingExpenses: true,
      approveExpenses: true,
      approveMaterialRequests: true,
      deleteRecords: true,
      manageTasks: true,
      updateTaskProgress: true,
      logDailyProgress: true,
      approveDailyLogs: true,
      manageMaterials: true,
      recordAttendance: true,
      manageEquipment: true,
      uploadDocuments: true,
      viewReports: true,
      readOnly: false,
    },
  },
  assistant: {
    role: 'assistant',
    label: 'Assistant',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    typicalAccess:
      'Dashboard (assigned projects only), Projects (view/update), Tasks (update status/progress), Materials (encode stock in/out, create requests), Workers/Attendance (record), Expenses (create as pending only), Daily Logs (create/submit), Documents (upload/view assigned), Bidding (prepare drafts & documents only, no issuing/awarding), Reports (limited, no financial summaries). No user/role management.',
    allowedModuleIds: [
      'dashboard',
      'projects',
      'bidding',
      'tasks',
      'daily-logs',
      'materials',
      'attendance',
      'expenses',
      'documents',
      'reports',
    ],
    permissions: {
      manageUsers: false,
      approveRoleRequests: false,
      manageProjects: false,
      updateProjectProgress: true,
      prepareBids: true,
      submitContractorBid: false,
      approveAndAwardBids: false,
      viewBudgets: false,
      viewFinancialSummaries: false,
      createPendingExpenses: true,
      approveExpenses: false,
      approveMaterialRequests: false,
      deleteRecords: false,
      manageTasks: true,
      updateTaskProgress: true,
      logDailyProgress: true,
      approveDailyLogs: false,
      manageMaterials: true,
      recordAttendance: true,
      manageEquipment: false,
      uploadDocuments: true,
      viewReports: true,
      readOnly: false,
    },
  },
  contractor: {
    role: 'contractor',
    label: 'Contractor',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    typicalAccess:
      'Dashboard (own bids/projects), Bidding (view open bids, submit own bid, view own status), Projects (assigned only), Tasks (assigned), Daily Logs (own), Documents (assigned).',
    allowedModuleIds: [
      'dashboard',
      'bidding',
      'projects',
      'tasks',
      'daily-logs',
      'documents',
    ],
    permissions: {
      manageUsers: false,
      approveRoleRequests: false,
      manageProjects: false,
      updateProjectProgress: false,
      prepareBids: false,
      submitContractorBid: true,
      approveAndAwardBids: false,
      viewBudgets: false,
      viewFinancialSummaries: false,
      createPendingExpenses: false,
      approveExpenses: false,
      approveMaterialRequests: false,
      deleteRecords: false,
      manageTasks: false,
      updateTaskProgress: true,
      logDailyProgress: true,
      approveDailyLogs: false,
      manageMaterials: false,
      recordAttendance: false,
      manageEquipment: false,
      uploadDocuments: true,
      viewReports: false,
      readOnly: false,
    },
  },
  client: {
    role: 'client',
    label: 'Client',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    typicalAccess:
      'Read-only Dashboard, Project progress, Daily Logs (approved), Documents (shared), Reports (progress only).',
    allowedModuleIds: [
      'dashboard',
      'projects',
      'daily-logs',
      'documents',
      'reports',
    ],
    permissions: {
      manageUsers: false,
      approveRoleRequests: false,
      manageProjects: false,
      updateProjectProgress: false,
      prepareBids: false,
      submitContractorBid: false,
      approveAndAwardBids: false,
      viewBudgets: false,
      viewFinancialSummaries: false,
      createPendingExpenses: false,
      approveExpenses: false,
      approveMaterialRequests: false,
      deleteRecords: false,
      manageTasks: false,
      updateTaskProgress: false,
      logDailyProgress: false,
      approveDailyLogs: false,
      manageMaterials: false,
      recordAttendance: false,
      manageEquipment: false,
      uploadDocuments: false,
      viewReports: true,
      readOnly: true,
    },
  },
}

/**
 * Maps any legacy DB role string ('admin', 'engineer', 'foreman', 'worker', etc.)
 * to one of the 4 official project roles.
 */
export function normalizeRole(raw?: string | null): UserRole {
  if (!raw) return 'contractor'
  if (raw === 'admin_engineer' || raw === 'assistant' || raw === 'contractor' || raw === 'client') {
    return raw
  }
  if (raw === 'admin' || raw === 'engineer' || raw === 'project_manager') {
    return 'admin_engineer'
  }
  if (raw === 'foreman' || raw === 'worker') {
    return 'contractor'
  }
  return 'contractor'
}

export interface CoreModule {
  id: string
  name: string
  href: string
  icon: string
  description: string
  allowedRoles: UserRole[]
  phase: number
}

export const CORE_MODULES: CoreModule[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/',
    icon: '📊',
    description: 'Role-specific workspace overview, KPIs, and assigned project updates',
    allowedRoles: ['admin_engineer', 'assistant', 'contractor', 'client'],
    phase: 1,
  },
  {
    id: 'projects',
    name: 'Projects & Sites',
    href: '/projects',
    icon: '🏗️',
    description: 'Manage construction projects, assigned sites, timelines, and progress',
    allowedRoles: ['admin_engineer', 'assistant', 'contractor', 'client'],
    phase: 2,
  },
  {
    id: 'bidding',
    name: 'Bidding',
    href: '/bidding',
    icon: '🔨',
    description: 'RA 12009 bid drafts, contractor bid submissions, evaluation & contract awards',
    allowedRoles: ['admin_engineer', 'assistant', 'contractor'],
    phase: 2,
  },
  {
    id: 'tasks',
    name: 'Tasks & Progress',
    href: '/tasks',
    icon: '✅',
    description: 'Track assigned tasks, completion percentages, and due dates',
    allowedRoles: ['admin_engineer', 'assistant', 'contractor'],
    phase: 3,
  },
  {
    id: 'daily-logs',
    name: 'Daily Logs',
    href: '/daily-logs',
    icon: '📝',
    description: 'Record site weather, daily progress notes, photos, and log approvals',
    allowedRoles: ['admin_engineer', 'assistant', 'contractor', 'client'],
    phase: 2,
  },
  {
    id: 'materials',
    name: 'Materials & Inventory',
    href: '/materials',
    icon: '🧱',
    description: 'Encode stock in/out, submit material requests, and approve requisitions',
    allowedRoles: ['admin_engineer', 'assistant'],
    phase: 4,
  },
  {
    id: 'attendance',
    name: 'Workers & Attendance',
    href: '/attendance',
    icon: '👷',
    description: 'Record worker daily rates, hours worked, and site attendance',
    allowedRoles: ['admin_engineer', 'assistant'],
    phase: 5,
  },
  {
    id: 'equipment',
    name: 'Equipment',
    href: '/equipment',
    icon: '🚜',
    description: 'Track heavy machinery, tools, site assignment, and maintenance status',
    allowedRoles: ['admin_engineer'],
    phase: 5,
  },
  {
    id: 'expenses',
    name: 'Expenses & Budget',
    href: '/expenses',
    icon: '💰',
    description: 'Submit pending project expenses and manage Admin/Engineer expense approvals',
    allowedRoles: ['admin_engineer', 'assistant'],
    phase: 6,
  },
  {
    id: 'documents',
    name: 'Documents',
    href: '/documents',
    icon: '📁',
    description: 'Blueprints, contracts, permits, and shared project files',
    allowedRoles: ['admin_engineer', 'assistant', 'contractor', 'client'],
    phase: 7,
  },
  {
    id: 'reports',
    name: 'Reports',
    href: '/reports',
    icon: '📈',
    description: 'Project progress reports and Admin/Engineer financial summaries',
    allowedRoles: ['admin_engineer', 'assistant', 'client'],
    phase: 6,
  },
  {
    id: 'notifications',
    name: 'Email Notifications',
    href: '/notifications',
    icon: '✉️',
    description: 'System email alerts for tasks, low-stock warnings, and approvals',
    allowedRoles: ['admin_engineer'],
    phase: 7,
  },
  {
    id: 'users',
    name: 'Users & Roles',
    href: '/users',
    icon: '🛡️',
    description: 'Manage team accounts, assign the 4 system roles, and approve role requests',
    allowedRoles: ['admin_engineer'],
    phase: 1,
  },
  {
    id: 'architecture',
    name: 'Requirements & ERD',
    href: '/architecture',
    icon: '🗂️',
    description: 'User stories (Section 3) and 13-table Database Design & live status (Section 4)',
    allowedRoles: ['admin_engineer'],
    phase: 1,
  },
  {
    id: 'screen-design',
    name: 'Screens, Stack & Setup',
    href: '/screen-design',
    icon: '📱',
    description: 'Phone-first wireframes (Section 5), Tech Stack (Section 6) & Setup (Section 7)',
    allowedRoles: ['admin_engineer'],
    phase: 1,
  },
]

export function getModulesForRole(role: UserRole): CoreModule[] {
  return CORE_MODULES.filter((m) => m.allowedRoles.includes(role))
}

export function canRoleAccessPath(role: UserRole, pathname: string): boolean {
  if (pathname === '/') return true
  const matchedModule = CORE_MODULES.find(
    (m) => m.href !== '/' && (pathname === m.href || pathname.startsWith(`${m.href}/`))
  )
  if (!matchedModule) return true
  return matchedModule.allowedRoles.includes(role)
}
