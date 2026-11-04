export type UserRole =
  | 'admin'
  | 'project_manager'
  | 'engineer'
  | 'foreman'
  | 'worker'
  | 'client'

export interface RoleDefinition {
  role: UserRole
  label: string
  badgeColor: string
  typicalAccess: string
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
  admin: {
    role: 'admin',
    label: 'Admin',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    typicalAccess: 'Everything, including user and role management',
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
  project_manager: {
    role: 'project_manager',
    label: 'Project Manager',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    typicalAccess: 'Projects, budgets, approvals, reports',
    permissions: {
      manageUsers: false,
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
  engineer: {
    role: 'engineer',
    label: 'Engineer',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    typicalAccess: 'Tasks, daily logs, materials, attendance',
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
      viewReports: true,
      readOnly: false,
    },
  },
  foreman: {
    role: 'foreman',
    label: 'Foreman',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    typicalAccess: 'Tasks, daily logs, materials, attendance',
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
  worker: {
    role: 'worker',
    label: 'Worker',
    badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
    typicalAccess: 'Own attendance and assigned tasks',
    permissions: {
      manageUsers: false,
      manageProjects: false,
      viewBudgets: false,
      approveExpenses: false,
      manageTasks: false,
      logDailyProgress: false,
      manageMaterials: false,
      recordAttendance: false,
      manageEquipment: false,
      viewReports: false,
      readOnly: false,
    },
  },
  client: {
    role: 'client',
    label: 'Client',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    typicalAccess: 'Read-only progress and reports',
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
    allowedRoles: ['admin', 'project_manager', 'engineer', 'foreman', 'worker', 'client'],
    phase: 1,
  },
  {
    id: 'projects',
    name: 'Projects & Sites',
    href: '/projects',
    icon: '🏗️',
    description: 'Manage construction projects, locations, timelines, and members',
    allowedRoles: ['admin', 'project_manager', 'engineer', 'foreman', 'client'],
    phase: 2,
  },
  {
    id: 'tasks',
    name: 'Tasks & Progress',
    href: '/tasks',
    icon: '✅',
    description: 'Track assigned tasks, completion percentages, and due dates',
    allowedRoles: ['admin', 'project_manager', 'engineer', 'foreman', 'worker', 'client'],
    phase: 3,
  },
  {
    id: 'daily-logs',
    name: 'Daily Logs',
    href: '/daily-logs',
    icon: '📝',
    description: 'Record site weather, daily progress notes, and site photos',
    allowedRoles: ['admin', 'project_manager', 'engineer', 'foreman', 'client'],
    phase: 2,
  },
  {
    id: 'materials',
    name: 'Materials & Inventory',
    href: '/materials',
    icon: '🧱',
    description: 'Monitor stock in/out, reorder levels, and low-stock warnings',
    allowedRoles: ['admin', 'project_manager', 'engineer', 'foreman'],
    phase: 4,
  },
  {
    id: 'attendance',
    name: 'Workers & Attendance',
    href: '/attendance',
    icon: '👷',
    description: 'Log worker daily rates, hours worked, and own attendance',
    allowedRoles: ['admin', 'project_manager', 'engineer', 'foreman', 'worker'],
    phase: 5,
  },
  {
    id: 'equipment',
    name: 'Equipment',
    href: '/equipment',
    icon: '🚜',
    description: 'Track heavy machinery, tools, site assignment, and status',
    allowedRoles: ['admin', 'project_manager', 'engineer', 'foreman'],
    phase: 5,
  },
  {
    id: 'expenses',
    name: 'Expenses & Budget',
    href: '/expenses',
    icon: '💰',
    description: 'Monitor project expenses against budget and manager approvals',
    allowedRoles: ['admin', 'project_manager', 'client'],
    phase: 6,
  },
  {
    id: 'documents',
    name: 'Documents',
    href: '/documents',
    icon: '📁',
    description: 'Blueprints, contracts, permits, and files linked to projects',
    allowedRoles: ['admin', 'project_manager', 'engineer', 'client'],
    phase: 7,
  },
  {
    id: 'reports',
    name: 'Reports',
    href: '/reports',
    icon: '📈',
    description: 'Weekly progress reports, budget vs actual, and PDF/Excel export',
    allowedRoles: ['admin', 'project_manager', 'engineer', 'client'],
    phase: 6,
  },
  {
    id: 'users',
    name: 'Users & Roles',
    href: '/users',
    icon: '🛡️',
    description: 'Manage team accounts and assign role permissions',
    allowedRoles: ['admin', 'project_manager', 'engineer', 'foreman', 'worker', 'client'],
    phase: 1,
  },
  {
    id: 'architecture',
    name: 'Requirements & ERD',
    href: '/architecture',
    icon: '🗂️',
    description: 'User stories (Section 3) and 13-table Database Design & live status (Section 4)',
    allowedRoles: ['admin', 'project_manager', 'engineer', 'foreman', 'worker', 'client'],
    phase: 1,
  },
]

export function getModulesForRole(role: UserRole): CoreModule[] {
  return CORE_MODULES.filter((m) => m.allowedRoles.includes(role))
}

