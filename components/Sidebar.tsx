'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Building2,
    Upload,
    Settings,
    LogOut,
    MapPin,
    Users,
    Map,
    Download,
    MessageSquare
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Businesses', href: '/businesses', icon: Building2 },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Map View', href: '/map', icon: Map },
    { name: 'Import', href: '/import', icon: Upload },
    { name: 'Export', href: '/export', icon: Download },
]

// Check dev mode
const supabaseUrl = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    : ''
const isDevMode = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseUrl.startsWith('https://')

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()

    const handleSignOut = async () => {
        if (isDevMode) {
            router.push('/login')
            return
        }

        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--background-secondary))]">
            {/* Logo */}
            <div className="p-6 border-b border-[hsl(var(--border))]">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg gradient-text">Atlantic CRM</h1>
                        <p className="text-xs text-[hsl(var(--muted))]">Business Directory</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href))

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-[hsl(var(--border))]">
                <button
                    onClick={handleSignOut}
                    className="sidebar-link w-full text-left hover:text-red-400"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
