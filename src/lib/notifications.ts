'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type NotificationType =
  | 'new_like'
  | 'new_match'
  | 'new_message'
  | 'game_challenge'
  | 'compatibility_result'
  | 'room_activity'
  | 'flatmate_confirmed'
  | 'flat_setup_complete'
  | 'new_shared_expense'
  | 'expense_disputed'
  | 'settlement_received'
  | 'household_invitation'
  | 'member_joined_household'
  | 'new_household_expense'
  | 'household_settlement'
  | 'verification_approved'
  | 'verification_revoked'
  | 'account_suspended'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  actionUrl: string | null
  isRead: boolean
  createdAt: string
  timeAgo: string
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

function calculateTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffSec < 60) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

/**
 * Creates an in-app notification in Supabase
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  actionUrl,
}: {
  userId: string
  type: NotificationType
  title: string
  body: string
  actionUrl?: string
}): Promise<boolean> {
  try {
    const { db } = await getDb()

    const { error } = await db.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body,
      action_url: actionUrl || null,
      is_read: false,
    })

    if (error) {
      console.error('Error inserting notification:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Failed to create notification:', err)
    return false
  }
}

/**
 * Get all notifications for current authenticated user
 */
export async function getUserNotifications(): Promise<AppNotification[]> {
  try {
    const { db, user } = await getDb()
    if (!user) return []

    const { data, error } = await db
      .from('notifications')
      .select('id, user_id, type, title, body, action_url, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error || !data) return []

    return data.map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      body: n.body,
      actionUrl: n.action_url,
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
      timeAgo: calculateTimeAgo(n.created_at),
    }))
  } catch (err) {
    console.error('Error fetching user notifications:', err)
    return []
  }
}

/**
 * Mark a specific notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { db, user } = await getDb()
    if (!user) return false

    const { error } = await db
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) return false
    revalidatePath('/', 'layout')
    return true
  } catch {
    return false
  }
}

/**
 * Mark all notifications for current user as read
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const { db, user } = await getDb()
    if (!user) return false

    const { error } = await db
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) return false
    revalidatePath('/', 'layout')
    return true
  } catch {
    return false
  }
}

/**
 * Get count of unread notifications for current user
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const { db, user } = await getDb()
    if (!user) return 0

    const { count, error } = await db
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error || typeof count !== 'number') return 0
    return count
  } catch {
    return 0
  }
}
