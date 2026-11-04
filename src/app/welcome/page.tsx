import { Suspense } from 'react'
import { getOptionalAuthUser } from '@/lib/auth'
import LandingPage from '@/components/landing/LandingPage'
import ModuleLoadingSkeleton from '@/components/layout/ModuleLoadingSkeleton'

export const metadata = {
  title: 'Welcome to ConstructMS | Construction & RA 12009 Bidding Platform',
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton title="Loading Landing Page…" />}>
      <WelcomeContent />
    </Suspense>
  )
}

async function WelcomeContent() {
  const user = await getOptionalAuthUser()
  return <LandingPage isSignedIn={Boolean(user)} userEmail={user?.email} />
}
