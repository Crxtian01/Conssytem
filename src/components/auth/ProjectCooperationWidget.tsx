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
}: ProjectCooperationWidgetProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [customName, setCustomName] = useState(fullName)
  const [customEmail, setCustomEmail] = useState(email)
  const [customPassword, setCustomPassword] = useState(password)
  const [projectName, setProjectName] = useState('Metro Commercial Tower Phase 1')
  const [submitting, setSubmitting] = useState(false)
  const [approving, setApproving] = useState(false)
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
    <div className="rounded-2xl border border-white/80 bg-white/60 p-4 text-left shadow-sm backdrop-blur-md space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-[#1e1512]">
            Want to join or connect to a project?
          </p>
          <p className="mt-0.5 text-[11px] text-[#5c4942]">
            Send a cooperation request to the Admin / Lead Engineer. The email includes a direct <strong>Approve Link</strong>—once the Engineer clicks Approve, your Contractor account is automatically created, an approval notice is sent, and you go straight to the Contractor Dashboard.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300/80 bg-red-50/90 p-2.5 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {approvalNotice && (
        <div className="rounded-xl border border-emerald-400/90 bg-emerald-50/95 p-3 text-xs text-emerald-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-extrabold uppercase tracking-wider text-emerald-800">
              Request Approved by Engineer
            </span>
            <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
              Email Sent
            </span>
          </div>
          <p className="font-medium leading-relaxed">{approvalNotice}</p>
        </div>
      )}

      {!activeReq && (
        <div className="space-y-2.5">
          {expanded && (
            <div className="space-y-2 rounded-xl border border-white/75 bg-white/50 p-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5c4942]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="mt-1 block w-full rounded-lg border border-white/80 bg-white/80 px-2.5 py-1.5 text-xs text-[#1e1512]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5c4942]">
                  Email Address (for Approval Notice &amp; Auto-Account)
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="contractor@example.com"
                  className="mt-1 block w-full rounded-lg border border-white/80 bg-white/80 px-2.5 py-1.5 text-xs text-[#1e1512]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5c4942]">
                  Password for Your Automatic Account
                </label>
                <input
                  type="password"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="mt-1 block w-full rounded-lg border border-white/80 bg-white/80 px-2.5 py-1.5 text-xs text-[#1e1512]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5c4942]">
                  Project to Join
                </label>
                <select
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-white/80 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-[#1e1512]"
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
            {!expanded ? (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="w-full rounded-xl border border-[#c85a38]/40 bg-[#c85a38]/12 px-3 py-2 text-xs font-bold text-[#94361d] transition hover:bg-[#c85a38]/20"
              >
                Request Project Cooperation from Admin / Engineer
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitCooperationRequest(false)}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#cc5c3b] to-[#94361d] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:from-[#b54829] hover:to-[#7c2b15] disabled:opacity-60"
                >
                  {submitting ? 'Sending Request…' : 'Send Request to Engineer'}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitCooperationRequest(true)}
                  className="rounded-xl border border-white/80 bg-white/75 px-3 py-2 text-xs font-semibold text-[#5c4942] transition hover:bg-white"
                >
                  Open Email App (with Approve Link)
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {activeReq && activeReq.status === 'pending' && (
        <div className="rounded-xl border border-amber-300/80 bg-amber-50/85 p-3 text-xs text-amber-950 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900">
              Email Request Sent to Lead Engineer
            </span>
            <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
              Pending Approval
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-900/90">
            Sent to <strong>lacuatachristian01@gmail.com</strong> for project{' '}
            <strong>{activeReq.project_name}</strong> ({activeReq.email}). Click the <strong>Approve Link</strong> inside the email (or click below) to accept:
          </p>
          <div className="flex flex-col gap-1.5 pt-1 border-t border-amber-200/70">
            <button
              type="button"
              disabled={approving}
              onClick={handleEngineerAcceptRequest}
              className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {approving
                ? 'Approving & Creating Contractor Account…'
                : 'Engineer: Accept Request & Auto-Create Contractor Account'}
            </button>
            <a
              href={buildMailtoHref(activeReq.id)}
              className="w-full rounded-xl border border-amber-300 bg-white/80 px-3 py-1.5 text-center text-[11px] font-semibold text-amber-900 hover:bg-white"
            >
              Open Email in Gmail with Clickable Approve Link
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
