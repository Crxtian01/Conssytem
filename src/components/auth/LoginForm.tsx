'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import GoogleSignInButton from './GoogleSignInButton'
import ProjectCooperationWidget from './ProjectCooperationWidget'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const verified = searchParams.get('verified')
  const coopApproved = searchParams.get('coop_approved')
  const coopEmail = searchParams.get('email') || ''
  const coopPw = searchParams.get('pw') || ''

  const [email, setEmail] = useState(coopEmail)
  const [password, setPassword] = useState(coopPw)
  const [role, setRole] = useState<'contractor' | 'client' | 'assistant' | 'admin_engineer'>('contractor')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState<string | null>(
    coopApproved === '1'
      ? `Request Approved by Engineer! Approval notice sent to ${coopEmail || 'your email'} and your Contractor account is active. Signing you into the Contractor Dashboard…`
      : null
  )
  const [error, setError] = useState<string | null>(
    urlError === 'auth_failed'
      ? 'Authentication failed or link expired. Please try signing in again.'
      : null
  )

  useEffect(() => {
    if (coopApproved === '1' && coopEmail && coopPw) {
      const supabase = createClient()
      supabase.auth
        .signInWithPassword({
          email: coopEmail.trim(),
          password: coopPw,
        })
        .then(({ error: err }) => {
          if (!err) {
            setTimeout(() => {
              router.push('/')
              router.refresh()
            }, 1200)
          }
        })
    }
  }, [coopApproved, coopEmail, coopPw, router])

  const roleOptions = [
    { value: 'contractor', label: 'Contractor / Bidder' },
    { value: 'client', label: 'Client / Project Owner' },
    { value: 'assistant', label: 'Engineering Assistant' },
    { value: 'admin_engineer', label: 'Admin / Lead Engineer' },
  ] as const

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address above first, then click Forgot password.')
      return
    }
    setError(null)
    setResetSent(null)
    const supabase = createClient()
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    })
    if (resetErr) {
      setError(resetErr.message)
      return
    }
    setResetSent(`Password reset link sent to ${email.trim()}! Check your inbox and click the link to set a new password.`)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      if (signInError.message.toLowerCase().includes('email not confirmed')) {
        router.push(`/verify?email=${encodeURIComponent(email.trim())}`)
        return
      }
      setError(signInError.message)
      setLoading(false)
      return
    }

    if (data.user && !data.user.email_confirmed_at) {
      router.push(`/verify?email=${encodeURIComponent(email.trim())}`)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {verified === '1' && (
        <div className="rounded-xl border border-emerald-300/70 bg-emerald-50/75 p-3.5 text-sm font-medium text-emerald-800 backdrop-blur-md">
          Email confirmed! You can now sign in.
        </div>
      )}

      {resetSent && (
        <div className="rounded-xl border border-emerald-300/70 bg-emerald-50/75 p-3.5 text-sm font-medium text-emerald-800 backdrop-blur-md">
          {resetSent}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-300/70 bg-red-50/75 p-3.5 text-sm font-medium text-red-700 backdrop-blur-md">
          {error}
        </div>
      )}

      <GoogleSignInButton />

      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-white/70" />
        <span className="mx-3 flex-shrink text-[11px] font-bold uppercase tracking-widest text-slate-400">
          or sign in with email
        </span>
        <div className="flex-grow border-t border-white/70" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 block w-full rounded-xl border border-white/80 bg-white/60 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm backdrop-blur-md focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div>
          <label htmlFor="loginRole" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Sign in role
          </label>
          <select
            id="loginRole"
            value={role}
            onChange={(e) =>
              setRole(e.target.value as 'contractor' | 'client' | 'assistant' | 'admin_engineer')
            }
            className="mt-1.5 block w-full rounded-xl border border-white/80 bg-white/75 px-3.5 py-2.5 text-sm font-semibold text-[#1e1512] shadow-sm backdrop-blur-md focus:border-[#c85a38] focus:outline-none"
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Password
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full rounded-xl border border-white/80 bg-white/60 px-3.5 py-2.5 pr-11 text-sm text-slate-900 shadow-sm backdrop-blur-md focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3.5 text-[#6e5a52] transition hover:text-[#1e1512]"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-[#cc5c3b] to-[#94361d] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#94361d]/25 transition hover:from-[#b54829] hover:to-[#7c2b15] disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm font-medium text-[#5c4942]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-bold text-[#c85a38] hover:underline">
          Create account
        </Link>
      </p>

      {/* Project Cooperation & Automatic Contractor Account Flow */}
      <ProjectCooperationWidget
        email={email}
        password={password}
        role={role}
      />
    </div>
  )
}
