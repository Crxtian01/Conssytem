export type UserRole = 'admin_engineer' | 'assistant' | 'contractor' | 'client'

export interface RoleDefinition {
  role: UserRole
  label: string
  badgeColor: string
  typicalAccess: string
  allowedModuleIds: string[]
  permissions: {
    manageUsers: boolean
    manageProjects: boolean
    viewBudgets: boolean
    approveExpenses: boolean
    manageTasks: boolean
    logDailyProgress: boolean
    manageMaterials: boolean
    recordAttendance: boolean
    manageEquipment: boolean
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
      'Full access to all modules: Projects, Budgets, Approvals, Engineering Tasks, Inventory, Attendance, Equipment, Reports, and User Role Management',
    allowedModuleIds: [
      'dashboard',
      'projects',
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
      manageProjects: true,
      viewBudgets: true,
      approveExpenses: true,
      manageTasks: true,
      logDailyProgress: true,
      manageMaterials: true,
      recordAttendance: true,
      manageEquipment: true,
      viewReports: true,
      readOnly: false,
    },
  },
  assistant: {
    role: 'assistant',
    label: 'Assistant',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    typicalAccess:
      'Can access all modules across the system to assist Admin/Engineer with projects, logs, inventory, attendance, expenses, documents, and reports',
    allowedModuleIds: [
      'dashboard',
      'projects',
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
      manageUsers: false,
      manageProjects: true,
      viewBudgets: true,
      approveExpenses: false,
      manageTasks: true,
      logDailyProgress: true,
      manageMaterials: true,
      recordAttendance: true,
      manageEquipment: true,
      viewReports: true,
      readOnly: false,
    },
  },
  contractor: {
    role: 'contractor',
    label: 'Contractor',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    typicalAccess:
      'Limited strictly to field & site operations: Tasks & Progress, Daily Logs, Materials & Inventory, Workers & Attendance, and Equipment (No Budgets/Expenses or Admin modules)',
    allowedModuleIds: [
      'dashboard',
      'tasks',
      'daily-logs',
      'materials',
      'attendance',
      'equipment',
    ],
    permissions: {
      manageUsers: false,
      manageProjects: false,
      viewBudgets: false,
      approveExpenses: false,
      manageTasks: true,
      logDailyProgress: true,
      manageMaterials: true,
      recordAttendance: true,
      manageEquipment: true,
      viewReports: false,
      readOnly: false,
    },
  },
  client: {
    role: 'client',
    label: 'Client',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    typicalAccess:
      'Limited strictly to read-only project monitoring: Dashboard, Projects & Sites, Daily Logs, Project Documents, and Progress Reports',
    allowedModuleIds: [
      'dashboard',
      'projects',
      'daily-logs',
      'documents',
      'reports',
    ],
    permissions: {
      manageUsers: false,
      manageProjects: false,
      viewBudgets: true,
      approveExpenses: false,
      manageTasks: false,
      logDailyProgress: false,
      manageMaterials: false,
      recordAttendance: false,
      manageEquipment: false,
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
    description: 'Overview of project progress, alerts, and role summary',
    allowedRoles: ['admin_engineer', 'assistant', 'contractor', 'client'],
    phase: 1,
  },
  {
    id: 'projects',
    name: 'Projects & Sites',
    href: '/projects',
    icon: '🏗️',
    description: 'Manage construction projects, locations, timelines, and members',
    allowedRoles: ['admin_engineer', 'assistant', 'client'],
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
    description: 'Record site weather, daily progress notes, and site photos',
    allowedRoles: ['admin_engineer', 'assistant', 'contractor', 'client'],
    phase: 2,
  },
  {
    id: 'materials',
    name: 'Materials & Inventory',
    href: '/materials',
    icon: '🧱',
    description: 'Monitor stock in/out, reorder levels, and low-stock warnings',
    allowedRoles: ['admin_engineer', 'assistant', 'contractor'],
    phase: 4,
  },
  {
    id: 'attendance',
    name: 'Workers & Attendance',
    href: '/attendance',
    icon: '👷',
    description: 'Log worker daily rates, hours worked, and site attendance',
    allowedRoles: ['admin_engineer', 'assistant', 'contractor'],
    phase: 5,
  },
  {
    id: 'equipment',
    name: 'Equipment',
    href: '/equipment',
    icon: '🚜',
    description: 'Track heavy machinery, tools, site assignment, and status',
    allowedRoles: ['admin_engineer', 'assistant', 'contractor'],
    phase: 5,
  },
  {
    id: 'expenses',
    name: 'Expenses & Budget',
    href: '/expenses',
    icon: '💰',
    description: 'Monitor project expenses against budget and approvals',
    allowedRoles: ['admin_engineer', 'assistant'],
    phase: 6,
  },
  {
    id: 'documents',
    name: 'Documents',
    href: '/documents',
    icon: '📁',
    description: 'Blueprints, contracts, permits, and files linked to projects',
    allowedRoles: ['admin_engineer', 'assistant', 'client'],
    phase: 7,
  },
  {
    id: 'reports',
    name: 'Reports',
    href: '/reports',
    icon: '📈',
    description: 'Weekly progress reports, budget vs actual, and PDF/Excel export',
    allowedRoles: ['admin_engineer', 'assistant', 'client'],
    phase: 6,
  },
  {
    id: 'notifications',
    name: 'Email Notifications',
    href: '/notifications',
    icon: '✉️',
    description: 'Welcome, password reset, task notices, low-stock alerts, approvals & weekly reports',
    allowedRoles: ['admin_engineer', 'assistant'],
    phase: 7,
  },
  {
    id: 'users',
    name: 'Users & Roles',
    href: '/users',
    icon: '🛡️',
    description: 'Manage team accounts and assign the 4 system roles',
    allowedRoles: ['admin_engineer', 'assistant'],
    phase: 1,
  },
  {
    id: 'architecture',
    name: 'Requirements & ERD',
    href: '/architecture',
    icon: '🗂️',
    description: 'User stories (Section 3) and 13-table Database Design & live status (Section 4)',
    allowedRoles: ['admin_engineer', 'assistant'],
    phase: 1,
  },
  {
    id: 'screen-design',
    name: 'Screens, Stack & Setup',
    href: '/screen-design',
    icon: '📱',
    description: 'Phone-first wireframes (Section 5), Tech Stack (Section 6) & Setup (Section 7)',
    allowedRoles: ['admin_engineer', 'assistant'],
    phase: 1,
  },
]

export function getModulesForRole(role: UserRole): CoreModule[] {
  return CORE_MODULES.filter((m) => m.allowedRoles.includes(role))
}

export function canRoleAccessPath(role: UserRole, pathname: string): boolean {
  if (pathname === '/' || pathname === '/users') return true
  const matchedModule = CORE_MODULES.find(
    (m) => m.href !== '/' && pathname.startsWith(m.href)
  )
  if (!matchedModule) return true
  return matchedModule.allowedRoles.includes(role)
}
