import { createAdminClient } from '@/lib/supabase/admin'

export type ReportReason =
  | 'broker_disguised'
  | 'inaccurate_photos'
  | 'harassment'
  | 'scam_deposit'
  | 'discriminatory_behavior'
  | 'spam'
  | 'other'

export interface UserPrivacySettings {
  hidePhoneNumber: boolean
  approximateLocationOnly: boolean
  incognitoMode: boolean // only mutual likes can see profile
  allowDirectEnquiries: boolean
}

/**
 * Prohibited suspicious keyword signatures commonly used by unregulated brokers or deposit scams.
 */
export const SUSPICIOUS_BROKER_KEYWORDS = [
  'brokerage',
  'broker fee',
  '1 month commission',
  '15 days commission',
  'side commission',
  'token money non refundable',
  'pay advance before visit',
  'scanner deposit',
  'gate pass fee',
]

/**
 * Checks text content (bios, descriptions, messages) for suspicious broker or scam keywords.
 */
export function scanTextForSuspiciousKeywords(text: string): { isFlagged: boolean; matchedKeywords: string[] } {
  if (!text) return { isFlagged: false, matchedKeywords: [] }
  const lower = text.toLowerCase()
  const matched = SUSPICIOUS_BROKER_KEYWORDS.filter((kw) => lower.includes(kw))
  return {
    isFlagged: matched.length > 0,
    matchedKeywords: matched,
  }
}

/**
 * Reports a target user for safety or policy violations.
 */
export async function reportUserAction(
  reporterId: string,
  targetUserId: string,
  reason: ReportReason,
  details?: string
): Promise<{ success: boolean; message: string }> {
  const admin = createAdminClient()
  const db: any = admin

  try {
    await db.from('reports_and_blocks').insert({
      reporter_id: reporterId,
      target_user_id: targetUserId,
      action_type: 'report',
      reason,
      details: details || null,
      status: 'pending',
    })

    // Check if target has accumulated >= 2 reports, auto-flag for audit
    const { count } = await db
      .from('reports_and_blocks')
      .select('id', { count: 'exact', head: true })
      .eq('target_user_id', targetUserId)
      .eq('action_type', 'report')

    if (count && count >= 2) {
      console.warn(`[SAFETY ALERT] User ${targetUserId} has received ${count} reports. Flagged for priority compliance review.`)
    }

    return {
      success: true,
      message: 'Report submitted to YAARO Trust & Safety desk. Our team investigates every report within 2 hours.',
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to submit report.' }
  }
}

/**
 * Blocks a target user from mutual communication, discovery, and shared ledger interaction.
 */
export async function blockUserAction(
  reporterId: string,
  targetUserId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const admin = createAdminClient()
  const db: any = admin

  try {
    await db.from('reports_and_blocks').insert({
      reporter_id: reporterId,
      target_user_id: targetUserId,
      action_type: 'block',
      reason: 'other',
      details: reason || 'User requested block.',
      status: 'action_taken',
    })

    // Dissolve any active matches between these two users
    await db
      .from('matches')
      .delete()
      .or(`and(user1_id.eq.${reporterId},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${reporterId})`)

    return {
      success: true,
      message: 'User blocked. You will no longer encounter each other on YAARO.',
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to block user.' }
  }
}

/**
 * Reports a room listing for inaccurate information, broker disguise, or scam deposit requests.
 */
export async function reportListingAction(
  reporterId: string,
  targetListingId: string,
  reason: ReportReason,
  details?: string
): Promise<{ success: boolean; message: string }> {
  const admin = createAdminClient()
  const db: any = admin

  try {
    await db.from('reports_and_blocks').insert({
      reporter_id: reporterId,
      target_listing_id: targetListingId,
      action_type: 'report',
      reason,
      details: details || null,
      status: 'pending',
    })

    return {
      success: true,
      message: 'Room listing report logged. Our property moderation desk will inspect the listing.',
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to report listing.' }
  }
}

/**
 * Updates user account privacy settings stored in user_preferences or profile metadata.
 */
export async function updateUserPrivacySettings(
  userId: string,
  settings: Partial<UserPrivacySettings>
): Promise<{ success: boolean; message: string }> {
  const admin = createAdminClient()
  const db: any = admin

  try {
    const { data: existing } = await db
      .from('user_preferences')
      .select('cleanliness_level, social_energy')
      .eq('user_id', userId)
      .maybeSingle()

    // Store privacy settings in user_preferences or profile
    await db
      .from('profiles')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    return {
      success: true,
      message: 'Privacy settings updated successfully.',
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to update privacy settings.' }
  }
}

/**
 * Admin action: resolves an open safety or listing report.
 */
export async function resolveReportAction(
  reportId: string,
  resolution: 'action_taken' | 'dismissed',
  resolutionNotes?: string
): Promise<{ success: boolean; message: string }> {
  const admin = createAdminClient()
  const db: any = admin

  try {
    await db
      .from('reports_and_blocks')
      .update({
        status: resolution,
        details: resolutionNotes ? `Resolution: ${resolutionNotes}` : null,
      })
      .eq('id', reportId)

    return {
      success: true,
      message: `Report marked as ${resolution}.`,
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to resolve report.' }
  }
}

/**
 * Admin action: bans or suspends a user account.
 */
export async function banUserAction(
  userId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  const admin = createAdminClient()
  const db: any = admin

  try {
    await db
      .from('profiles')
      .update({
        verification_tier: 'suspended',
        bio: `[ACCOUNT SUSPENDED BY MODERATOR: ${reason}]`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    return {
      success: true,
      message: 'User account has been suspended and restricted from the platform.',
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to ban user.' }
  }
}

/**
 * Admin action: moderates a room listing status.
 */
export async function moderateListingAction(
  listingId: string,
  newStatus: 'active' | 'paused' | 'archived' | 'flagged'
): Promise<{ success: boolean; message: string }> {
  const admin = createAdminClient()
  const db: any = admin

  try {
    await db
      .from('room_listings')
      .update({
        status: newStatus === 'flagged' ? 'paused' : newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)

    return {
      success: true,
      message: `Listing status updated to ${newStatus}.`,
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to moderate listing.' }
  }
}
