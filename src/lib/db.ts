import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient as createSupabaseServer } from '@/lib/supabase-server'

/**
 * Section 7: Reusable Database Access Layer
 * Provides one central place for both session-scoped queries (RLS)
 * and server-only administrative queries.
 */
export async function getSessionDb() {
  return await createSupabaseServer()
}

export function getAdminDb() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
