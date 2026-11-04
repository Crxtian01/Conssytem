import { Suspense } from 'react'
import AuthCardLayout from '@/components/auth/AuthCardLayout'
import VerifyEmailNotice from '@/components/auth/VerifyEmailNotice'

export const metadata = {
  title: 'Confirm Your Email | Construction Management System',
}

export default function VerifyPage() {
  return (
    <AuthCardLayout
      title="Confirm Your Email"
      subtitle="Verify your email address to activate your account"
    >
      <Suspense fallback={<p className="text-center text-sm text-gray-500">Loading…</p>}>
        <VerifyEmailNotice />
      </Suspense>
    </AuthCardLayout>
  )
}

