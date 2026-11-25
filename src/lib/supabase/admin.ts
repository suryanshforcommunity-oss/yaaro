import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

/**
 * Creates an admin Supabase client utilizing the service role key.
 * Only use in server environments (Server Actions, Route Handlers)
 * for administrative data persistence and bypassing RLS blocks.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wxdtfzeanjbbgymkhauo.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
