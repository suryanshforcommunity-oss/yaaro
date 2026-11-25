'use server'

import { createClient } from '@/lib/supabase/server'
import {
  getUserVerificationState,
  submitVerificationDocument,
  verifyPhoneNumber,
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
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Unauthorized' }
    }

    return await verifyPhoneNumber(user.id, phoneNumber, otpCode)
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}
