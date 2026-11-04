import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export const metadata = {
  title: 'Sign in | Construction Management System',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500 text-3xl">
            🏗️
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Construction Management</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to manage your projects</p>
        </div>

        <GoogleSignInButton />

        <p className="mt-6 text-center text-xs text-gray-400">
          Email &amp; password sign-up will be added in the next step.
        </p>
      </div>
    </main>
  )
}

