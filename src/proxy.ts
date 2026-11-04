import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase-middleware'

// Next.js 16: "middleware" is now called "proxy".
// Runs before every matched request to refresh the Supabase session
// and redirect signed-out users to /login.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Run on everything except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

