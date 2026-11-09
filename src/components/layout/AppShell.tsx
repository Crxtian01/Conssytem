'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ScatteredMaterialsBackdrop from '@/components/layout/ScatteredMaterialsBackdrop'
import {
  ROLES,
  getModulesForRole,
  canRoleAccessPath,
  type CoreModule,
  type UserRole,
} from '@/lib/roles'

interface AppShellProps {
  user: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
    role: UserRole
    emailVerified: boolean
  }
  children: React.ReactNode
}

// Module-scoped scroll cache so the desktop sidebar keeps its exact scroll position across route changes
let persistedSidebarScrollTop = 0

function getGreetingByHour(): string {
  const hr = new Date().getHours()
  if (hr < 12) return 'Good morning'
  if (hr < 18) return 'Good afternoon'
  return 'Good evening'
}

function getFormattedTodayDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function ModuleVectorIcon({ id, active }: { id: string; active: boolean }) {
  const strokeColor = active ? '#22d3ee' : '#94a3b8'
  switch (id) {
    case 'dashboard':
      return (
        <svg className="h-4 w-4 shrink-0 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    case 'projects':
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    case 'bidding':
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3v4a1 1 0 0 0 1 1h4" />
          <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
          <path d="M9 15l2 2 4-4" />
        </svg>
      )
    case 'tasks':
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    case 'daily-logs':
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      )
    case 'materials':
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      )
    case 'attendance':
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'equipment':
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    case 'expenses':
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    case 'documents':
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )
    case 'reports':
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      )
    case 'notifications':
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
    default:
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 15" />
        </svg>
      )
  }
}

export default function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  const shellRef = useRef<HTMLDivElement | null>(null)
  const desktopSidebarRef = useRef<HTMLElement | null>(null)
  const mainScrollRef = useRef<HTMLElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [switchingRole, setSwitchingRole] = useState(false)
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [showRoleRequestBox, setShowRoleRequestBox] = useState(false)
  const [requestedRole, setRequestedRole] = useState<UserRole>('assistant')
  const [roleReqSent, setRoleReqSent] = useState<string | null>(null)
  const [showDemoPreview, setShowDemoPreview] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [displayFullName, setDisplayFullName] = useState<string>(user.fullName || '')
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState<string>(user.fullName || '')
  const [savingName, setSavingName] = useState(false)
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState(false)
  const [sidebarSearch, setSidebarSearch] = useState('')

  useEffect(() => {
    setDisplayFullName(user.fullName || '')
    setNameInput(user.fullName || '')
  }, [user.fullName])

  // Restore desktop sidebar scroll position on mount and keep it synced on scroll
  useEffect(() => {
    const sidebarEl = desktopSidebarRef.current
    if (!sidebarEl) return
    sidebarEl.scrollTop = persistedSidebarScrollTop

    function handleSidebarScroll() {
      if (sidebarEl) {
        persistedSidebarScrollTop = sidebarEl.scrollTop
      }
    }
    sidebarEl.addEventListener('scroll', handleSidebarScroll, { passive: true })
    return () => sidebarEl.removeEventListener('scroll', handleSidebarScroll)
  }, [])

  // On route change: reset main content scroll to top, close mobile drawer, and clear loading state
  useEffect(() => {
    setNavigatingTo(null)
    setMobileDrawerOpen(false)
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    }
  }, [pathname])

  // Keyboard shortcuts: Escape closes modals, Cmd/Ctrl+K focuses sidebar search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        if (mobileDrawerOpen) setMobileDrawerOpen(false)
        if (showProfileModal && !savingName) {
          setShowProfileModal(false)
          setIsEditingName(false)
        }
        if (showSignOutModal && !signingOut) setShowSignOutModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileDrawerOpen, showProfileModal, savingName, showSignOutModal, signingOut])

  // Mouse-following warm light refraction across the workspace
  useEffect(() => {
    const el = shellRef.current
    if (!el) return
    function onPointerMove(e: PointerEvent) {
      el!.style.setProperty('--lx', `${e.clientX}px`)
      el!.style.setProperty('--ly', `${e.clientY}px`)
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  const roleInfo = ROLES[user.role] ?? ROLES.contractor
  const allowedModules = getModulesForRole(user.role)
  const hasAccessToCurrentPath = canRoleAccessPath(user.role, pathname)
  const isTransitioning = Boolean(navigatingTo) || switchingRole

  const currentModule =
    allowedModules.find((m) =>
      m.href === '/' ? pathname === '/' : pathname.startsWith(m.href)
    ) ?? allowedModules[0]

  async function handleQuickRoleSwitch(newRole: UserRole) {
    setSwitchingRole(true)
    await fetch('/api/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, role: newRole }),
    })
    setSwitchingRole(false)
    router.refresh()
  }

  async function handleSubmitRoleRequest() {
    setSwitchingRole(true)
    setRoleReqSent(null)
    const res = await fetch('/api/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'request_role',
        requestedRole,
        reason: `Requested upgrade from ${roleInfo.label} to ${ROLES[requestedRole].label}`,
      }),
    })
    setSwitchingRole(false)
    if (res.ok) {
      setRoleReqSent(`Request for ${ROLES[requestedRole].label} sent to Admin/Engineer!`)
      setShowRoleRequestBox(false)
    }
  }

  async function handleSaveProfileName() {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setSavingName(true)
    setProfileFeedback(null)
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: trimmed }),
      })
      if (res.ok) {
        setDisplayFullName(trimmed)
        setIsEditingName(false)
        setProfileFeedback('Display name updated successfully!')
        router.refresh()
      } else {
        setProfileFeedback('Failed to update display name.')
      }
    } catch {
      setProfileFeedback('Failed to update display name.')
    } finally {
      setSavingName(false)
    }
  }

  function handleCopyUserId() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(user.id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  const effectiveName = displayFullName || user.fullName || user.email.split('@')[0]
  const initialLetter = effectiveName.charAt(0).toUpperCase()

  const permissionItems: Array<{ label: string; enabled: boolean }> = [
    { label: 'Manage Users & Roles', enabled: roleInfo.permissions.manageUsers },
    { label: 'Approve Expenses', enabled: roleInfo.permissions.approveExpenses },
    { label: 'Approve Material Requests', enabled: roleInfo.permissions.approveMaterialRequests },
    { label: 'Issue & Award RA 12009 Bids', enabled: roleInfo.permissions.approveAndAwardBids },
    { label: 'Delete Records', enabled: roleInfo.permissions.deleteRecords },
    { label: 'Prepare Bid Drafts', enabled: roleInfo.permissions.prepareBids },
    { label: 'Submit Contractor Bids', enabled: roleInfo.permissions.submitContractorBid },
    { label: 'Update Project Progress', enabled: roleInfo.permissions.updateProjectProgress },
    { label: 'Update Task Progress', enabled: roleInfo.permissions.updateTaskProgress },
    { label: 'Record Daily Logs', enabled: roleInfo.permissions.logDailyProgress },
    { label: 'Encode Materials & Stock', enabled: roleInfo.permissions.manageMaterials },
    { label: 'Record Worker Attendance', enabled: roleInfo.permissions.recordAttendance },
    { label: 'Create Pending Expenses', enabled: roleInfo.permissions.createPendingExpenses },
    { label: 'Upload Project Documents', enabled: roleInfo.permissions.uploadDocuments },
    { label: 'View Financial Summaries', enabled: roleInfo.permissions.viewFinancialSummaries },
  ]

  // Group allowed modules into Code XR style sections (MAIN, WORKSPACE, SYSTEM)
  const filteredModules = allowedModules.filter((m) =>
    sidebarSearch.trim()
      ? m.name.toLowerCase().includes(sidebarSearch.trim().toLowerCase()) ||
        m.description.toLowerCase().includes(sidebarSearch.trim().toLowerCase())
      : true
  )

  const mainSectionIds = ['dashboard', 'projects', 'bidding', 'tasks', 'daily-logs']
  const workspaceSectionIds = ['materials', 'attendance', 'equipment', 'expenses', 'documents', 'reports']

  const mainModules = filteredModules.filter((m) => mainSectionIds.includes(m.id))
  const workspaceModules = filteredModules.filter((m) => workspaceSectionIds.includes(m.id))
  const systemModules = filteredModules.filter(
    (m) => !mainSectionIds.includes(m.id) && !workspaceSectionIds.includes(m.id)
  )

  function renderNavGroup(title: string, mods: CoreModule[], isMobileDrawer: boolean) {
    if (mods.length === 0) return null
    return (
      <div className="space-y-1">
        <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400/70">
          {title}
        </p>
        {mods.map((mod) => {
          const active =
            mod.href === '/'
              ? pathname === '/' || pathname === '/admin-dashboard'
              : pathname.startsWith(mod.href)
          const isLoadingThis = navigatingTo === mod.name && !active
          const showBadge =
            mod.id === 'notifications' ||
            (mod.id === 'expenses' && user.role === 'admin_engineer')

          return (
            <Link
              key={mod.id}
              href={mod.href}
              onClick={() => {
                if (isMobileDrawer) {
                  setMobileDrawerOpen(false)
                }
                if (!active) {
                  setNavigatingTo(mod.name)
                }
              }}
              className={`group flex min-h-11 items-center justify-between rounded-2xl px-3.5 py-2.5 text-[13px] transition-all duration-200 ${
                active || isLoadingThis
                  ? 'neon-active-pill font-bold shadow-[0_0_18px_rgba(6,182,212,0.25)]'
                  : 'neon-inactive-pill font-medium'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                {isLoadingThis ? (
                  <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                ) : (
                  <ModuleVectorIcon id={mod.id} active={active || isLoadingThis} />
                )}
                <span className="truncate">{mod.name}</span>
              </span>

              {isLoadingThis ? (
                <span className="text-[10px] font-bold text-cyan-400">Opening…</span>
              ) : showBadge ? (
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold ${
                    active
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40'
                  }`}
                >
                  2
                </span>
              ) : null}
            </Link>
          )
        })}
      </div>
    )
  }

  function renderSidebarContents(isMobileDrawer: boolean) {
    return (
      <>
        {/* 1. Top Brand Header (Matching Asset Management Dashboard Cube) */}
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 p-2 shadow-[0_0_16px_rgba(6,182,212,0.4)] ring-1 ring-cyan-300/40">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-tight text-white">
                Asset Management
              </p>
              <p className="truncate text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                DASHBOARD
              </p>
            </div>
          </div>

          {isMobileDrawer && (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white hover:bg-white/20"
              aria-label="Close navigation drawer"
            >
              ✕
            </button>
          )}
        </div>

        {/* 2. Quick Search Pill ("Search navigation..." + ⌘K badge) */}
        <div className="shrink-0 px-4 pb-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 shadow-inner">
            <svg
              className="h-3.5 w-3.5 shrink-0 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={isMobileDrawer ? undefined : searchInputRef}
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search navigation..."
              className="w-full bg-transparent text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none"
            />
            {sidebarSearch ? (
              <button
                type="button"
                onClick={() => setSidebarSearch('')}
                className="text-[10px] font-bold text-slate-400 hover:text-white"
              >
                ✕
              </button>
            ) : (
              <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-400">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* 3. Categorized Role-Filtered Navigation Links (MAIN / WORKSPACE / SYSTEM) */}
        <nav className="flex-1 space-y-3 px-3 py-1" aria-label="Module navigation">
          {renderNavGroup('Main', mainModules, isMobileDrawer)}
          {renderNavGroup('Workspace', workspaceModules, isMobileDrawer)}
          {renderNavGroup('System', systemModules, isMobileDrawer)}

          {/* Role Upgrade / Switch Role Controls inside System area */}
          <div className="pt-2 px-1 space-y-2">
            {user.role !== 'admin_engineer' && (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setShowRoleRequestBox((v) => !v)}
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-left text-[11px] font-semibold text-amber-50 hover:bg-white/15 transition"
                >
                  {showRoleRequestBox ? 'Cancel Role Request' : '↑ Request Role Upgrade'}
                </button>

                {showRoleRequestBox && (
                  <div className="rounded-2xl border border-white/18 bg-black/25 p-3 space-y-2">
                    <p className="text-[10px] font-semibold text-amber-100/80">
                      Requires Admin / Engineer Approval:
                    </p>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value as UserRole)}
                      className="w-full rounded-lg border border-white/20 bg-white/90 px-2 py-1.5 text-xs font-semibold text-slate-900"
                    >
                      <option value="assistant">Assistant</option>
                      <option value="contractor">Contractor</option>
                      <option value="client">Client</option>
                      <option value="admin_engineer">Admin / Engineer</option>
                    </select>
                    <button
                      type="button"
                      disabled={switchingRole}
                      onClick={handleSubmitRoleRequest}
                      className="w-full rounded-lg bg-[#c85a38] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#b04628] disabled:opacity-50"
                    >
                      Submit Request
                    </button>
                  </div>
                )}

                {roleReqSent && (
                  <p className="rounded-lg bg-emerald-500/20 border border-emerald-300/30 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-100">
                    {roleReqSent}
                  </p>
                )}
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => setShowDemoPreview((v) => !v)}
                className="px-2 text-[11px] font-medium text-amber-100/65 hover:text-white underline"
              >
                {showDemoPreview ? 'Hide Role Switcher' : 'Switch Role (Preview 4 Roles)'}
              </button>
              {showDemoPreview && (
                <select
                  aria-label="Switch role dashboard"
                  value={user.role}
                  disabled={switchingRole}
                  onChange={(e) => handleQuickRoleSwitch(e.target.value as UserRole)}
                  className="mt-1.5 w-full rounded-xl border border-white/20 bg-white/90 px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none disabled:opacity-50"
                >
                  <option value="admin_engineer">Admin / Engineer (15 Modules)</option>
                  <option value="assistant">Assistant (10 Modules)</option>
                  <option value="contractor">Contractor (6 Modules)</option>
                  <option value="client">Client (5 Read-Only Modules)</option>
                </select>
              )}
            </div>
          </div>
        </nav>

        {/* 4. Bottom User Profile Card (Matches bottom-left of picture: Avatar + Name + Role + Email + ...) */}
        <div className="shrink-0 border-t border-white/[0.08] p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2 hover:border-cyan-400/30 hover:bg-white/[0.06] transition">
            <button
              type="button"
              onClick={() => {
                if (isMobileDrawer) setMobileDrawerOpen(false)
                setProfileFeedback(null)
                setShowProfileModal(true)
              }}
              className="group flex flex-1 items-center gap-2.5 text-left min-w-0"
              aria-label="Open my profile and account details"
            >
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-cyan-400/40 bg-slate-800">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-extrabold text-white">
                    {initialLetter}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0c0e16]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white group-hover:text-cyan-300 transition">
                  {effectiveName || 'Spencer'}
                </p>
                <p className="truncate text-[10px] font-semibold text-cyan-400">
                  {roleInfo.label.includes('Admin') ? 'Admin' : roleInfo.label}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {user.email || 'spencer@company.com'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isMobileDrawer) setMobileDrawerOpen(false)
                setShowSignOutModal(true)
              }}
              title="Account settings & Sign Out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              <span className="text-sm font-bold tracking-widest leading-none">•••</span>
            </button>
          </div>
        </div>
      </>
    )
  }

  const isDashboardHome = pathname === '/' || pathname === '/admin-dashboard'

  return (
    <div
      ref={shellRef}
      className="liquid-mesh-bg relative flex h-dvh w-full overflow-hidden text-slate-100 p-0 sm:p-4 md:p-5 lg:p-6"
    >
      {/* Warm Ambient Studio Lighting Behind the visionOS Frame */}
      <ScatteredMaterialsBackdrop />

      {/* Top animated progress bar when switching modules or roles */}
      {(isTransitioning || signingOut) && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/20 backdrop-blur-md overflow-hidden">
          <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-[#e06d48] via-amber-400 to-[#c85a38]" />
        </div>
      )}

      {/* Floating Window Container (with sleek gap between floating sidebar and canvas) */}
      <div className="relative z-10 flex h-full w-full gap-4 md:gap-5 overflow-hidden">
        {/* =====================================================================
            1. DESKTOP FLOATING SIDEBAR (matching picture)
           ===================================================================== */}
        <aside
          ref={desktopSidebarRef}
          aria-label="Sidebar navigation"
          className="liquid-glass-sidebar relative z-20 hidden w-64 shrink-0 flex-col overflow-y-auto rounded-3xl border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:flex"
        >
          {renderSidebarContents(false)}
        </aside>

        {/* =====================================================================
            2. MOBILE SLIDE-OUT DRAWER (< md, locks background scroll, closes on link/backdrop)
           ===================================================================== */}
        {mobileDrawerOpen && (
          <div
            className="fixed inset-0 z-50 flex md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation drawer"
          >
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
              aria-hidden="true"
            />
            <aside className="liquid-glass-sidebar relative z-10 flex h-dvh w-72 max-w-[85vw] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#090d18]/95 shadow-2xl backdrop-blur-2xl">
              {renderSidebarContents(true)}
            </aside>
          </div>
        )}

        {/* =====================================================================
            3. RIGHT SIDE: Floating Dark Frosted Glass Canvas
           ===================================================================== */}
        <div className="codexr-canvas-surface relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden rounded-none sm:rounded-3xl border-0 sm:border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
          {/* Top Header Bar (Shows on mobile or subpages) */}
          <header className={`codexr-header-surface shrink-0 px-4 py-3 md:px-7 ${isDashboardHome ? 'md:hidden' : ''}`}>
            <div className="flex items-center justify-between gap-3">
              {/* Left: Mobile Hamburger Button + Page Title */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-base font-bold text-white md:hidden"
                  aria-label="Open navigation menu"
                  aria-expanded={mobileDrawerOpen}
                >
                  ☰
                </button>

                <div className="min-w-0">
                  <h1 className="truncate text-base font-extrabold tracking-tight text-white sm:text-xl">
                    {currentModule?.name || 'Dashboard'}
                  </h1>
                  <p className="truncate text-xs font-medium text-slate-400">
                    {currentModule?.description || roleInfo.typicalAccess}
                  </p>
                </div>
              </div>

              {/* Right: Quick Role Switch Pill & Profile */}
              <div className="flex items-center gap-2.5 shrink-0">
                <select
                  aria-label="Quick switch role"
                  value={user.role}
                  disabled={switchingRole}
                  onChange={(e) => handleQuickRoleSwitch(e.target.value as UserRole)}
                  className="hidden min-h-9 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-cyan-300 focus:outline-none disabled:opacity-50 sm:block"
                >
                  <option value="admin_engineer">Role: Admin / Engineer</option>
                  <option value="assistant">Role: Assistant</option>
                  <option value="contractor">Role: Contractor</option>
                  <option value="client">Role: Client</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setProfileFeedback(null)
                    setShowProfileModal(true)
                  }}
                  className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 transition"
                  aria-label="Open my profile and account details"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-extrabold text-slate-950">
                    {initialLetter}
                  </span>
                  <span className="hidden sm:inline">My Profile</span>
                </button>
              </div>
            </div>
          </header>

          {/* Scrollable Main Content Container */}
          <main
            ref={mainScrollRef}
            className="liquid-workspace flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-5 md:p-7"
          >
            {isTransitioning && (
              <div className="liquid-glass-card mb-4 rounded-2xl px-4 py-2.5 text-xs font-bold text-[#1e1512] flex items-center gap-2.5">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#c85a38] border-t-transparent" />
                <span>
                  {switchingRole
                    ? 'Switching role & updating module permissions…'
                    : `Opening ${navigatingTo}…`}
                </span>
              </div>
            )}

            <div
              className={`min-w-0 transition-all duration-200 ${
                isTransitioning ? 'opacity-50 scale-[0.995] blur-[1px]' : 'opacity-100 scale-100'
              }`}
            >
              {hasAccessToCurrentPath ? (
                children
              ) : (
                <div className="liquid-glass-card mx-auto max-w-2xl rounded-3xl p-8 text-center space-y-4 mt-8">
                  <div className="liquid-droplet-pill mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl">
                    🔒
                  </div>
                  <h2 className="text-xl font-bold text-[#1e1512]">
                    Access Denied — Module Restricted for {roleInfo.label}
                  </h2>
                  <p className="text-sm text-[#5c4942]">
                    Your current role (<strong>{roleInfo.label}</strong>) does not have permission
                    to open{' '}
                    <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs font-mono text-red-700">
                      {pathname}
                    </code>
                    . You have access to <strong>{allowedModules.length} permitted modules</strong>:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {allowedModules.map((m) => (
                      <Link
                        key={m.id}
                        href={m.href}
                        className="liquid-droplet-pill inline-flex min-h-11 items-center rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1e1512] hover:bg-white/90"
                      >
                        <span>{m.name}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/"
                      className="codexr-dark-pill inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 text-xs font-semibold text-white"
                    >
                      ← Return to Dashboard
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Liquid Glass User Profile & Account Details Modal */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="User Profile and Account Details"
          onClick={() => {
            if (!savingName) {
              setShowProfileModal(false)
              setIsEditingName(false)
            }
          }}
        >
          <div
            className="liquid-glass-card flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500 text-base font-extrabold text-slate-950 shadow-md">
                  {initialLetter}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-extrabold text-white sm:text-lg">
                    My Profile &amp; Account Details
                  </h2>
                  <p className="truncate text-xs text-slate-400">
                    ConstructMS Identity, Assigned Role &amp; Permissions Matrix
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false)
                  setIsEditingName(false)
                }}
                className="liquid-droplet-pill inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-sm font-bold text-slate-200 hover:text-white hover:bg-white/10"
                aria-label="Close profile dialog"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {/* 1. Identity Card */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={effectiveName}
                        className="h-16 w-16 shrink-0 rounded-full border-2 border-cyan-400 object-cover shadow-md"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-cyan-400 bg-cyan-500/20 text-2xl font-extrabold text-cyan-300 shadow-md">
                        {initialLetter}
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      {!isEditingName ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-extrabold text-white">
                            {effectiveName}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setNameInput(
                                displayFullName || user.fullName || user.email.split('@')[0]
                              )
                              setIsEditingName(true)
                              setProfileFeedback(null)
                            }}
                            className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300 hover:bg-white/20"
                          >
                            Edit Name
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            placeholder="Enter your full name"
                            className="rounded-xl border border-cyan-400 bg-slate-900 px-3 py-1.5 text-sm font-bold text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={savingName}
                            onClick={handleSaveProfileName}
                            className="rounded-xl bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                          >
                            {savingName ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            disabled={savingName}
                            onClick={() => setIsEditingName(false)}
                            className="rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/20"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <p className="truncate text-xs font-semibold text-slate-400">
                        {user.email}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${roleInfo.badgeColor}`}
                        >
                          {roleInfo.label}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                            user.emailVerified
                              ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                              : 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {user.emailVerified ? '✓ Email Verified' : '● Verification Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {profileFeedback && (
                  <p className="mt-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-300">
                    {profileFeedback}
                  </p>
                )}

                {/* Account Metadata Grid */}
                <div className="mt-4 grid grid-cols-1 gap-2.5 border-t border-white/10 pt-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Account User ID
                    </p>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <code className="truncate font-mono text-xs font-semibold text-cyan-300">
                        {user.id}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyUserId}
                        className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-200 hover:bg-white/20"
                      >
                        {copiedId ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Permitted Workspace Access
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-white">
                      {allowedModules.length} of 15 System Modules Enabled
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Role Access Scope Description */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-2 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                    Assigned Role Scope ({roleInfo.label})
                  </h4>
                  {user.role === 'admin_engineer' ? (
                    <Link
                      href="/users"
                      onClick={() => setShowProfileModal(false)}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
                    >
                      Manage All Users &amp; Roles →
                    </Link>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">
                      Managed by Admin / Engineer
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  {roleInfo.typicalAccess}
                </p>
              </div>

              {/* 3. Role Capabilities & Permissions Matrix */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Role Capabilities &amp; Action Permissions
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {permissionItems.map((perm) => (
                    <div
                      key={perm.label}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${
                        perm.enabled
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-white font-semibold'
                          : 'border-white/10 bg-white/[0.02] text-slate-400'
                      }`}
                    >
                      <span className="truncate pr-2">{perm.label}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          perm.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {perm.enabled ? '✓ Allowed' : 'Restricted'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Quick Links to Permitted Modules */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Your Allowed Modules ({allowedModules.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {allowedModules.map((mod) => (
                    <Link
                      key={mod.id}
                      href={mod.href}
                      onClick={() => setShowProfileModal(false)}
                      className="rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 text-xs font-bold text-white transition"
                    >
                      <span>{mod.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false)
                  setShowSignOutModal(true)
                }}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/20 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/30"
              >
                <span>Sign Out</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false)
                  setIsEditingName(false)
                }}
                className="codexr-dark-pill inline-flex min-h-10 items-center justify-center rounded-full px-6 py-2 text-xs font-bold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
          onClick={() => {
            if (!signingOut) setShowSignOutModal(false)
          }}
        >
          <div
            className="liquid-glass-card w-full max-w-md rounded-3xl p-6 space-y-5 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-extrabold text-white">
                  Sign out of ConstructMS?
                </h2>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Are you sure you want to log out of your account? You can sign back in anytime
                  using Google or your email and password.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm font-extrabold text-slate-950">
                  {initialLetter}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white">
                    {effectiveName}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">{user.email}</p>
                </div>
              </div>
              <span
                className={`ml-2 shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${roleInfo.badgeColor}`}
              >
                {roleInfo.label}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={signingOut}
                onClick={() => setShowSignOutModal(false)}
                className="min-h-11 rounded-full border border-white/10 bg-white/[0.05] hover:bg-white/10 px-4 py-2 text-xs font-bold text-slate-200 disabled:opacity-50 transition"
              >
                Stay Signed In
              </button>

              <form
                action="/auth/signout"
                method="post"
                onSubmit={() => setSigningOut(true)}
              >
                <button
                  type="submit"
                  disabled={signingOut}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-60 transition"
                >
                  {signingOut ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Signing out…</span>
                    </>
                  ) : (
                    <span>Yes, Sign Out</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
