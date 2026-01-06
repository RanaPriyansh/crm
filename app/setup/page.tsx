import { configInvalid, configurationErrorMessage, devModeRequested, isDevMode, missingSupabaseEnv } from '@/lib/config'
import Link from 'next/link'

export default function SetupPage() {
    const missingList = missingSupabaseEnv.length > 0 ? missingSupabaseEnv : ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']

    return (
        <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
            <div className="max-w-4xl mx-auto py-16 px-6 space-y-10">
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-[hsl(var(--muted))] uppercase tracking-wider">Setup required</p>
                    <h1 className="text-3xl font-bold">Configure Supabase to continue</h1>
                    <p className="text-[hsl(var(--muted))] max-w-2xl">
                        {configurationErrorMessage}
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="glass-card p-6 space-y-4">
                        <h2 className="text-xl font-semibold">Required environment variables</h2>
                        <p className="text-[hsl(var(--muted))] text-sm">
                            Add the following keys to your <code>.env.local</code> file and restart the app:
                        </p>
                        <ul className="space-y-2 text-sm">
                            {missingList.map(key => (
                                <li key={key} className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    <span className="font-mono">{key}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="text-sm text-[hsl(var(--muted))]">
                            Need help? See the Supabase setup instructions in the README.
                        </div>
                    </div>

                    <div className="glass-card p-6 space-y-4">
                        <h2 className="text-xl font-semibold">Using development JSON storage</h2>
                        <p className="text-[hsl(var(--muted))] text-sm">
                            For local development without Supabase, enable the built-in JSON data store.
                        </p>
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-500">
                            <p className="font-semibold mb-2">Safety checks</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Set <code>NEXT_PUBLIC_DEV_MODE=true</code> in <code>.env.local</code>.</li>
                                <li>Only use this flag in local development; never in production.</li>
                                <li>JSON data is stored under <code>.dev-data/</code> and is not persisted across deployments.</li>
                            </ul>
                        </div>
                        <div className="space-y-2 text-sm text-[hsl(var(--muted))]">
                            <p>Dev mode requested: <span className="font-semibold text-[hsl(var(--foreground))]">{devModeRequested ? 'Yes' : 'No'}</span></p>
                            <p>Dev mode active: <span className="font-semibold text-[hsl(var(--foreground))]">{isDevMode ? 'Yes' : 'No'}</span></p>
                            <p>Configuration valid: <span className="font-semibold text-[hsl(var(--foreground))]">{configInvalid ? 'No' : 'Yes'}</span></p>
                        </div>
                        <div className="pt-2">
                            <Link href="/" className="btn btn-primary">Return to dashboard</Link>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 space-y-3">
                    <h2 className="text-xl font-semibold">Checklist</h2>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-[hsl(var(--muted))]">
                        <li>Create or open <code>.env.local</code> in the project root.</li>
                        <li>Fill in your Supabase URL and anonymous key.</li>
                        <li>Restart the development server.</li>
                        <li>Reload this page to verify the configuration.</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}
