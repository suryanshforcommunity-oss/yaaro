'use server'

import { createClient } from '@/lib/supabase/server'
import {
  getUserSubscription,
  activateSubscription,
  cancelSubscription,
  type PlanTier,
  type BillingCycle,
} from '@/lib/subscription'
import { paymentProvider } from '@/lib/payment-provider'

export async function getSubscriptionOverviewAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, subscription: null, message: 'Please sign in.' }
    }

    const sub = await getUserSubscription(user.id)
    return { success: true, subscription: sub }
  } catch (err: any) {
    return { success: false, subscription: null, message: err.message }
  }
}

export async function createSubscriptionOrderAction(
  planTier: PlanTier,
  billingCycle: BillingCycle
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, order: null, message: 'Unauthorized' }
    }

    const order = await paymentProvider.createOrder(
      user.id,
      planTier as 'yaaro_pro' | 'landlord_verified',
      billingCycle as 'monthly' | 'annual'
    )

    return { success: true, order }
  } catch (err: any) {
    return { success: false, order: null, message: err.message }
  }
}

export async function confirmSubscriptionPaymentAction(
  orderId: string,
  paymentId: string,
  signature: string | undefined,
  planTier: PlanTier,
  billingCycle: BillingCycle
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Unauthorized' }
    }

    // Verify payment with payment provider
    const verification = await paymentProvider.verifyPayment(orderId, paymentId, signature)
    if (!verification.success) {
      return { success: false, message: verification.message }
    }

    // Activate subscription in database
    return await activateSubscription(
      user.id,
      planTier,
      billingCycle,
      verification.transactionId
    )
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

export async function cancelSubscriptionAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Unauthorized' }
    }

    return await cancelSubscription(user.id)
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}
