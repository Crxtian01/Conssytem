'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import GoogleSignInButton from './GoogleSignInButton'

export default function RegisterForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Live Strong Password Criteria
  const passwordChecks = [
    {
      id: 'length',
      label: 'At least 8 characters',
      passed: password.length >= 8,
    },
    {
      id: 'upper',
      label: 'At least 1 uppercase letter (A–Z)',
      passed: /[A-Z]/.test(password),
    },
    {
      id: 'lower',
      label: 'At least 1 lowercase letter (a–z)',
      passed: /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'At least 1 number (0–9)',
      passed: /[0-9]/.test(password),
    },
    {
      id: 'special',
      label: 'At least 1 special symbol (!@#$%^&*)',
      passed: /[^A-Za-z0-9]/.test(password),
    },
  ]

  const passedCount = passwordChecks.filter((c) => c.passed).length
  const allChecksPassed = passedCount === passwordChecks.length
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  const strengthInfo =
    password.length === 0
      ? { label: 'Enter a password', color: 'text-slate-500', barColor: 'bg-slate-300' }
      : passedCount <= 2
        ? { label: 'Weak', color: 'text-red-600', barColor: 'bg-red-500' }
        : passedCount === 3
          ? { label: 'Fair', color: 'text-amber-600', barColor: 'bg-amber-500' }
          : passedCount === 4
            ? { label: 'Good', color: 'text-sky-600', barColor: 'bg-sky-500' }
            : { label: 'Strong ✓', color: 'text-emerald-700', barColor: 'bg-emerald-500' }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!allChecksPassed) {
      setError('Please complete all 5 strong password requirements below.')
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
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Redirect to the email confirmation notice page
    router.push(`/verify?email=${encodeURIComponent(cleanEmail)}`)
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-300/80 bg-red-50/80 p-3 text-xs font-semibold text-red-700 backdrop-blur-md">
          ⚠️ {error}
        </div>
      )}

      <GoogleSignInButton />

      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-white/70" />
        <span className="mx-3 flex-shrink text-[11px] font-bold uppercase tracking-wider text-slate-500">
          or sign up with email
        </span>
        <div className="flex-grow border-t border-white/70" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-xs font-bold text-slate-800">
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
            className="mt-1 block w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-bold text-slate-800">
            Email address (receives confirmation &amp; notifications)
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 block w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Password Field + Live Strength Meter + Requirements Checklist */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-bold text-slate-800">
              Password
            </label>
            <span className={`text-[11px] font-bold ${strengthInfo.color}`}>
              Strength: {strengthInfo.label}
            </span>
          </div>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="block w-full rounded-xl px-3.5 py-2.5 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-white/60 hover:text-slate-900"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* 5-Segment Password Strength Meter Bar */}
          <div className="grid grid-cols-5 gap-1.5 pt-0.5">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  password.length > 0 && passedCount >= step
                    ? strengthInfo.barColor
                    : 'bg-white/60 border border-white/80'
                }`}
              />
            ))}
          </div>

          {/* Frosted Liquid Glass Strong Password Requirements Box */}
          <div className="liquid-droplet-pill rounded-2xl p-3.5 space-y-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
              Strong Password Requirements ({passedCount}/5 met):
            </p>
            <ul className="grid grid-cols-1 gap-1.5 text-xs">
              {passwordChecks.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-2 transition-colors ${
                    item.passed ? 'font-semibold text-emerald-800' : 'text-slate-600'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      item.passed
                        ? 'bg-emerald-500 text-white shadow-2xs'
                        : 'border border-slate-400/70 bg-white/60 text-slate-400'
                    }`}
                  >
                    {item.passed ? '✓' : '•'}
                  </span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-800">
              Confirm password
            </label>
            {confirmPassword.length > 0 && (
              <span
                className={`text-[11px] font-bold ${
                  passwordsMatch ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {passwordsMatch ? '✓ Passwords match' : '✕ Does not match'}
              </span>
            )}
          </div>
          <div className="relative mt-1">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your strong password"
              className="block w-full rounded-xl px-3.5 py-2.5 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-white/60 hover:text-slate-900"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(217,119,6,0.35),inset_0_1px_1px_rgba(255,255,255,0.6)] transition hover:from-amber-600 hover:to-amber-700 disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm font-medium text-slate-700">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-amber-700 hover:text-amber-800 underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
