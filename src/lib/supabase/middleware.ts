import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database'

type CookieToSet = {
  name: string
  value: string
  options?: Record<string, unknown>
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as never)
          )
        },
      },
    })

    const pathname = request.nextUrl.pathname
    const isAuthRoute =
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/reset-password')
    const isProtectedRoute =
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/onboarding') ||
      pathname.startsWith('/discover') ||
      pathname.startsWith('/quiz') ||
      pathname.startsWith('/chat') ||
      pathname.startsWith('/rooms') ||
      pathname.startsWith('/expenses')

    // When connected to live Supabase backend
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    ) {
      const { data: { user } } = await supabase.auth.getUser()

      if (isProtectedRoute && !user) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(redirectUrl)
      }

      if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  } catch (err) {
    console.error('Session update error in middleware:', err)
    return supabaseResponse
  }

  return supabaseResponse
}
