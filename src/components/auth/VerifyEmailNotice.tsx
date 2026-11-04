'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function VerifyEmailNotice() {
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(initialEmail)
  const [cooldown, setCooldown] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function handleResend() {
    if (!email.trim() || cooldown > 0) return
    setSending(true)
    setError(null)
    setStatus(null)

    const supabase = createClient()
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    setSending(false)
    if (resendError) {
      setError(resendError.message)
      return
    }

    setStatus('A fresh confirmation link has been sent to your email.')
    setCooldown(60) // 60-second rate limit per Section 10 of guide
  }

  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
        ✉️
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <p>
          We sent a confirmation link to{' '}
          <span className="font-semibold text-gray-900">{email || 'your email address'}</span>.
        </p>
        <p>
          Please click the <strong>Confirm my email</strong> link inside that email before accessing
          the dashboard.
        </p>
      </div>

      {status && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {status}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!initialEmail && (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email to resend"
          className="block w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900"
        />
      )}

      <button
        type="button"
        onClick={handleResend}
        disabled={sending || cooldown > 0 || !email.trim()}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
      >
        {sending
          ? 'Sending…'
          : cooldown > 0
            ? `Resend confirmation email (${cooldown}s)`
            : 'Resend confirmation email'}
      </button>

      <div className="pt-2 text-sm">
        <Link href="/login" className="font-medium text-amber-600 hover:text-amber-700">
          ← Back to Sign In
        </Link>
      </div>
    </div>
  )
}

