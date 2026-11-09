'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import GoogleSignInButton from './GoogleSignInButton'
import ProjectCooperationWidget from './ProjectCooperationWidget'

export default function RegisterForm() {
  const router = useRouter()
  const [registerMode, setRegisterMode] = useState<'create_account' | 'join_project'>('create_account')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'contractor' | 'client' | 'assistant' | 'admin_engineer'>('contractor')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roleOptions = [
    { value: 'contractor', label: 'Contractor / Bidder', desc: 'Submit bids & manage site works' },
    { value: 'client', label: 'Client / Project Owner', desc: 'Track project progress & budgets' },
    { value: 'assistant', label: 'Engineering Assistant', desc: 'Assist in site logs & BOQ review' },
    { value: 'admin_engineer', label: 'Admin / Lead Engineer', desc: 'Full project & bidding control' },
  ] as const

  // Compact 3-point password checks
  const passwordChecks = [
    {
      id: 'length',
      label: '6+ chars',
      passed: password.length >= 6,
    },
    {
      id: 'letter',
      label: 'Letter',
      passed: /[A-Za-z]/.test(password),
    },
    {
      id: 'number',
      label: 'Number',
      passed: /[0-9]/.test(password),
    },
  ]

  const passedCount = passwordChecks.filter((c) => c.passed).length
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const cleanEmail = email.trim()

    const { error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role,
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push(`/verify?email=${encodeURIComponent(cleanEmail)}`)
  }

  return (
    <div className="space-y-5">
      {/* 1. Mode Selector: Clear Choice between Direct Account vs Join a Project */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setRegisterMode('create_account')}
          className={`flex items-center justify-center gap-2 rounded-xl py-3 px-3 text-xs font-black transition ${
            registerMode === 'create_account'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <span className="text-sm">👤</span>
          <span>Create Account</span>
        </button>
        <button
          type="button"
          onClick={() => setRegisterMode('join_project')}
          className={`flex items-center justify-center gap-2 rounded-xl py-3 px-3 text-xs font-black transition ${
            registerMode === 'join_project'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <span className="text-sm">🤝</span>
          <span>Join / Connect Project</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/60 p-3 text-xs font-semibold text-red-300 backdrop-blur-md">
          ⚠️ {error}
        </div>
      )}

      {/* OPTION A: DIRECT ACCOUNT REGISTRATION */}
      {registerMode === 'create_account' ? (
        <div className="space-y-4">
          <GoogleSignInButton />

          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-white/10" />
            <span className="mx-3 flex-shrink text-[11px] font-bold uppercase tracking-wider text-slate-400">
              or sign up with email
            </span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="fullName" className="block text-xs font-bold text-[#1e1512]">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Juan Dela Cruz"
            className="mt-1 block w-full rounded-xl px-3.5 py-2 text-sm text-[#1e1512] placeholder:text-[#8c7369] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-bold text-[#1e1512]">
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
            className="mt-1 block w-full rounded-xl px-3.5 py-2 text-sm text-[#1e1512] placeholder:text-[#8c7369] focus:outline-none"
          />
        </div>

        {/* User Role Selector */}
        <div>
          <label htmlFor="role" className="block text-xs font-bold text-[#1e1512]">
            Your Role in the Project
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) =>
              setRole(e.target.value as 'contractor' | 'client' | 'assistant' | 'admin_engineer')
            }
            className="mt-1 block w-full rounded-xl border border-white/80 bg-white/75 px-3.5 py-2 text-sm font-semibold text-[#1e1512] shadow-sm backdrop-blur-md focus:border-[#c85a38] focus:outline-none"
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Password Field + Minimal Single-Row Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-bold text-[#1e1512]">
              Password
            </label>
            <div className="flex items-center gap-1">
              {passwordChecks.map((item) => (
                <span
                  key={item.id}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
                    item.passed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-black/5 text-[#7d6860]'
                  }`}
                >
                  {item.passed ? '✓ ' : ''}
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="block w-full rounded-xl px-3.5 py-2 pr-11 text-sm text-[#1e1512] placeholder:text-[#8c7369] focus:outline-none"
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

          {/* Slim 3-segment bar */}
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1 rounded-full transition-all duration-300 ${
                  password.length > 0 && passedCount >= step
                    ? passedCount === 3
                      ? 'bg-emerald-500'
                      : 'bg-[#c85a38]'
                    : 'bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#1e1512]">
              Confirm password
            </label>
            {confirmPassword.length > 0 && (
              <span
                className={`text-[10px] font-bold ${
                  passwordsMatch ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {passwordsMatch ? '✓ Match' : '✕ No match'}
              </span>
            )}
          </div>
          <div className="relative mt-1">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="block w-full rounded-xl px-3.5 py-2 pr-11 text-sm text-[#1e1512] placeholder:text-[#8c7369] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute inset-y-0 right-0 flex items-center px-3.5 text-[#6e5a52] transition hover:text-[#1e1512]"
            >
              {showConfirmPassword ? (
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
          className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:from-cyan-300 hover:to-blue-400 disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      {/* Quick link to switch to project cooperation mode */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
        <p className="text-xs text-slate-300">
          Want to collaborate on an existing project instead?
        </p>
        <button
          type="button"
          onClick={() => setRegisterMode('join_project')}
          className="mt-1 text-xs font-bold text-cyan-300 hover:text-cyan-200 underline"
        >
          Join / Connect to a Project →
        </button>
      </div>
    </div>
  ) : (
    /* OPTION B: JOIN / CONNECT TO A PROJECT DIRECTLY */
    <div className="space-y-4">
      <ProjectCooperationWidget
        email={email}
        password={password}
        fullName={fullName}
        role={role}
        defaultExpanded={true}
        hideHeaderToggle={true}
      />

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
        <p className="text-xs text-slate-300">
          Need a direct personal/corporate account instead?
        </p>
        <button
          type="button"
          onClick={() => setRegisterMode('create_account')}
          className="mt-1 text-xs font-bold text-cyan-300 hover:text-cyan-200 underline"
        >
          ← Create Standard Account
        </button>
      </div>
    </div>
  )}

  <p className="text-center text-sm font-medium text-slate-400 pt-2 border-t border-white/10">
    Already have an account?{' '}
    <Link href="/login" className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline">
      Sign in
    </Link>
  </p>
</div>
)
}
