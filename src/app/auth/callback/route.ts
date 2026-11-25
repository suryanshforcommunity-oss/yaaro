import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/onboarding'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if profile exists; if first time OAuth sign in, initialize profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, onboarded')
          .eq('id', user.id)
          .maybeSingle()

        if (!existingProfile) {
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'YAARO Member'
          const avatarUrl =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null

          await (supabase.from('profiles') as any).upsert({
            id: user.id,
            full_name: fullName,
            avatar_url: avatarUrl,
            city: 'Bengaluru',
            verification_tier: 'basic_phone',
            is_looking_for_room: true,
            is_looking_for_roommate: true,
            profile_completed_percentage: 25,
            onboarded: false,
          })

          return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
        }

        const destination = (existingProfile as any)?.onboarded ? '/dashboard' : '/onboarding'
        return NextResponse.redirect(new URL(destination, requestUrl.origin))
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Return the user to an error page or login with error message
  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', requestUrl.origin))
}
