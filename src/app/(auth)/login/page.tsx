import { Suspense } from 'react'
import AuthCardLayout from '@/components/auth/AuthCardLayout'
import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Sign In | Construction Management System',
}

export default function LoginPage() {
  return (
    <AuthCardLayout
      title="Construction Management"
      subtitle="Sign in with Google or your email account"
    >
      <Suspense fallback={<p className="text-center text-sm text-gray-500">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthCardLayout>
  )
}
