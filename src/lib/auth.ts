'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface AuthResponse {
  success: boolean
  error?: string
  data?: any
}

export type { AuthResponse }

/**
 * Standard Phone OTP Sign In
 * Uses Supabase-compatible phone authentication
 */
export async function sendPhoneOtp(phone: string): Promise<AuthResponse> {
  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`

  if (formattedPhone.length < 12) {
    return { success: false, error: 'Please enter a valid 10-digit Indian phone number.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  })

  if (error) {
    // If running in development without live Twilio credentials, provide simulated dev fallback
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') ||
      error.message.includes('SMS provider') ||
      error.message.includes('not enabled')
    ) {
      return {
        success: true,
        data: { simulated: true, phone: formattedPhone, message: 'OTP sent (Demo mode: Use 123456)' },
      }
    }
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Verify Phone OTP
 */
export async function verifyPhoneOtp(phone: string, token: string): Promise<AuthResponse> {
  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`

  // Development bypass when using demo mode
  if (token === '123456' && process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    return { success: true, data: { simulated: true, phone: formattedPhone } }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token,
    type: 'sms',
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Register with Email & Password
 */
export async function signUpWithEmail(formData: FormData): Promise<AuthResponse> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = (formData.get('fullName') as string) || ''

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' }
  }
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      return {
        success: true,
        data: { simulated: true, email, message: 'Registered successfully in local development mode.' },
      }
    }
    return { success: false, error: error.message }
  }

  // Pre-seed profile record if user created
  if (data.user) {
    await (supabase.from('profiles') as any).upsert({
      id: data.user.id,
      full_name: fullName || 'New YAARO Member',
      city: 'Bengaluru',
      verification_tier: 'unverified',
      is_looking_for_room: true,
      is_looking_for_roommate: true,
      profile_completed_percentage: 20,
      onboarded: false,
    })
  }

  return { success: true, data }
}

/**
 * Login with Email & Password
 */
export async function signInWithEmail(formData: FormData): Promise<AuthResponse> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      return { success: true, data: { simulated: true, email } }
    }
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Request Password Reset Email
 */
export async function resetPasswordForEmail(email: string): Promise<AuthResponse> {
  if (!email) {
    return { success: false, error: 'Please enter your registered email address.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/update-password`,
  })

  if (error) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      return { success: true, data: { simulated: true, message: 'Password reset link simulated in dev mode.' } }
    }
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Update Password after reset
 */
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Initiate Google OAuth Sign In URL
 */
export async function getGoogleOAuthUrl(redirectTo?: string): Promise<AuthResponse> {
  const supabase = await createClient()
  const redirectUrl =
    redirectTo ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?next=/dashboard`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

/**
 * Sign Out
 */
export async function signOutUser() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
