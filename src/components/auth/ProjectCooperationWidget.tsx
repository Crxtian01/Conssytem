'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { ROLES, type UserRole } from '@/lib/roles'

interface ProjectCooperationWidgetProps {
  email: string
  password: string
  fullName?: string
  role: UserRole
  defaultExpanded?: boolean
  hideHeaderToggle?: boolean
}

interface CooperationReqState {
  id: string
  full_name: string
  email: string
  password?: string
  project_name: string
  status: 'pending' | 'approved' | 'rejected'
  approval_email_sent?: boolean
  approved_by_email?: string
}

export default function ProjectCooperationWidget({
  email,
  password,
  fullName = '',
  role,
  defaultExpanded = false,
  hideHeaderToggle = false,
}: ProjectCooperationWidgetProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [customName, setCustomName] = useState(fullName)
  const [customEmail, setCustomEmail] = useState(email)
  const [customPassword, setCustomPassword] = useState(password)
  const [projectName, setProjectName] = useState('Metro Commercial Tower Phase 1')
  const [submitting, setSubmitting] = useState(false)
  const [approving, setApproving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeReq, setActiveReq] = useState<CooperationReqState | null>(null)
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null)

  useEffect(() => {
    if (email) setCustomEmail(email)
  }, [email])

  useEffect(() => {
    if (password) setCustomPassword(password)
  }, [password])

  useEffect(() => {
    if (fullName) setCustomName(fullName)
  }, [fullName])

  // Poll for Engineer approval when a request is pending (including when Engineer clicks the link inside Gmail!)
  useEffect(() => {
    if (!activeReq || activeReq.status !== 'pending') return

    const timer = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/cooperation?id=${encodeURIComponent(activeReq.id)}&email=${encodeURIComponent(activeReq.email)}`
        )
        if (!res.ok) return
        const data = await res.json()
        if (data.request && data.request.status === 'approved') {
          setActiveReq(data.request)
          await handleAutoSignInAndRedirect(
            data.request.email,
            data.request.password || customPassword || 'Contractor123'
          )
        } else if (data.request && data.request.status === 'rejected') {
          setActiveReq(data.request)
        }
      } catch {
        // Ignore transient poll errors
      }
    }, 2500)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReq])

  function buildApprovalUrl(reqId: string, targetEmail: string, targetName: string, targetPass: string) {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return `${origin}/api/cooperation/approve?id=${encodeURIComponent(
      reqId
    )}&email=${encodeURIComponent(targetEmail)}&name=${encodeURIComponent(
      targetName
    )}&project=${encodeURIComponent(projectName)}&role=${encodeURIComponent(
      role
    )}&pw=${encodeURIComponent(targetPass)}`
  }

  function buildMailtoHref(reqId: string) {
    const finalEmail = (customEmail || email || 'contractor@example.com').trim()
    const finalName = (customName || fullName || finalEmail.split('@')[0] || 'Contractor').trim()
    const finalPass = (customPassword || password || 'Contractor123').trim()
    const approvalUrl = buildApprovalUrl(reqId, finalEmail, finalName, finalPass)
    const roleLabel = ROLES[role]?.label ?? 'Contractor / Bidder'

    const subject = `ConstructMS Project Cooperation Request — ${projectName}`
    const body = [
      'Hello Admin / Lead Engineer,',
      '',
      `I would like to join and collaborate on ${projectName} as ${roleLabel}.`,
      '',
      `Full Name: ${finalName}`,
      `Email: ${finalEmail}`,
      `Chosen Role: ${roleLabel}`,
      `Chosen Project: ${projectName}`,
      '',
      '------------------------------------------------------------',
      'ADMIN / ENGINEER — CLICK THIS LINK TO APPROVE & AUTO-CREATE ACCOUNT:',
      approvalUrl,
      '------------------------------------------------------------',
      '',
      'Thank you!',
    ].join('\n')

    return `mailto:lacuatachristian01@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
  }

  async function handleAutoSignInAndRedirect(targetEmail: string, targetPass: string) {
    setApprovalNotice(
      `Approval email sent to ${targetEmail}! Your Contractor account has been automatically created. Redirecting to the Contractor Dashboard…`
    )
    const supabase = createClient()
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: targetEmail.trim(),
      password: targetPass,
    })

    if (!signInErr) {
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 1800)
    } else {
      setError(`Account created! Please sign in above (${signInErr.message}).`)
    }
  }

  async function handleSubmitCooperationRequest(openMailClient = false) {
    setError(null)
    const finalEmail = (customEmail || email).trim()
    const finalPassword = (customPassword || password).trim() || 'Contractor123'
    const finalName =
      (customName || fullName).trim() || finalEmail.split('@')[0] || 'Project Contractor'

    if (!finalEmail) {
      setError('Please enter your email address first so the Engineer can approve your account.')
      setExpanded(true)
      return
    }

    if (finalPassword.length < 6) {
      setError('Please enter a password (at least 6 characters) for your automatic Contractor account.')
      setExpanded(true)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/cooperation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_request',
          email: finalEmail,
          password: finalPassword,
          fullName: finalName,
          role,
          projectName,
          message: `Requesting cooperation to join ${projectName} as Contractor.`,
        }),
      })
      const data = await res.json()
      setSubmitting(false)

      if (!res.ok) {
        setError(data.error || 'Failed to submit cooperation request.')
        return
      }

      setActiveReq(data.request)

      if (openMailClient && typeof window !== 'undefined') {
        window.location.href = buildMailtoHref(data.request.id)
      }
    } catch {
      setSubmitting(false)
      setError('Network error while sending cooperation request.')
    }
  }

  async function handleEngineerAcceptRequest() {
    if (!activeReq) return
    setApproving(true)
    setError(null)
    try {
      const res = await fetch('/api/cooperation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_request',
          requestId: activeReq.id,
        }),
      })
      const data = await res.json()
      setApproving(false)

      if (!res.ok) {
        setError(data.error || 'Failed to approve request.')
        return
      }

      setActiveReq(data.request)
      await handleAutoSignInAndRedirect(
        data.request.email,
        data.request.password || customPassword || password || 'Contractor123'
      )
    } catch {
      setApproving(false)
      setError('Failed to process Engineer approval.')
    }
  }

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-[#0c1220]/95 p-5 text-left shadow-2xl backdrop-blur-2xl space-y-4 text-white">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 text-base border border-cyan-400/30">
          🤝
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-extrabold text-white sm:text-base">
            Want to join or connect to a project?
          </h3>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">
            Send a cooperation request to the Admin / Lead Engineer. The email includes a direct <strong className="text-cyan-300">Approve Link</strong>—once the Engineer clicks Approve, your Contractor account is automatically created, an approval notice is sent, and you go straight to the Contractor Dashboard.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/50 p-3 text-xs font-semibold text-red-300">
          ⚠️ {error}
        </div>
      )}

      {approvalNotice && (
        <div className="rounded-xl border border-emerald-400/80 bg-emerald-950/60 p-3.5 text-xs text-emerald-200 shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-extrabold uppercase tracking-wider text-emerald-300">
              Request Approved by Engineer
            </span>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              Email Sent
            </span>
          </div>
          <p className="font-medium leading-relaxed">{approvalNotice}</p>
        </div>
      )}

      {!activeReq && (
        <div className="space-y-3">
          {(expanded || hideHeaderToggle) && (
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Christian Lacuata"
                  className="mt-1 block w-full rounded-xl border border-white/20 bg-[#070b14] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                  Email Address (e.g. example@gmail.com)
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="mt-1 block w-full rounded-xl border border-white/20 bg-[#070b14] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                  Password for Your Automatic Account
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="block w-full rounded-xl border border-white/20 bg-[#070b14] px-3.5 py-2 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 transition hover:text-white"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                  Project to Join
                </label>
                <select
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-white/20 bg-[#070b14] px-3.5 py-2 text-sm font-semibold text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Metro Commercial Tower Phase 1">
                    Metro Commercial Tower Phase 1
                  </option>
                  <option value="Riverside Warehouse & Logistics Hub">
                    Riverside Warehouse &amp; Logistics Hub
                  </option>
                  <option value="Greenview Residential Townhomes">
                    Greenview Residential Townhomes
                  </option>
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {!expanded && !hideHeaderToggle ? (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="w-full rounded-xl bg-cyan-400 hover:bg-cyan-300 px-4 py-3 text-xs font-black text-slate-950 shadow-md shadow-cyan-500/20 transition"
              >
                Request Project Cooperation from Admin / Engineer →
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitCooperationRequest(false)}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 px-4 py-3 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/25 transition disabled:opacity-60"
                >
                  {submitting ? 'Sending Request…' : 'Send Request to Engineer'}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitCooperationRequest(true)}
                  className="rounded-xl border border-white/20 bg-white/[0.08] hover:bg-white/[0.15] px-4 py-3 text-xs font-bold text-white transition"
                >
                  Open in Gmail
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {activeReq && activeReq.status === 'pending' && (
        <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/60 p-4 text-xs text-white space-y-3 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-cyan-300 text-sm">
              Email Request Sent to Lead Engineer
            </span>
            <span className="rounded-full bg-cyan-500/20 border border-cyan-400/40 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
              Pending Approval
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-200">
            Sent to <strong className="text-white">lacuatachristian01@gmail.com</strong> for project{' '}
            <strong className="text-white">{activeReq.project_name}</strong> ({activeReq.email}). Click the <strong className="text-cyan-300">Approve Link</strong> inside the email (or click below) to accept:
          </p>
          <div className="flex flex-col gap-2 pt-1 border-t border-white/10">
            <button
              type="button"
              disabled={approving}
              onClick={handleEngineerAcceptRequest}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition disabled:opacity-60"
            >
              {approving
                ? 'Approving & Creating Contractor Account…'
                : 'Engineer: Accept Request & Auto-Create Contractor Account'}
            </button>
            <a
              href={buildMailtoHref(activeReq.id)}
              className="w-full rounded-xl border border-cyan-500/40 bg-white/[0.06] hover:bg-white/[0.12] px-4 py-2 text-center text-xs font-bold text-cyan-300 transition"
            >
              Open Email in Gmail with Clickable Approve Link
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
