// Shared dev mode check for all files
// Dev mode is enabled when Supabase is not properly configured

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

export const isDevMode =
    !supabaseUrl ||
    supabaseUrl === '' ||
    supabaseUrl.includes('your-project') ||
    !supabaseUrl.startsWith('https://')

if (isDevMode && typeof window === 'undefined') {
    console.log('[CRM] Running in DEV MODE - using local JSON storage')
}
