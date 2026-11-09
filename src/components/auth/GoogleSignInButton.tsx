'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSetupHelp, setShowSetupHelp] = useState(false)

  async function handleClick() {
    setLoading(true)
    setError(null)
    setShowSetupHelp(false)

    try {
      // Pre-check whether Google provider is enabled in Supabase so the user
      // never lands on a raw {"code":400,"msg":"Unsupported provider"} JSON page.
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (supabaseUrl && anonKey) {
        const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: { apikey: anonKey },
        })
        if (res.ok) {
          const settings = await res.json()
          if (!settings?.external?.google) {
            setShowSetupHelp(true)
            setLoading(false)
            return
          }
        }
      }

      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start Google sign-in')
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] px-4 py-3 text-sm font-bold text-white transition shadow-sm disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
          />
        </svg>
        {loading ? 'Checking Google Sign-In…' : 'Continue with Google'}
      </button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {showSetupHelp && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-left text-xs text-amber-950 space-y-2">
          <p className="font-bold text-amber-900">
            ⚠️ Google Provider is still turned OFF in your Supabase Dashboard
          </p>
          <p>
            To enable <strong>Continue with Google</strong>, do these 3 quick steps in Supabase &amp;
            Google Cloud:
          </p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>
              In{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline text-amber-800"
              >
                Google Cloud Credentials
              </a>
              , click <strong>+ Create Credentials → OAuth client ID</strong> (Web application) and
              set <strong>Authorized redirect URI</strong> to:
              <code className="mt-1 block rounded bg-white p-1.5 font-mono text-[11px] select-all border border-amber-200">
                https://vpzorfwfbgyttsuwjshx.supabase.co/auth/v1/callback
              </code>
            </li>
            <li>
              Open your{' '}
              <a
                href="https://supabase.com/dashboard/project/vpzorfwfbgyttsuwjshx/auth/providers"
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline text-amber-800"
              >
                Supabase Auth Providers page
              </a>
              , click <strong>Google</strong>, turn ON <strong>Enable Sign in with Google</strong>,
              paste the <strong>Client ID</strong> and <strong>Client Secret</strong>, and click{' '}
              <strong>Save</strong>.
            </li>
          </ol>
          <p className="text-[11px] text-amber-800 pt-1">
            Tip: While setting that up, you can sign in right now using the{' '}
            <strong>Email &amp; Password</strong> form below!
          </p>
        </div>
      )}
    </div>
  )
}
