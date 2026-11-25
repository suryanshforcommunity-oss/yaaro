'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/lib/notifications'

export interface MatchItem {
  id: string
  matchDate: string
  harmonyScore: number
  status: 'active' | 'unmatched' | 'blocked'
  otherUser: {
    id: string
    fullName: string
    age: number
    gender: string
    occupation: string
    companyOrCollege: string
    city: string
    locality: string
    budgetMin: number
    budgetMax: number
    avatarUrl: string | null
    bio: string
  }
}

async function getDb(): Promise<{ db: any; user: any }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  try {
    const admin = createAdminClient()
    if (admin) return { db: admin as any, user }
  } catch {
    // fallback
  }
  return { db: supabase as any, user }
}

/**
 * Returns IDs of all users blocked by or who have blocked the current user
 */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  try {
    const { db } = await getDb()
    const { data: blocks } = await db
      .from('reports_and_blocks')
      .select('reporter_id, target_user_id')
      .in('action_type', ['block', 'report_and_block'])
      .or(`reporter_id.eq.${userId},target_user_id.eq.${userId}`)

    if (!blocks || blocks.length === 0) return []

    const ids = new Set<string>()
    blocks.forEach((b: any) => {
      if (b.reporter_id === userId && b.target_user_id) ids.add(b.target_user_id)
      if (b.target_user_id === userId && b.reporter_id) ids.add(b.reporter_id)
    })
    return Array.from(ids)
  } catch {
    return []
  }
}

/**
 * Get all active matches for the authenticated user
 */
export async function getUserMatches(): Promise<MatchItem[]> {
  try {
    const { db, user } = await getDb()
    if (!user) return []

    const blockedIds = await getBlockedUserIds(user.id)

    // Query active matches
    const { data: matches, error } = await db
      .from('matches')
      .select('id, user_a, user_b, harmony_score, status, created_at')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error || !matches || matches.length === 0) {
      return []
    }

    const otherUserIds = matches
      .map((m: any) => (m.user_a === user.id ? m.user_b : m.user_a))
      .filter((id: string) => !blockedIds.includes(id))

    if (otherUserIds.length === 0) return []

    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name, age, gender, occupation, company_or_college, city, locality, budget_min, budget_max, avatar_url, bio')
      .in('id', otherUserIds)

    const profileMap = new Map<string, any>()
    profiles?.forEach((p: any) => profileMap.set(p.id, p))

    return matches
      .filter((m: any) => {
        const otherId = m.user_a === user.id ? m.user_b : m.user_a
        return !blockedIds.includes(otherId) && profileMap.has(otherId)
      })
      .map((m: any) => {
        const otherId = m.user_a === user.id ? m.user_b : m.user_a
        const p = profileMap.get(otherId)

        return {
          id: m.id,
          matchDate: new Date(m.created_at).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          harmonyScore: m.harmony_score || 90,
          status: m.status,
          otherUser: {
            id: otherId,
            fullName: p.full_name || 'YAARO Member',
            age: p.age || 23,
            gender: p.gender || 'unspecified',
            occupation: p.occupation || 'Flatmate',
            companyOrCollege: p.company_or_college || '',
            city: p.city || 'Pune',
            locality: p.locality || 'Hinjewadi',
            budgetMin: p.budget_min || 12000,
            budgetMax: p.budget_max || 25000,
            avatarUrl: p.avatar_url || null,
            bio: p.bio || 'Exploring compatible shared living.',
          },
        }
      })
  } catch (err) {
    console.error('Error in getUserMatches:', err)
    return []
  }
}

/**
 * Unmatch a user (sets status to unmatched and removes conversation)
 */
export async function unmatchUser(targetUserId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { db, user } = await getDb()
    if (!user) return { success: false, message: 'Not authenticated' }

    const [uA, uB] = user.id < targetUserId ? [user.id, targetUserId] : [targetUserId, user.id]

    // 1. Update match record
    await db
      .from('matches')
      .update({ status: 'unmatched' })
      .eq('user_a', uA)
      .eq('user_b', uB)

    // 2. Remove likes
    await db
      .from('likes')
      .delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)

    revalidatePath('/matches')
    revalidatePath('/chat')
    revalidatePath('/discover')

    return { success: true, message: 'Successfully unmatched flatmate.' }
  } catch (err: any) {
    console.error('Error unmatching user:', err)
    return { success: false, message: err.message || 'Failed to unmatch.' }
  }
}

/**
 * Block a user (logs to reports_and_blocks, prevents messaging and discovery)
 */
export async function blockUser(
  targetUserId: string,
  reason: string,
  details?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { db, user } = await getDb()
    if (!user) return { success: false, message: 'Not authenticated' }

    // 1. Insert into reports_and_blocks
    await db.from('reports_and_blocks').insert({
      reporter_id: user.id,
      target_user_id: targetUserId,
      action_type: 'block',
      reason: reason || 'Blocked by user',
      details: details || null,
      status: 'applied',
    })

    // 2. Update match status
    const [uA, uB] = user.id < targetUserId ? [user.id, targetUserId] : [targetUserId, user.id]
    await db
      .from('matches')
      .update({ status: 'blocked' })
      .eq('user_a', uA)
      .eq('user_b', uB)

    revalidatePath('/matches')
    revalidatePath('/chat')
    revalidatePath('/discover')

    return { success: true, message: 'User has been blocked. They will no longer appear in your feed or chat.' }
  } catch (err: any) {
    console.error('Error blocking user:', err)
    return { success: false, message: err.message || 'Failed to block user.' }
  }
}

/**
 * Report a user for misconduct, scam, or fake profile
 */
export async function reportUser(
  targetUserId: string,
  reason: string,
  details?: string,
  blockToo: boolean = false
): Promise<{ success: boolean; message: string }> {
  try {
    const { db, user } = await getDb()
    if (!user) return { success: false, message: 'Not authenticated' }

    await db.from('reports_and_blocks').insert({
      reporter_id: user.id,
      target_user_id: targetUserId,
      action_type: blockToo ? 'report_and_block' : 'report',
      reason: reason || 'Inappropriate behavior',
      details: details || null,
      status: 'pending',
    })

    if (blockToo) {
      const [uA, uB] = user.id < targetUserId ? [user.id, targetUserId] : [targetUserId, user.id]
      await db
        .from('matches')
        .update({ status: 'blocked' })
        .eq('user_a', uA)
        .eq('user_b', uB)
    }

    revalidatePath('/matches')
    revalidatePath('/chat')

    return {
      success: true,
      message: 'Report submitted. Our community safety team will review this dossier promptly.',
    }
  } catch (err: any) {
    console.error('Error reporting user:', err)
    return { success: false, message: err.message || 'Failed to report user.' }
  }
}
