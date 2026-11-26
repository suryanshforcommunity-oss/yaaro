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

    // 1. Fetch Auth Users & Profiles in Parallel
    const [
      { data: authUsersResult },
      { data: allProfiles },
      { count: activeListings },
      { count: openReports },
      { data: activeSubs },
      { data: verifications },
    ] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 100 }),
      db.from('profiles').select('*'),
      db.from('room_listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('reports_and_blocks').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('subscriptions').select('plan_tier, billing_cycle').eq('is_active', true),
      db.from('verification_records').select('*').order('submitted_at', { ascending: false }).limit(50),
    ])

    const authUsers = authUsersResult?.users || []
    const profileMap = new Map((allProfiles || []).map((p: any) => [p.id, p]))

    // 2. Build Unified User List with Names, IDs, Emails & Verification Tiers
    const users = authUsers.map((u: any) => {
      const p: any = profileMap.get(u.id)
      const tier = p?.verification_tier || 'unverified'
      const status = p?.verification_status || (tier === 'verified' || tier === 'id_verified' ? 'verified' : 'unverified')
      const name = p?.full_name || u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Resident Member'

      return {
        id: u.id,
        email: u.email || 'N/A',
        full_name: name,
        city: p?.city || 'Pune',
        occupation: p?.occupation || 'Member',
        verification_tier: tier,
        verification_status: status,
        created_at: u.created_at || p?.created_at,
        email_confirmed: Boolean(u.email_confirmed_at),
        phone: p?.phone || u.phone || null,
      }
    })

    // 3. Build Unified Verification Queue (Formal Records + Pending User Requests)
    const recordsEnriched = (verifications || []).map((v: any) => {
      const u = authUsers.find((au: any) => au.id === v.user_id)
      const p: any = profileMap.get(v.user_id)
      const recStatus = v.status || v.verification_status || (p?.verification_tier === 'verified' ? 'approved' : 'pending')
      return {
        id: v.id,
        userId: v.user_id,
        userName: p?.full_name || u?.user_metadata?.full_name || 'Resident Member',
        userEmail: u?.email || 'N/A',
        city: p?.city || 'Pune',
        verification_type: v.verification_type || 'Email Identity Anchor',
        verification_status: recStatus,
        document_url: v.document_path,
        submitted_at: v.created_at || v.submitted_at || new Date().toISOString(),
      }
    })

    // Include pending users who have not yet been approved as verified
    const pendingUserRequests = users
      .filter((u: any) => 
        u.verification_tier !== 'verified' && 
        u.verification_tier !== 'id_verified' && 
        u.verification_tier !== 'suspended' &&
        u.email !== 'admin@yaaro.live' &&
        !recordsEnriched.some((r: any) => r.userId === u.id)
      )
      .map((u: any) => ({
        id: `usr_ver_${u.id}`,
        userId: u.id,
        userName: u.full_name,
        userEmail: u.email,
        city: u.city,
        verification_type: 'Email & Resident Profile Request',
        verification_status: u.verification_status || 'pending',
        verified_data: {},
        submitted_at: u.created_at,
      }))

    const combinedVerifications = [...recordsEnriched, ...pendingUserRequests]

    // 4. Calculate Key Metrics
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

    const verifiedCount = users.filter((u: any) => u.verification_tier === 'verified' || u.verification_tier === 'id_verified').length
    const pendingCount = combinedVerifications.filter((v: any) => v.verification_status !== 'approved').length

    const metrics: AdminMetrics = {
      totalUsers: users.length,
      verifiedUsers: verifiedCount,
      pendingVerifications: pendingCount,
      activeListings: activeListings || 0,
      openReports: openReports || 0,
      activeSubscriptions: activeSubs?.length || 0,
      estimatedMRR,
    }

    // 5. Fetch Reports & Moderation Data
    const { data: reports } = await db
      .from('reports_and_blocks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

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

    // 6. Fetch Room Listings for Moderation
    const { data: listings } = await db
      .from('room_listings')
      .select('id, owner_id, title, city, rent_monthly, security_deposit, status, created_at')
      .order('created_at', { ascending: false })
      .limit(30)

    // 7. Fetch Subscriptions List
    const { data: subscriptionsList } = await db
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    const enrichedSubscriptions = await Promise.all(
      (subscriptionsList || []).map(async (s: any) => {
        const u = authUsers.find((au: any) => au.id === s.user_id)
        const p: any = profileMap.get(s.user_id)
        return {
          ...s,
          userName: p?.full_name || u?.user_metadata?.full_name || 'Subscriber',
          userEmail: u?.email || 'N/A',
        }
      })
    )

    return {
      success: true,
      metrics,
      verifications: combinedVerifications,
      reports: enrichedReports,
      listings: listings || [],
      users,
      subscriptions: enrichedSubscriptions,
    }
  } catch (err: any) {
    console.error('Failed to load admin dashboard data:', err)
    return { success: false, message: err.message }
  }
}

export async function adminSetUserVerificationTierAction(
  userId: string,
  tier: 'verified' | 'unverified' | 'suspended',
  adminKey?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!await isAuthorizedAdmin(user, adminKey)) {
    return { success: false, message: 'Unauthorized' }
  }

  const admin = createAdminClient()
  const db: any = admin

  // IMPORTANT: The profiles_verification_status_check constraint requires:
  // verification_status IN ('unverified', 'pending', 'verified')
  const profileStatus: 'unverified' | 'pending' | 'verified' =
    tier === 'verified' ? 'verified' : tier === 'suspended' ? 'unverified' : 'pending'
  const recordStatus: 'approved' | 'rejected' | 'pending' =
    tier === 'verified' ? 'approved' : tier === 'suspended' ? 'rejected' : 'pending'

  // Update profiles table adhering strictly to allowed constraint values
  const { error } = await db
    .from('profiles')
    .update({
      verification_tier: tier,
      verification_status: profileStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Profile verification update error:', error)
    return { success: false, message: error.message }
  }

  // Audit trail insertion in verification_records
  try {
    await db.from('verification_records').insert({
      user_id: userId,
      verification_type: 'email_identity',
      status: recordStatus,
      verified_at: tier === 'verified' ? new Date().toISOString() : null,
    })
  } catch (recErr) {
    console.warn('Audit record insert notice:', recErr)
  }

  return { success: true, message: `Successfully updated user verification to ${tier.toUpperCase()}` }
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
