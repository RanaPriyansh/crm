import { createBrowserClient } from '@supabase/ssr'
import { configInvalid, configurationErrorMessage } from '../config'

export function createClient() {
  if (configInvalid) {
    throw new Error(configurationErrorMessage)
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
