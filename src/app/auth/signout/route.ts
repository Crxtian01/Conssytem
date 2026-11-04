import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { clearAuthCache } from '@/lib/auth'

export async function POST(request: NextRequest) {
  clearAuthCache()
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(`${request.nextUrl.origin}/`, { status: 303 })
}
