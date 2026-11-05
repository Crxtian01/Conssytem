'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import GoogleSignInButton from './GoogleSignInButton'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const verified = searchParams.get('verified')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(
    urlError === 'auth_failed'
      ? 'Authentication failed or link expired. Please try signing in again.'
      : null
  )

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address above first, then click Forgot password.')
      return
    }
    setError(null)
    setResetSent(null)
    const supabase = createClient()
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm`,
    })
    if (resetErr) {
      setError(resetErr.message)
      return
    }
    setResetSent(`Password reset link sent to ${email.trim()}! Check your inbox.`)
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
              className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:from-amber-600 hover:to-orange-700 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm font-medium text-slate-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-bold text-amber-600 hover:text-amber-700">
          Create account
        </Link>
      </p>
    </div>
  )
}
