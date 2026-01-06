import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { configInvalid, configurationErrorMessage, isDevMode, missingSupabaseEnv } from '../config'

export async function updateSession(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    if (configInvalid) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({
                error: configurationErrorMessage,
                missingEnv: missingSupabaseEnv,
                path: pathname,
            }, { status: 500 })
        }

        if (!pathname.startsWith('/setup')) {
            const url = request.nextUrl.clone()
            url.pathname = '/setup'
            url.searchParams.set('from', pathname)
            return NextResponse.redirect(url)
        }

        return NextResponse.next({ request })
    }

    // Dev mode: skip all auth checks
    if (isDevMode) {
        console.log('[DEV MODE] Auth bypassed - no Supabase configured')
        return NextResponse.next({ request })
    }

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected routes - redirect to login if not authenticated
    const protectedPaths = ['/businesses', '/import', '/scraper', '/settings']
    const isProtectedPath = protectedPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    )

    if (isProtectedPath && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirectTo', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    // Redirect logged-in users away from login page
    if (request.nextUrl.pathname === '/login' && user) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
