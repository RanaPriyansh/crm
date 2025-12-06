'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Mail, Lock, ArrowRight } from 'lucide-react'
import { configInvalid, configurationErrorMessage, isDevMode } from '@/lib/config'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const supabase = useMemo(() => {
        if (configInvalid || isDevMode) return null
        return createClient()
    }, [])

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        if (!supabase) {
            setError(configInvalid
                ? configurationErrorMessage
                : 'Authentication is disabled while development mode is active.')
            setLoading(false)
            return
        }

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                })
                if (error) throw error
                setMessage('Check your email for the confirmation link!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                window.location.href = '/'
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleAuth = async () => {
        setLoading(true)
        setError(null)

        if (!supabase) {
            setError(configInvalid
                ? configurationErrorMessage
                : 'Authentication is disabled while development mode is active.')
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] p-12 flex-col justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl text-white">Atlantic CRM</h1>
                        <p className="text-sm text-white/70">Business Directory</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-4xl font-bold text-white leading-tight">
                        Discover & Manage<br />
                        Atlantic Canada<br />
                        <span className="text-white/80">Business Contacts</span>
                    </h2>
                    <p className="text-lg text-white/70 max-w-md">
                        Your central hub for business intelligence across Nova Scotia,
                        New Brunswick, PEI, and Newfoundland & Labrador.
                    </p>
                </div>

                <div className="flex gap-6 text-white/60 text-sm">
                    <span>🇨🇦 Nova Scotia</span>
                    <span>🇨🇦 New Brunswick</span>
                    <span>🇨🇦 PEI</span>
                    <span>🇨🇦 Newfoundland</span>
                </div>
            </div>

            {/* Right side - Auth form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:hidden">
                        <div className="inline-flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <h1 className="font-bold text-xl gradient-text">Atlantic CRM</h1>
                                <p className="text-sm text-[hsl(var(--muted))]">Business Directory</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-bold">
                            {isSignUp ? 'Create your account' : 'Welcome back'}
                        </h2>
                        <p className="text-[hsl(var(--muted))]">
                            {isSignUp
                                ? 'Start managing your business contacts today'
                                : 'Sign in to access your dashboard'}
                        </p>
                    </div>

                    {(configInvalid || isDevMode) && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm">
                            {configInvalid
                                ? configurationErrorMessage
                                : 'Development mode is active and authentication is bypassed. Set NEXT_PUBLIC_DEV_MODE=true only in local development.'}
                        </div>
                    )}

                    {/* Google OAuth */}
                    <button
                        onClick={handleGoogleAuth}
                        disabled={loading}
                        className="w-full btn btn-secondary gap-3 py-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[hsl(var(--border))]" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[hsl(var(--background))] text-[hsl(var(--muted))]">
                                or continue with email
                            </span>
                        </div>
                    </div>

                    {/* Email form */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted))]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="input pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted))]" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input pl-10"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary py-3"
                        >
                            {loading ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <>
                                    {isSignUp ? 'Create Account' : 'Sign In'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-[hsl(var(--muted))]">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-[hsl(var(--color-primary))] hover:underline font-medium"
                        >
                            {isSignUp ? 'Sign in' : 'Sign up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
