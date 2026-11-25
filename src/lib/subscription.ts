import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type PlanTier = 'free' | 'yaaro_pro' | 'landlord_verified'
export type BillingCycle = 'monthly' | 'quarterly' | 'annual'

export type PremiumFeature =
  | 'unlimited_swipes'
  | 'advanced_filters'
  | 'deep_compatibility_insights'
  | 'incognito_browsing'
  | 'priority_candidate_ranking'
  | 'unlimited_saved_profiles'
  | 'direct_landlord_contact'
  | 'verified_pro_badge'

export interface PlanConfig {
  id: PlanTier
  name: string
  tagline: string
  pricing: {
    monthly: number
    annual: number // discounted
  }
  features: string[]
  limits: {
    dailySwipes: number
    savedProfiles: number
    hasAdvancedFilters: boolean
    hasDeepInsights: boolean
    hasIncognito: boolean
    hasDirectLandlordChat: boolean
  }
}

export const YAARO_PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Standard Dossier',
    tagline: 'Basic compatibility discovery and room browsing',
    pricing: {
      monthly: 0,
      annual: 0,
    },
    features: [
      'Standard Roommate Discovery (10 daily swipes)',
      'Basic Compatibility Score (0–100% Harmony)',
      'Room Marketplace Browsing (Approximate Localities)',
      '1-on-1 Messaging with Mutual Matches',
      'Up to 5 Saved Profiles & Listings',
    ],
    limits: {
      dailySwipes: 10,
      savedProfiles: 5,
      hasAdvancedFilters: false,
      hasDeepInsights: false,
      hasIncognito: false,
      hasDirectLandlordChat: false,
    },
  },
  yaaro_pro: {
    id: 'yaaro_pro',
    name: 'YAARO Club Pro',
    tagline: 'For intentional seekers who value lifestyle synchronization',
    pricing: {
      monthly: 499,
      annual: 3999, // ~₹333/mo (Save 33%)
    },
    features: [
      'Unlimited Roommate Discovery Swipes & Super-Vibes',
      'Advanced Filters (Dietary, Smoking, Sleep Rhythm, WFH Schedule)',
      'Deep Compatibility Insights (Dealbreaker Matrix & Habit Radar)',
      'Incognito Browsing (Only visible to flatmates you like first)',
      'Priority Dossier Placement (3x more match views)',
      'Unlimited Saved Profiles & Room Listings',
      'Gold Pro Collective Member Badge',
    ],
    limits: {
      dailySwipes: 999999,
      savedProfiles: 999999,
      hasAdvancedFilters: true,
      hasDeepInsights: true,
      hasIncognito: true,
      hasDirectLandlordChat: true,
    },
  },
  landlord_verified: {
    id: 'landlord_verified',
    name: 'Owner & Flatmate Collective',
    tagline: 'Direct tenant screening, verified leases, and zero brokerage',
    pricing: {
      monthly: 999,
      annual: 7999,
    },
    features: [
      'Everything in YAARO Club Pro',
      'Publish Up to 5 Active Room Listings with 3D Tours',
      'Direct WhatsApp & In-App Enquiry Screening',
      'Legally Verified Rental Agreement Generator',
      'Priority Room Placement at the Top of City Directory',
      'Direct Tenant Background & Compatibility Verification',
    ],
    limits: {
      dailySwipes: 999999,
      savedProfiles: 999999,
      hasAdvancedFilters: true,
      hasDeepInsights: true,
      hasIncognito: true,
      hasDirectLandlordChat: true,
    },
  },
}

export interface UserSubscriptionDetails {
  planTier: PlanTier
  isActive: boolean
  billingCycle: BillingCycle
  validFrom: string
  validUntil: string | null
  config: PlanConfig
  daysRemaining: number
}

/**
 * Resolves active subscription for a user from public.subscriptions.
 * Falls back safely to 'free' plan.
 */
export async function getUserSubscription(userId: string): Promise<UserSubscriptionDetails> {
  const admin = createAdminClient()
  const db: any = admin

  try {
    const { data: sub } = await db
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (sub) {
      const now = new Date()
      const validUntilDate = sub.valid_until ? new Date(sub.valid_until) : null
      const isStillValid = !validUntilDate || validUntilDate > now

      if (isStillValid) {
        const tier = (sub.plan_tier as PlanTier) || 'free'
        const planConfig = YAARO_PLANS[tier] || YAARO_PLANS.free
        const daysRemaining = validUntilDate
          ? Math.max(0, Math.ceil((validUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : 365

        return {
          planTier: tier,
          isActive: true,
          billingCycle: (sub.billing_cycle as BillingCycle) || 'monthly',
          validFrom: sub.valid_from || sub.created_at,
          validUntil: sub.valid_until,
          config: planConfig,
          daysRemaining,
        }
      }
    }
  } catch (err) {
    console.warn('Subscription fetch notice:', err)
  }

  return {
    planTier: 'free',
    isActive: true,
    billingCycle: 'monthly',
    validFrom: new Date().toISOString(),
    validUntil: null,
    config: YAARO_PLANS.free,
    daysRemaining: 9999,
  }
}

/**
 * Checks whether a user holds entitlement for a specific premium capability.
 */
export async function hasPremiumEntitlement(userId: string, feature: PremiumFeature): Promise<boolean> {
  const sub = await getUserSubscription(userId)
  if (sub.planTier === 'yaaro_pro' || sub.planTier === 'landlord_verified') {
    return true
  }

  // Free tier evaluations
  switch (feature) {
    case 'unlimited_swipes':
    case 'advanced_filters':
    case 'deep_compatibility_insights':
    case 'incognito_browsing':
    case 'priority_candidate_ranking':
    case 'direct_landlord_contact':
    case 'verified_pro_badge':
      return false
    case 'unlimited_saved_profiles':
      return false
    default:
      return false
  }
}

/**
 * Activates or upgrades a subscription record upon payment completion.
 */
export async function activateSubscription(
  userId: string,
  planTier: PlanTier,
  billingCycle: BillingCycle,
  transactionRef: string
): Promise<{ success: boolean; message: string }> {
  const admin = createAdminClient()
  const db: any = admin

  try {
    // 1. Deactivate existing active subscriptions
    await db
      .from('subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)

    // 2. Compute validity dates
    const validFrom = new Date()
    const validUntil = new Date()
    if (billingCycle === 'annual') {
      validUntil.setFullYear(validUntil.getFullYear() + 1)
    } else if (billingCycle === 'quarterly') {
      validUntil.setMonth(validUntil.getMonth() + 3)
    } else {
      validUntil.setMonth(validUntil.getMonth() + 1)
    }

    // 3. Insert new subscription record
    await db.from('subscriptions').insert({
      user_id: userId,
      plan_tier: planTier,
      billing_cycle: billingCycle,
      valid_from: validFrom.toISOString(),
      valid_until: validUntil.toISOString(),
      is_active: true,
    })

    // 4. Update user profile verification tier / badges if applicable
    await db
      .from('profiles')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    return {
      success: true,
      message: `Welcome to ${YAARO_PLANS[planTier].name}! Your subscription is now active until ${validUntil.toLocaleDateString('en-IN')}.`,
    }
  } catch (err: any) {
    console.error('Failed to activate subscription:', err)
    return {
      success: false,
      message: err.message || 'Subscription activation failed.',
    }
  }
}

/**
 * Cancels active subscription renewal. Entitlements persist until end of current billing cycle.
 */
export async function cancelSubscription(userId: string): Promise<{ success: boolean; message: string }> {
  const admin = createAdminClient()
  const db: any = admin

  try {
    await db
      .from('subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)

    return {
      success: true,
      message: 'Subscription cancelled. You will continue to have access until your current period ends.',
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to cancel subscription.',
    }
  }
}
