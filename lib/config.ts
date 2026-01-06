// Shared configuration helpers

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabaseUrlValid =
    supabaseUrl !== '' &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project')

// Dev mode can only be enabled explicitly (flag) or in a local NODE_ENV=development run
export const devModeRequested =
    process.env.NEXT_PUBLIC_DEV_MODE === 'true' ||
    process.env.NODE_ENV === 'development'

export const supabaseConfigured = supabaseUrlValid && supabaseAnonKey !== ''

// Dev mode is only active when requested AND Supabase is not configured
export const isDevMode = devModeRequested && !supabaseConfigured

// Configuration is invalid when Supabase is missing and dev mode is not explicitly enabled
export const configInvalid = !supabaseConfigured && !isDevMode

export const missingSupabaseEnv = [
    supabaseUrl ? null : 'NEXT_PUBLIC_SUPABASE_URL',
    supabaseAnonKey ? null : 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY ? null : 'SUPABASE_SERVICE_ROLE_KEY',
].filter(Boolean) as string[]

export const configurationErrorMessage =
    'Supabase configuration is missing. Provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, '
    + 'or set NEXT_PUBLIC_DEV_MODE=true locally to use the built-in JSON storage.'

let hasLoggedConfigWarning = false

if (!hasLoggedConfigWarning && (!supabaseConfigured || isDevMode)) {
    const payload = {
        event: 'crm_config_status',
        supabaseConfigured,
        devModeRequested,
        isDevMode,
        missingEnv: missingSupabaseEnv,
        supabaseUrlPresent: supabaseUrl !== '',
    }

    console.warn('[CRM] configuration', JSON.stringify(payload))
    hasLoggedConfigWarning = true
}

if (isDevMode && typeof window === 'undefined') {
    console.log('[CRM] Running in DEV MODE - using local JSON storage')
}
