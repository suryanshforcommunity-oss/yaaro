'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { reviewVerificationRecord } from '@/lib/verification'
import { resolveReportAction, banUserAction, moderateListingAction } from '@/lib/safety'

export interface AdminMetrics {
  totalUsers: number
  verifiedUsers: number
  pendingVerifications: number
  activeListings: number
  openReports: number
  activeSubscriptions: number
  estimatedMRR: number
}

const ADMIN_EMAIL = process.env.YAARO_ADMIN_EMAIL || 'admin@yaaro.live'
const ADMIN_SECRET_KEY = process.env.YAARO_ADMIN_SECRET || 'YaaroAdmin#2026!MasterKey'

export async function verifyAdminPasskeyAction(passkey: string) {
  if (passkey === ADMIN_SECRET_KEY) {
    return { success: true }
  }
  return { success: false, message: 'Invalid administrative security key.' }
}

async function isAuthorizedAdmin(user: any, passkey?: string): Promise<boolean> {
  if (passkey && passkey === ADMIN_SECRET_KEY) return true
  if (user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true
  return false
}

export async function getAdminDashboardDataAction(adminKey?: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const authorized = await isAuthorizedAdmin(user, adminKey)
    if (!authorized) {
      return { success: false, message: 'Access denied: Restricted administrative terminal.' }
    }

    const admin = createAdminClient()
    const db: any = admin

    // 1. Fetch Key Metrics
    const [
      { count: totalUsers },
      { count: verifiedUsers },
      { count: pendingVerifications },
      { count: activeListings },
      { count: openReports },
      { data: activeSubs },
    ] = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('profiles').select('id', { count: 'exact', head: true }).in('verification_tier', ['verified', 'id_verified']),
      db.from('verification_records').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      db.from('room_listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('reports_and_blocks').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('subscriptions').select('plan_tier, billing_cycle').eq('is_active', true),
    ])

    let estimatedMRR = 0
    if (activeSubs) {
      activeSubs.forEach((s: any) => {
        if (s.plan_tier === 'yaaro_pro') {
          estimatedMRR += s.billing_cycle === 'annual' ? 333 : 499
        } else if (s.plan_tier === 'landlord_verified') {
          estimatedMRR += s.billing_cycle === 'annual' ? 666 : 999
        }
      })
    }

    const metrics: AdminMetrics = {
      totalUsers: totalUsers || 0,
      verifiedUsers: verifiedUsers || 0,
      pendingVerifications: pendingVerifications || 0,
      activeListings: activeListings || 0,
      openReports: openReports || 0,
      activeSubscriptions: activeSubs?.length || 0,
      estimatedMRR,
    }

    // 2. Fetch Pending Verification Records
    const { data: verifications } = await db
      .from('verification_records')
      .select('id, user_id, verification_type, verification_status, verified_data, submitted_at')
      .order('submitted_at', { ascending: false })
      .limit(20)

    // Enrich verifications with user profile data
    const enrichedVerifications = await Promise.all(
      (verifications || []).map(async (v: any) => {
        const { data: p } = await db
          .from('profiles')
          .select('full_name, email, city, occupation')
          .eq('id', v.user_id)
          .maybeSingle()
        return {
          ...v,
          user: p || { full_name: 'Resident Member', email: 'N/A' },
        }
      })
    )

    // 3. Fetch Reports and Blocks
    const { data: reports } = await db
      .from('reports_and_blocks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    // Enrich reports with reporter & target user profiles
    const enrichedReports = await Promise.all(
      (reports || []).map(async (r: any) => {
        const [rep, tgt, lst] = await Promise.all([
          db.from('profiles').select('full_name').eq('id', r.reporter_id).maybeSingle(),
          r.target_user_id ? db.from('profiles').select('full_name').eq('id', r.target_user_id).maybeSingle() : null,
          r.target_listing_id ? db.from('room_listings').select('title, city').eq('id', r.target_listing_id).maybeSingle() : null,
        ])
        return {
          ...r,
          reporterName: rep.data?.full_name || 'Community Member',
          targetName: tgt?.data?.full_name || null,
          listingTitle: lst?.data?.title || null,
        }
      })
    )

    // 4. Fetch Room Listings for Moderation
    const { data: listings } = await db
      .from('room_listings')
      .select('id, owner_id, title, city, rent_monthly, security_deposit, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    // 5. Fetch Users for Management
    const { data: users } = await db
      .from('profiles')
      .select('id, full_name, email, city, occupation, verification_tier, created_at')
      .order('created_at', { ascending: false })
      .limit(30)

    // 6. Fetch Subscriptions List
    const { data: subscriptionsList } = await db
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    const enrichedSubscriptions = await Promise.all(
      (subscriptionsList || []).map(async (s: any) => {
        const { data: p } = await db.from('profiles').select('full_name, email').eq('id', s.user_id).maybeSingle()
        return {
          ...s,
          userName: p?.full_name || 'Subscriber',
          userEmail: p?.email || 'N/A',
        }
      })
    )

    return {
      success: true,
      metrics,
      verifications: enrichedVerifications,
      reports: enrichedReports,
      listings: listings || [],
      users: users || [],
      subscriptions: enrichedSubscriptions,
    }
  } catch (err: any) {
    console.error('Failed to load admin dashboard data:', err)
    return { success: false, message: err.message }
  }
}

export async function adminReviewVerificationAction(recordId: string, status: 'approved' | 'rejected', notes?: string, adminKey?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!await isAuthorizedAdmin(user, adminKey)) {
    return { success: false, message: 'Unauthorized' }
  }
  return await reviewVerificationRecord(recordId, status, notes)
}

export async function adminResolveReportAction(reportId: string, resolution: 'action_taken' | 'dismissed', notes?: string, adminKey?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!await isAuthorizedAdmin(user, adminKey)) {
    return { success: false, message: 'Unauthorized' }
  }
  return await resolveReportAction(reportId, resolution, notes)
}

export async function adminBanUserAction(userId: string, reason: string, adminKey?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!await isAuthorizedAdmin(user, adminKey)) {
    return { success: false, message: 'Unauthorized' }
  }
  return await banUserAction(userId, reason)
}

export async function adminModerateListingAction(listingId: string, newStatus: 'active' | 'paused' | 'archived' | 'flagged', adminKey?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!await isAuthorizedAdmin(user, adminKey)) {
    return { success: false, message: 'Unauthorized' }
  }
  return await moderateListingAction(listingId, newStatus)
}
