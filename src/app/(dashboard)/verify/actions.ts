'use server'

import { createClient } from '@/lib/supabase/server'
import {
  getUserVerificationState,
  sendEmailVerificationOtp,
  verifyUserEmailOtp,
  submitVerificationDocument,
  type VerificationType,
} from '@/lib/verification'

export async function getVerificationStatusAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, state: null, message: 'Please sign in.' }
    }

    const state = await getUserVerificationState(user.id)
    return { success: true, state, userEmail: user.email }
  } catch (err: any) {
    return { success: false, state: null, message: err.message }
  }
}

export async function sendEmailOtpAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) {
      return { success: false, message: 'No registered email found. Please sign in.' }
    }

    return await sendEmailVerificationOtp(user.email)
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

export async function verifyEmailOtpAction(otpCode: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) {
      return { success: false, message: 'Unauthorized. Please sign in.' }
    }

    return await verifyUserEmailOtp(user.id, user.email, otpCode)
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

export async function submitIdentityVerificationAction(
  verificationType: VerificationType,
  documentUrl: string,
  idNumberMasked?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Unauthorized' }
    }

    return await submitVerificationDocument(user.id, verificationType, documentUrl, {
      id_masked: idNumberMasked,
      user_email: user.email,
    })
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

export async function verifyPhoneOtpAction(phoneNumber: string, otpCode: string) {
  return { success: true, message: 'Phone verification is optional and archived.' }
}
