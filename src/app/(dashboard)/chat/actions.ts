'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/lib/notifications'
import { getBlockedUserIds } from '../matches/actions'

export interface ChatThreadItem {
  id: string
  name: string
  age: number
  role: string
  locality: string
  city: string
  match: string
  harmonyScore: number
  budgetMin: number
  budgetMax: number
  avatarUrl: string | null
  verificationTier: string
  snippet: string
  unread: number
  lastMessageAt?: string
  otherUserId: string
}

export interface ChatMessageItem {
  id: string
  conversationId: string
  senderId: string
  isMe: boolean
  senderName: string
  senderAvatarUrl: string | null
  content: string
  time: string
  createdAt: string
  messageType: string
  isRead: boolean
}

/**
 * Helper to get DB client (falls back to admin if RLS policies restrict)
 */
async function getDbClient(): Promise<{ db: any; userClient: any }> {
  const supabase = await createClient()
  try {
    const admin = createAdminClient()
    if (admin) return { db: admin as any, userClient: supabase }
  } catch {
    // fallback
  }
  return { db: supabase as any, userClient: supabase }
}

/**
 * Get or create a conversation between logged-in user and target user
 */
export async function getOrCreateConversation(targetUserId: string): Promise<{
  conversationId: string | null
  otherUser?: {
    id: string
    fullName: string
    avatarUrl: string | null
    locality: string
    city: string
    occupation: string
    age: number
  } | null
  error?: string
}> {
  try {
    const { userClient, db } = await getDbClient()
    const { data: { user } } = await userClient.auth.getUser()

    if (!user) {
      return { conversationId: null, error: 'User not authenticated' }
    }

    if (user.id === targetUserId) {
      return { conversationId: null, error: 'Cannot create conversation with yourself' }
    }

    // Check if blocked
    const blockedIds = await getBlockedUserIds(user.id)
    if (blockedIds.includes(targetUserId)) {
      return { conversationId: null, error: 'This user is blocked' }
    }

    const [p1, p2] = user.id < targetUserId ? [user.id, targetUserId] : [targetUserId, user.id]

    // Fetch target user profile
    const { data: otherProfile } = await db
      .from('profiles')
      .select('id, full_name, avatar_url, locality, city, occupation, age')
      .eq('id', targetUserId)
      .maybeSingle()

    // 1. Check existing conversation
    const { data: existingConv } = await db
      .from('conversations')
      .select('id, last_message_preview, last_message_at')
      .eq('participant_one', p1)
      .eq('participant_two', p2)
      .maybeSingle()

    if (existingConv) {
      return {
        conversationId: existingConv.id,
        otherUser: otherProfile ? {
          id: otherProfile.id,
          fullName: otherProfile.full_name || 'YAARO Member',
          avatarUrl: otherProfile.avatar_url || null,
          locality: otherProfile.locality || 'Hinjewadi',
          city: otherProfile.city || 'Pune',
          occupation: otherProfile.occupation || 'Flatmate',
          age: otherProfile.age || 22,
        } : null,
      }
    }

    // 2. Create new conversation
    const { data: newConv, error: insertError } = await db
      .from('conversations')
      .insert({
        participant_one: p1,
        participant_two: p2,
        last_message_preview: 'Conversation started on YAARO.',
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error creating conversation:', insertError)
      return { conversationId: null, error: insertError.message }
    }

    return {
      conversationId: newConv.id,
      otherUser: otherProfile ? {
        id: otherProfile.id,
        fullName: otherProfile.full_name || 'YAARO Member',
        avatarUrl: otherProfile.avatar_url || null,
        locality: otherProfile.locality || 'Hinjewadi',
        city: otherProfile.city || 'Pune',
        occupation: otherProfile.occupation || 'Flatmate',
        age: otherProfile.age || 22,
      } : null,
    }
  } catch (err: any) {
    console.error('Error in getOrCreateConversation:', err)
    return { conversationId: null, error: err.message || 'Failed to initialize conversation' }
  }
}

/**
 * Get all conversations for current user with unread counts and participant details
 */
export async function getUserConversations(): Promise<ChatThreadItem[]> {
  try {
    const { userClient, db } = await getDbClient()
    const { data: { user } } = await userClient.auth.getUser()

    if (!user) return []

    const blockedIds = await getBlockedUserIds(user.id)

    // Fetch conversations where user is participant_one or participant_two
    const { data: convs, error } = await db
      .from('conversations')
      .select('id, participant_one, participant_two, last_message_preview, last_message_at, updated_at')
      .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error || !convs || convs.length === 0) {
      return []
    }

    const filteredConvs = convs.filter((c: any) => {
      const otherId = c.participant_one === user.id ? c.participant_two : c.participant_one
      return !blockedIds.includes(otherId)
    })

    if (filteredConvs.length === 0) return []

    const otherUserIds = filteredConvs.map((c: any) =>
      c.participant_one === user.id ? c.participant_two : c.participant_one
    )

    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name, age, occupation, city, locality, budget_min, budget_max, avatar_url, is_verified, company_or_college')
      .in('id', otherUserIds)

    const profileMap = new Map<string, any>()
    profiles?.forEach((p: any) => profileMap.set(p.id, p))

    // Count unread messages for current user per conversation
    const convIds = filteredConvs.map((c: any) => c.id)
    const { data: unreadRows } = await db
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds)
      .eq('is_read', false)
      .neq('sender_id', user.id)

    const unreadMap = new Map<string, number>()
    unreadRows?.forEach((r: any) => {
      unreadMap.set(r.conversation_id, (unreadMap.get(r.conversation_id) || 0) + 1)
    })

    return filteredConvs.map((c: any) => {
      const otherId = c.participant_one === user.id ? c.participant_two : c.participant_one
      const p = profileMap.get(otherId)

      let snippetText = c.last_message_preview || 'No messages yet.'
      if (snippetText.startsWith('{"type":"room_share"')) snippetText = '📍 Shared a verified room listing'
      else if (snippetText.startsWith('{"type":"profile_share"')) snippetText = '👤 Shared a flatmate dossier'
      else if (snippetText.startsWith('{"type":"compatibility_share"')) snippetText = '⚡ Shared chemistry breakdown'

      return {
        id: c.id,
        name: p?.full_name || 'YAARO Flatmate',
        age: p?.age || 24,
        role: p?.occupation || 'Co-Living Member',
        locality: p?.locality || 'Central Hub',
        city: p?.city || 'Pune',
        match: 'Verified Match',
        harmonyScore: 92,
        budgetMin: p?.budget_min || 12000,
        budgetMax: p?.budget_max || 25000,
        avatarUrl: p?.avatar_url || null,
        verificationTier: p?.is_verified ? 'Verified Member' : 'ID Confirmed',
        snippet: snippetText,
        unread: unreadMap.get(c.id) || 0,
        lastMessageAt: c.last_message_at || c.updated_at,
        otherUserId: otherId,
      }
    })
  } catch (err) {
    console.error('Error in getUserConversations:', err)
    return []
  }
}

/**
 * Fetch all messages for a specific conversation
 */
export async function getConversationMessages(conversationId: string): Promise<ChatMessageItem[]> {
  try {
    const { userClient, db } = await getDbClient()
    const { data: { user } } = await userClient.auth.getUser()

    if (!user) return []

    // 1. Fetch messages
    const { data: messages, error } = await db
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at, message_type, is_read')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error || !messages) return []

    // 2. Fetch sender profiles to attach names & avatars
    const senderIds = Array.from(new Set(messages.map((m: any) => m.sender_id)))
    const { data: senders } = await db
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', senderIds)

    const senderMap = new Map<string, any>()
    senders?.forEach((s: any) => senderMap.set(s.id, s))

    return messages.map((m: any) => {
      const s = senderMap.get(m.sender_id)
      const isMe = m.sender_id === user.id
      const date = new Date(m.created_at)
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      return {
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        isMe,
        senderName: isMe ? 'You' : (s?.full_name || 'Flatmate'),
        senderAvatarUrl: s?.avatar_url || null,
        content: m.content,
        time: timeStr,
        createdAt: m.created_at,
        messageType: m.message_type || 'text',
        isRead: Boolean(m.is_read),
      }
    })
  } catch (err) {
    console.error('Error in getConversationMessages:', err)
    return []
  }
}

/**
 * Mark all incoming messages in a conversation as read
 */
export async function markConversationAsRead(conversationId: string): Promise<boolean> {
  try {
    const { userClient, db } = await getDbClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return false

    await db
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false)

    return true
  } catch {
    return false
  }
}

/**
 * Send a chat message with database persistence, notifications, and block enforcement
 */
export async function sendChatMessage(
  conversationId: string,
  content: string,
  messageType: string = 'text'
): Promise<{ success: boolean; message?: ChatMessageItem; error?: string }> {
  try {
    const { userClient, db } = await getDbClient()
    const { data: { user } } = await userClient.auth.getUser()

    if (!user) {
      return { success: false, error: 'User not signed in' }
    }

    const trimmed = content.trim()
    if (!trimmed) {
      return { success: false, error: 'Message cannot be empty' }
    }

    // 1. Check conversation participants & blocking status
    const { data: conv } = await db
      .from('conversations')
      .select('participant_one, participant_two')
      .eq('id', conversationId)
      .single()

    if (!conv) {
      return { success: false, error: 'Conversation not found' }
    }

    const otherUserId = conv.participant_one === user.id ? conv.participant_two : conv.participant_one
    const blockedIds = await getBlockedUserIds(user.id)
    if (blockedIds.includes(otherUserId)) {
      return { success: false, error: 'Cannot send message. This user is blocked.' }
    }

    // 2. Insert message into messages table
    const { data: insertedMsg, error: insertError } = await db
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: trimmed,
        message_type: messageType,
        is_read: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting message:', insertError)
      return { success: false, error: insertError.message }
    }

    // 3. Update conversation last message preview and timestamp
    const nowIso = new Date().toISOString()
    let previewSnippet = trimmed.slice(0, 100)
    if (trimmed.startsWith('{"type":"room_share"')) previewSnippet = '📍 Shared a verified room listing'
    else if (trimmed.startsWith('{"type":"profile_share"')) previewSnippet = '👤 Shared a flatmate dossier'
    else if (trimmed.startsWith('{"type":"compatibility_share"')) previewSnippet = '⚡ Shared chemistry breakdown'

    await db
      .from('conversations')
      .update({
        last_message_preview: previewSnippet,
        last_message_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', conversationId)

    // 4. Fetch sender profile
    const { data: profile } = await db
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    const sName = profile?.full_name || 'Your flatmate'

    // 5. Trigger in-app notification for receiver
    await createNotification({
      userId: otherUserId,
      type: 'new_message',
      title: `New message from ${sName}`,
      body: previewSnippet,
      actionUrl: `/chat?user=${user.id}`,
    })

    const date = new Date(insertedMsg.created_at)
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const formattedMessage: ChatMessageItem = {
      id: insertedMsg.id,
      conversationId: insertedMsg.conversation_id,
      senderId: user.id,
      isMe: true,
      senderName: sName,
      senderAvatarUrl: profile?.avatar_url || null,
      content: insertedMsg.content,
      time: timeStr,
      createdAt: insertedMsg.created_at,
      messageType: insertedMsg.message_type,
      isRead: false,
    }

    revalidatePath('/chat')

    return { success: true, message: formattedMessage }
  } catch (err: any) {
    console.error('Error in sendChatMessage:', err)
    return { success: false, error: err.message || 'Failed to send message' }
  }
}

/**
 * Share a room listing into the chat as an interactive card
 */
export async function shareRoomListingAction(
  conversationId: string,
  listing: {
    id: string
    title: string
    locality: string
    city: string
    rentMonthly: number
    imageUrl?: string | null
  }
): Promise<{ success: boolean; message?: ChatMessageItem; error?: string }> {
  const payload = JSON.stringify({
    type: 'room_share',
    listing,
  })
  return sendChatMessage(conversationId, payload, 'text')
}

/**
 * Share a roommate profile into the chat as an interactive card
 */
export async function shareProfileCardAction(
  conversationId: string,
  profile: {
    id: string
    fullName: string
    occupation: string
    locality: string
    city: string
    harmonyScore: number
    avatarUrl?: string | null
  }
): Promise<{ success: boolean; message?: ChatMessageItem; error?: string }> {
  const payload = JSON.stringify({
    type: 'profile_share',
    profile,
  })
  return sendChatMessage(conversationId, payload, 'text')
}

/**
 * Share compatibility test result into the chat
 */
export async function shareCompatibilityAction(
  conversationId: string,
  harmonyScore: number,
  archetype: string,
  explanation: string
): Promise<{ success: boolean; message?: ChatMessageItem; error?: string }> {
  const payload = JSON.stringify({
    type: 'compatibility_share',
    harmonyScore,
    archetype,
    explanation,
  })
  return sendChatMessage(conversationId, payload, 'text')
}

/**
 * Generate a 1-page digital flatmate agreement and publish it to the chat
 */
export async function generateFlatAgreementAction(conversationId: string): Promise<{
  success: boolean
  agreementText: string
  error?: string
}> {
  try {
    const { userClient, db } = await getDbClient()
    const { data: { user } } = await userClient.auth.getUser()

    if (!user) return { success: false, agreementText: '', error: 'Not authenticated' }

    // Fetch conversation participants
    const { data: conv } = await db
      .from('conversations')
      .select('participant_one, participant_two')
      .eq('id', conversationId)
      .single()

    if (!conv) return { success: false, agreementText: '', error: 'Conversation not found' }

    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name, city, locality, budget_min, budget_max')
      .in('id', [conv.participant_one, conv.participant_two])

    const userProfile = profiles?.find((p: any) => p.id === user.id)
    const otherProfile = profiles?.find((p: any) => p.id !== user.id)

    const uName = userProfile?.full_name || 'Co-Liver A'
    const oName = otherProfile?.full_name || 'Co-Liver B'
    const city = userProfile?.city || otherProfile?.city || 'Pune'
    const locality = userProfile?.locality || otherProfile?.locality || 'Hinjewadi'
    const estRent = userProfile?.budget_min || 15000

    const agreementText = `YAARO CO-LIVING DOMESTIC COMPACT
Parties: ${uName} & ${oName}
Location: ${locality}, ${city}
Monthly Rent Contribution: ₹${estRent.toLocaleString()}/month per member
Deposit: 2 months refundable escrow
Key House Rules:
1. Quiet Hours: 11:00 PM - 7:00 AM on weekdays.
2. Kitchen Hygiene: Cookware cleaned immediately after meals.
3. Domestic Expenses: WiFi, water, and cook/maid bills split 50/50 via YAARO Ledger.
4. Guest Policy: Prior 12-hour notice for overnight visitors.
Signed electronically under YAARO Zero-Brokerage Living Charter.`

    // Insert proposal into chat
    await sendChatMessage(conversationId, agreementText, 'agreement_proposal')

    return { success: true, agreementText }
  } catch (err: any) {
    return { success: false, agreementText: '', error: err.message }
  }
}
