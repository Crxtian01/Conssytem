import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { clearAuthCache } from '@/lib/auth'

interface UpdateProfileBody {
  fullName?: string
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as UpdateProfileBody
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''

  if (!fullName) {
    return NextResponse.json({ error: 'Full name cannot be empty.' }, { status: 400 })
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: targetAuthUser } = await adminSupabase.auth.admin.getUserById(user.id)
  await adminSupabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(targetAuthUser?.user?.user_metadata ?? {}),
      full_name: fullName,
    },
  })

  await adminSupabase
    .from('profiles')
    .update({
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  clearAuthCache()

  return NextResponse.json({
    ok: true,
    fullName,
  })
}

