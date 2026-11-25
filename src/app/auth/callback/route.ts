import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as any
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  const supabase = await createClient()

  let authSuccess = false

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) authSuccess = true
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) authSuccess = true
  }

  if (authSuccess) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const admin = createAdminClient()
      const db: any = admin

      // User confirmed their email via magic link/verification URL -> Upgrade to verified!
      try {
        await db
          .from('profiles')
          .update({
            verification_tier: 'verified',
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        await db
          .from('verification_records')
          .insert({
            user_id: user.id,
            verification_type: 'email_otp',
            verification_status: 'approved',
            reviewed_at: new Date().toISOString(),
            verified_data: {
              method: 'magic_link_confirmation',
              email: user.email,
              verified_at: new Date().toISOString(),
            },
          })
      } catch (profileErr) {
        console.warn('Profile verification update notice:', profileErr)
      }

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
          verification_tier: 'verified',
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

  // Fallback if session already active
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', requestUrl.origin))
}
