import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes anyone can open without being signed in (including the Landing Page at '/' and '/welcome')
const PUBLIC_ROUTES = ['/login', '/register', '/verify', '/auth', '/welcome', '/reset-password', '/api/cooperation']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: DO NOT remove this line.
  // Refreshes the auth token and keeps the session alive.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublicRoute =
    pathname === '/' || PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  // Not signed in and trying to open a protected page -> go to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Signed in with email/password but email is not confirmed yet -> block dashboard access
  if (user && !user.email_confirmed_at && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/verify'
    if (user.email) {
      url.searchParams.set('email', user.email)
    }
    return NextResponse.redirect(url)
  }

  // Already signed in (and verified) and opening login or register -> go to dashboard
  if (
    user &&
    user.email_confirmed_at &&
    (pathname.startsWith('/login') || pathname.startsWith('/register'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
