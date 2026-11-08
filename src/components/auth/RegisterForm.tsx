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
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-300/80 bg-red-50/80 p-3 text-xs font-semibold text-red-700 backdrop-blur-md">
          ⚠️ {error}
        </div>
      )}

      <GoogleSignInButton />

      <div className="relative flex items-center py-0.5">
        <div className="flex-grow border-t border-white/70" />
        <span className="mx-3 flex-shrink text-[11px] font-bold uppercase tracking-wider text-[#6e5a52]">
          or sign up with email
        </span>
        <div className="flex-grow border-t border-white/70" />
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
          className="w-full rounded-2xl bg-gradient-to-r from-[#cc5c3b] to-[#94361d] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#94361d]/25 transition hover:from-[#b54829] hover:to-[#7c2b15] disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm font-medium text-[#5c4942]">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-[#c85a38] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
