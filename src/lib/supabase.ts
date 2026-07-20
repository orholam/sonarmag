import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Set PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY (or VITE_* equivalents).`,
    )
  }
  return value
}

const supabaseUrl = requiredEnv(
  'PUBLIC_SUPABASE_URL',
  import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
)

const supabaseAnonKey = requiredEnv(
  'PUBLIC_SUPABASE_ANON_KEY',
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)
