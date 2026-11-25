'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type PreferencesRow = Database['public']['Tables']['user_preferences']['Row']

interface CurrentUserSessionData {
  isAuthenticated: boolean
  user: {
    id: string
    email?: string
    phone?: string
  } | null
  profile: (ProfileRow & { instagram_handle?: string; linkedin_handle?: string }) | null
  preferences: PreferencesRow | null
  displayName: string
}

export type { ProfileRow, PreferencesRow, CurrentUserSessionData }

/**
 * Fetch the currently authenticated user's real Supabase profile & preferences
 */
export async function getCurrentUserSessionData(): Promise<CurrentUserSessionData> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        isAuthenticated: false,
        user: null,
        profile: null,
        preferences: null,
        displayName: 'Guest Co-Liver',
      }
    }

    // Use admin client for reading profile & preferences to bypass RLS latency
    let db = supabase
    try {
      const admin = createAdminClient()
      if (admin) db = admin as any
    } catch {
      // fallback to session client
    }

    // Fetch profile from public.profiles
    const { data: profile } = await (db.from('profiles') as any)
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    // Fetch preferences from public.user_preferences
    const { data: preferences } = await (db.from('user_preferences') as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Determine clean display name
    const rawName =
      (profile as any)?.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      user.phone ||
      'YAARO Member'

    // Resilient effective profile: ensure authenticated users ALWAYS have a populated profile
    let insta = (profile as any)?.instagram_handle || ''
    let linkedin = (profile as any)?.linkedin_handle || ''
    if (!insta || !linkedin) {
      try {
        if (profile?.preferred_location && profile.preferred_location.startsWith('{')) {
          const parsed = JSON.parse(profile.preferred_location)
          if (!insta) insta = parsed.instagram || ''
          if (!linkedin) linkedin = parsed.linkedin || ''
        }
      } catch {}
    }

    const effectiveProfile: ProfileRow & { instagram_handle?: string; linkedin_handle?: string } = (profile as any) || {
      id: user.id,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      full_name: rawName,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      age: 22,
      gender: null,
      occupation: 'Co-Living Member',
      company_or_college: null,
      city: 'Pune',
      locality: 'Hinjewadi phase 1',
      budget_min: 10000,
      budget_max: 25000,
      move_in_date: null,
      bio: `New YAARO member exploring verified living spaces.`,
      is_looking_for_room: true,
      is_looking_for_roommate: true,
      profile_completed_percentage: 25,
      verification_tier: user.email ? 'basic_email' : 'unverified',
      is_profile_public: true,
      onboarded: false,
    }

    effectiveProfile.instagram_handle = insta
    effectiveProfile.linkedin_handle = linkedin

    return {
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
      },
      profile: effectiveProfile,
      preferences: preferences || null,
      displayName: rawName,
    }
  } catch (err) {
    console.error('Error fetching current user session data:', err)
    return {
      isAuthenticated: false,
      user: null,
      profile: null,
      preferences: null,
      displayName: 'YAARO Member',
    }
  }
}

/**
 * Update authenticated user's primary profile in Supabase
 */
export async function updateCurrentUserProfile(
  payload: Partial<ProfileRow> & { instagram_handle?: string; linkedin_handle?: string }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized: Please log in first' }
    }

    let db: any = supabase
    try {
      const admin = createAdminClient()
      if (admin) db = admin
    } catch {
      // fallback
    }

    // Persist social handles seamlessly
    const socialPayload: Record<string, any> = { ...payload }

    // If preferred_location can store json fallback for socials:
    if (payload.instagram_handle !== undefined || payload.linkedin_handle !== undefined) {
      try {
        const { data: currentP } = await db.from('profiles').select('preferred_location').eq('id', user.id).maybeSingle()
        let existingMeta: Record<string, any> = {}
        if (currentP?.preferred_location && currentP.preferred_location.startsWith('{')) {
          existingMeta = JSON.parse(currentP.preferred_location)
        }
        if (payload.instagram_handle !== undefined) existingMeta.instagram = payload.instagram_handle
        if (payload.linkedin_handle !== undefined) existingMeta.linkedin = payload.linkedin_handle
        socialPayload.preferred_location = JSON.stringify(existingMeta)
      } catch {
        // fallback
      }
    }

    const { error } = await db.from('profiles').upsert({
      id: user.id,
      ...socialPayload,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error updating profile in DB:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error in updateCurrentUserProfile:', err)
    return { success: false, error: err?.message || 'Failed to update profile' }
  }
}

/**
 * Uploads a profile avatar image securely and links it to user's profile
 */
export async function uploadProfileAvatar(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File | null
    if (!file) {
      return { success: false, error: 'No image file provided' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Please sign in to upload photos' }
    }

    let db: any = supabase
    try {
      const admin = createAdminClient()
      if (admin) db = admin
    } catch {
      // fallback
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const mimeType = file.type || (fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg')
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await db.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { success: false, error: uploadError.message }
    }

    const { data: { publicUrl } } = db.storage.from('avatars').getPublicUrl(fileName)

    // Save avatar_url to public.profiles directly
    await db.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)

    return { success: true, url: publicUrl }
  } catch (err: any) {
    console.error('Error in uploadProfileAvatar:', err)
    return { success: false, error: err?.message || 'Failed to upload photo' }
  }
}

/**
 * Update authenticated user's living preferences in Supabase
 */
export async function updateCurrentUserPreferences(payload: Partial<PreferencesRow>) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized: Please log in first' }
    }

    const { error } = await (supabase.from('user_preferences') as any).upsert({
      user_id: user.id,
      ...payload,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update preferences' }
  }
}
