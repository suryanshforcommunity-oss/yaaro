'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/lib/notifications'
import { getOrCreateConversation, sendChatMessage } from '../chat/actions'

export interface RoomListingItem {
  id: string
  title: string
  description: string
  city: string
  locality: string
  neighborhoodVibe: string
  rentMonthly: number
  securityDeposit: number
  maintenanceMonthly: number
  roomType: 'private' | 'shared'
  attachedBathroom: boolean
  balconyAvailable: boolean
  furnishedType: 'unfurnished' | 'semi_furnished' | 'fully_furnished'
  amenities: string[]
  houseRules: string[]
  preferredGender: string
  isVerifiedFlat: boolean
  status: 'active' | 'under_review' | 'paused' | 'rented_out'
  createdAt: string
  images: string[]
  isSaved?: boolean
  host: {
    id: string
    fullName: string
    avatarUrl: string | null
    occupation: string
    city: string
    locality: string
  }
}

export interface RoomFilters {
  city?: string
  locality?: string
  budgetMin?: number
  budgetMax?: number
  furnishing?: string
  roomType?: string
  amenities?: string[]
  gender?: string
}

export interface CreateRoomListingInput {
  title: string
  description: string
  city: string
  locality: string
  neighborhoodVibe?: string
  rentMonthly: number
  securityDeposit: number
  maintenanceMonthly?: number
  roomType: 'private' | 'shared'
  attachedBathroom: boolean
  balconyAvailable: boolean
  furnishedType: 'unfurnished' | 'semi_furnished' | 'fully_furnished'
  amenities: string[]
  houseRules: string[]
  preferredGender: 'any' | 'male' | 'female'
  images: string[]
}

async function getDb(): Promise<{ db: any; userClient: any; user: any }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  try {
    const admin = createAdminClient()
    if (admin) return { db: admin as any, userClient: supabase, user }
  } catch {
    // fallback
  }
  return { db: supabase as any, userClient: supabase, user }
}

const DEFAULT_ROOM_IMAGES: Record<string, string[]> = {
  pune: [
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  ],
  bengaluru: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
  ],
  mumbai: [
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  ],
}

const OLD_SEED_TITLES = [
  'Sunlit Master Bedroom in Blue Ridge 3BHK',
  'Modern Minimalist 2BHK on Balewadi High Street',
  'Sunlit 3BHK Penthouse in Indiranagar 12th Main',
  'Minimalist 2BHK in Koramangala 4th Block',
]

/**
 * Fetch all verified room listings matching filters
 */
export async function getRoomListings(filters?: RoomFilters): Promise<RoomListingItem[]> {
  try {
    const { db, user } = await getDb()

    // Clean up any old artificial seed data from database
    try {
      await db.from('room_listings').delete().in('title', OLD_SEED_TITLES)
    } catch {
      // ignore
    }

    let query = db
      .from('room_listings')
      .select('*, host:profiles(id, full_name, avatar_url, occupation, city, locality)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (filters?.city && filters.city !== 'ALL') {
      query = query.ilike('city', `%${filters.city}%`)
    }

    if (filters?.furnishing && filters.furnishing !== 'all') {
      query = query.eq('furnished_type', filters.furnishing)
    }

    if (filters?.roomType && filters.roomType !== 'all') {
      query = query.eq('room_type', filters.roomType)
    }

    if (filters?.gender && filters.gender !== 'any') {
      query = query.in('preferred_gender', [filters.gender, 'any'])
    }

    if (filters?.budgetMin) {
      query = query.gte('rent_monthly', filters.budgetMin)
    }

    if (filters?.budgetMax) {
      query = query.lte('rent_monthly', filters.budgetMax)
    }

    const { data: listings, error } = await query

    if (error || !listings) {
      console.error('Error fetching room listings:', error)
      return []
    }

    // Get user saved listings
    let savedIds: string[] = []
    if (user?.id) {
      const { data: saved } = await db
        .from('saved_listings')
        .select('listing_id')
        .eq('user_id', user.id)
      if (saved) savedIds = saved.map((s: any) => s.listing_id)
    }

    let parsedListings: RoomListingItem[] = listings.map((l: any) => {
      let imagesList: string[] = []
      let vibeText = l.neighborhood_vibe || 'Verified Shared Living'

      if (l.neighborhood_vibe && l.neighborhood_vibe.startsWith('{')) {
        try {
          const parsed = JSON.parse(l.neighborhood_vibe)
          if (Array.isArray(parsed.images) && parsed.images.length > 0) {
            imagesList = parsed.images
          }
          if (parsed.vibe) vibeText = parsed.vibe
        } catch {
          // ignore
        }
      }

      if (imagesList.length === 0) {
        const cityKey = (l.city || 'pune').toLowerCase()
        imagesList = DEFAULT_ROOM_IMAGES[cityKey] || DEFAULT_ROOM_IMAGES.pune
      }

      const hostData = l.host || {
        id: l.host_user_id,
        fullName: 'YAARO Verified Host',
        avatarUrl: null,
        occupation: 'Verified Co-Liver',
        city: l.city,
        locality: l.locality,
      }

      return {
        id: l.id,
        title: l.title,
        description: l.description,
        city: l.city,
        locality: l.locality,
        neighborhoodVibe: vibeText,
        rentMonthly: Number(l.rent_monthly),
        securityDeposit: Number(l.security_deposit),
        maintenanceMonthly: Number(l.maintenance_monthly || 0),
        roomType: l.room_type,
        attachedBathroom: Boolean(l.attached_bathroom),
        balconyAvailable: Boolean(l.balcony_available),
        furnishedType: l.furnished_type,
        amenities: l.amenities || [],
        houseRules: l.house_rules || [],
        preferredGender: l.preferred_gender,
        isVerifiedFlat: Boolean(l.is_verified_flat),
        status: l.status,
        createdAt: l.created_at,
        images: imagesList,
        isSaved: savedIds.includes(l.id),
        host: {
          id: hostData.id,
          fullName: hostData.full_name || 'YAARO Host',
          avatarUrl: hostData.avatar_url || null,
          occupation: hostData.occupation || 'Host Member',
          city: hostData.city || l.city,
          locality: hostData.locality || l.locality,
        },
      }
    })

    // Filter locality client-side if text entered
    if (filters?.locality && filters.locality.trim() !== '' && filters.locality !== 'ALL') {
      const q = filters.locality.toLowerCase().trim()
      parsedListings = parsedListings.filter(
        (l) => l.locality.toLowerCase().includes(q) || l.title.toLowerCase().includes(q)
      )
    }

    // Filter amenities multi-select client-side
    if (filters?.amenities && filters.amenities.length > 0) {
      parsedListings = parsedListings.filter((l) =>
        filters.amenities!.every((a) => l.amenities.some((la) => la.toLowerCase().includes(a.toLowerCase())))
      )
    }

    return parsedListings
  } catch (err) {
    console.error('Error in getRoomListings:', err)
    return []
  }
}

/**
 * Publish a new room listing
 */
export async function createRoomListing(input: CreateRoomListingInput): Promise<{
  success: boolean
  listingId?: string
  error?: string
}> {
  try {
    const { db, user } = await getDb()
    if (!user) return { success: false, error: 'Please sign in to publish a listing.' }

    if (!input.title.trim() || !input.locality.trim() || !input.city.trim()) {
      return { success: false, error: 'Please provide title, locality, and city.' }
    }

    if (input.rentMonthly <= 0) {
      return { success: false, error: 'Monthly rent must be greater than zero.' }
    }

    // Auto-cap deposit at 2 months as per YAARO standard if entered too high
    const maxDeposit = input.rentMonthly * 2
    const finalDeposit = Math.min(input.securityDeposit || maxDeposit, maxDeposit)

    // Store images array & vibe inside neighborhood_vibe JSON
    const vibeJson = JSON.stringify({
      vibe: input.neighborhoodVibe || `${input.locality} Co-Living Hub`,
      images: input.images.length > 0 ? input.images : DEFAULT_ROOM_IMAGES.pune,
    })

    const { data: newListing, error } = await db
      .from('room_listings')
      .insert({
        host_user_id: user.id,
        title: input.title.trim(),
        description: input.description.trim(),
        city: input.city.trim(),
        locality: input.locality.trim(),
        neighborhood_vibe: vibeJson,
        rent_monthly: input.rentMonthly,
        security_deposit: finalDeposit,
        maintenance_monthly: input.maintenanceMonthly || 0,
        room_type: input.roomType || 'private',
        attached_bathroom: input.attachedBathroom,
        balcony_available: input.balconyAvailable,
        furnished_type: input.furnishedType,
        amenities: input.amenities,
        house_rules: input.houseRules,
        preferred_gender: input.preferredGender,
        is_verified_flat: true,
        status: 'active',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error inserting room listing:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/rooms')

    return { success: true, listingId: newListing.id }
  } catch (err: any) {
    console.error('Failed to create room listing:', err)
    return { success: false, error: err.message || 'Failed to publish listing.' }
  }
}

/**
 * Fetch listings published by current user
 */
export async function getUserMyListings(): Promise<RoomListingItem[]> {
  try {
    const { db, user } = await getDb()
    if (!user) return []

    const { data: listings, error } = await db
      .from('room_listings')
      .select('*, host:profiles(id, full_name, avatar_url, occupation, city, locality)')
      .eq('host_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !listings) return []

    return listings.map((l: any) => {
      let imagesList: string[] = []
      let vibeText = l.neighborhood_vibe || 'Verified Shared Living'

      if (l.neighborhood_vibe && l.neighborhood_vibe.startsWith('{')) {
        try {
          const parsed = JSON.parse(l.neighborhood_vibe)
          if (Array.isArray(parsed.images) && parsed.images.length > 0) {
            imagesList = parsed.images
          }
          if (parsed.vibe) vibeText = parsed.vibe
        } catch {
          // ignore
        }
      }

      if (imagesList.length === 0) {
        imagesList = DEFAULT_ROOM_IMAGES.pune
      }

      return {
        id: l.id,
        title: l.title,
        description: l.description,
        city: l.city,
        locality: l.locality,
        neighborhoodVibe: vibeText,
        rentMonthly: Number(l.rent_monthly),
        securityDeposit: Number(l.security_deposit),
        maintenanceMonthly: Number(l.maintenance_monthly || 0),
        roomType: l.room_type,
        attachedBathroom: Boolean(l.attached_bathroom),
        balconyAvailable: Boolean(l.balcony_available),
        furnishedType: l.furnished_type,
        amenities: l.amenities || [],
        houseRules: l.house_rules || [],
        preferredGender: l.preferred_gender,
        isVerifiedFlat: Boolean(l.is_verified_flat),
        status: l.status,
        createdAt: l.created_at,
        images: imagesList,
        host: {
          id: user.id,
          fullName: 'You',
          avatarUrl: null,
          occupation: 'Host',
          city: l.city,
          locality: l.locality,
        },
      }
    })
  } catch (err) {
    console.error('Error fetching user room listings:', err)
    return []
  }
}

/**
 * Update an existing room listing
 */
export async function updateRoomListing(
  listingId: string,
  input: Partial<CreateRoomListingInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { db, user } = await getDb()
    if (!user) return { success: false, error: 'Not authenticated' }

    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (input.title) updates.title = input.title.trim()
    if (input.description) updates.description = input.description.trim()
    if (input.city) updates.city = input.city.trim()
    if (input.locality) updates.locality = input.locality.trim()
    if (input.rentMonthly) updates.rent_monthly = input.rentMonthly
    if (input.securityDeposit) updates.security_deposit = input.securityDeposit
    if (input.roomType) updates.room_type = input.roomType
    if (input.furnishedType) updates.furnished_type = input.furnishedType
    if (input.attachedBathroom !== undefined) updates.attached_bathroom = input.attachedBathroom
    if (input.balconyAvailable !== undefined) updates.balcony_available = input.balconyAvailable
    if (input.amenities) updates.amenities = input.amenities
    if (input.houseRules) updates.house_rules = input.houseRules

    if (input.images && input.images.length > 0) {
      updates.neighborhood_vibe = JSON.stringify({
        vibe: input.neighborhoodVibe || `${input.locality || 'Verified'} Corridor`,
        images: input.images,
      })
    }

    const { error } = await db
      .from('room_listings')
      .update(updates)
      .eq('id', listingId)
      .eq('host_user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/rooms')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Delete a room listing
 */
export async function deleteRoomListing(listingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { db, user } = await getDb()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await db
      .from('room_listings')
      .delete()
      .eq('id', listingId)
      .eq('host_user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/rooms')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Toggle room status between active and rented_out
 */
export async function toggleRoomAvailability(
  listingId: string,
  currentStatus: string
): Promise<{ success: boolean; newStatus: string }> {
  try {
    const { db, user } = await getDb()
    if (!user) return { success: false, newStatus: currentStatus }

    const newStatus = currentStatus === 'active' ? 'rented_out' : 'active'

    await db
      .from('room_listings')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', listingId)
      .eq('host_user_id', user.id)

    revalidatePath('/rooms')
    return { success: true, newStatus }
  } catch {
    return { success: false, newStatus: currentStatus }
  }
}

/**
 * Toggle bookmarking a room listing
 */
export async function toggleSaveRoomListing(listingId: string): Promise<{ isSaved: boolean }> {
  try {
    const { db, user } = await getDb()
    if (!user) return { isSaved: false }

    const { data: existing } = await db
      .from('saved_listings')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .maybeSingle()

    if (existing) {
      await db.from('saved_listings').delete().eq('id', existing.id)
      revalidatePath('/rooms')
      return { isSaved: false }
    } else {
      await db.from('saved_listings').insert({
        user_id: user.id,
        listing_id: listingId,
      })
      revalidatePath('/rooms')
      return { isSaved: true }
    }
  } catch {
    return { isSaved: false }
  }
}

/**
 * Send in-app enquiry to room host with rich card and chat dispatch
 */
export async function sendRoomEnquiryAction(
  listingId: string,
  hostUserId: string,
  message: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    const { db, user } = await getDb()
    if (!user) return { success: false, error: 'Please sign in to send an enquiry.' }

    if (user.id === hostUserId) {
      return { success: false, error: 'You are the host of this listing.' }
    }

    // 1. Get room listing details
    const { data: listing } = await db
      .from('room_listings')
      .select('id, title, locality, city, rent_monthly, neighborhood_vibe')
      .eq('id', listingId)
      .single()

    if (!listing) return { success: false, error: 'Room listing not found.' }

    // Parse image
    let roomImage = DEFAULT_ROOM_IMAGES.pune[0]
    if (listing.neighborhood_vibe && listing.neighborhood_vibe.startsWith('{')) {
      try {
        const parsed = JSON.parse(listing.neighborhood_vibe)
        if (parsed.images && parsed.images[0]) roomImage = parsed.images[0]
      } catch {
        // ignore
      }
    }

    // 2. Get or create conversation with host
    const convRes = await getOrCreateConversation(hostUserId)
    if (!convRes.conversationId) {
      return { success: false, error: 'Failed to initiate conversation with host.' }
    }

    const conversationId = convRes.conversationId

    // 3. Post room share card into chat
    const roomPayload = JSON.stringify({
      type: 'room_share',
      listing: {
        id: listing.id,
        title: listing.title,
        locality: listing.locality,
        city: listing.city,
        rentMonthly: Number(listing.rent_monthly),
        imageUrl: roomImage,
      },
    })
    await sendChatMessage(conversationId, roomPayload, 'text')

    // 4. Post user's inquiry message
    const inquiryText = message.trim() || 'Hi! I saw your room listing on YAARO and would love to know if it is available for a walkthrough.'
    await sendChatMessage(conversationId, inquiryText, 'text')

    // 5. Send notification to host
    const { data: senderProfile } = await db
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()
    const sName = senderProfile?.full_name || 'A verified co-liver'

    await createNotification({
      userId: hostUserId,
      type: 'room_activity',
      title: `New Room Enquiry from ${sName}`,
      body: `Enquiry for ${listing.title}: "${inquiryText.slice(0, 60)}..."`,
      actionUrl: `/chat?user=${user.id}`,
    })

    return { success: true, conversationId }
  } catch (err: any) {
    console.error('Error in sendRoomEnquiryAction:', err)
    return { success: false, error: err.message || 'Failed to send room enquiry.' }
  }
}

/**
 * Report suspicious room listing for community protection
 */
export async function reportSuspiciousListingAction(
  listingId: string,
  reason: string,
  details?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { db, user } = await getDb()
    if (!user) return { success: false, message: 'Please sign in to report a listing.' }

    await db.from('reports_and_blocks').insert({
      reporter_id: user.id,
      target_listing_id: listingId,
      action_type: 'report',
      reason: reason || 'Suspicious listing or broker solicitation',
      details: details || null,
      status: 'pending',
    })

    return {
      success: true,
      message: 'Listing reported. Our zero-brokerage verification team will review it immediately.',
    }
  } catch (err: any) {
    console.error('Error reporting listing:', err)
    return { success: false, message: err.message || 'Failed to submit report.' }
  }
}
