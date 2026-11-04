import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

// Temporary dashboard: proves Google login works and shows the stored profile.
// The real dashboard is built in a later phase.
export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Dashboard</h1>
      {/* Reading the session (cookies) must be inside Suspense with Cache Components */}
      <Suspense fallback={<p className="text-gray-500">Loading your account…</p>}>
        <UserCard />
      </Suspense>
    </main>
  )
}

async function UserCard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url, role, email_verified')
    .eq('id', user.id)
    .single()

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        {profile?.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-14 w-14 rounded-full" />
        )}
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {profile?.full_name ?? user.email}
          </p>
          <p className="text-sm text-gray-500">{profile?.email ?? user.email}</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Role</dt>
          <dd className="font-medium capitalize text-gray-900">
            {profile?.role ?? '— (profiles table not found)'}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Email verified</dt>
          <dd className="font-medium text-gray-900">
            {profile?.email_verified ? 'Yes ✅' : 'No'}
          </dd>
        </div>
      </dl>

      <form action="/auth/signout" method="post" className="mt-6">
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
