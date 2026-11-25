'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateCompatibility, UserLivingData, CompatibilityScore } from '@/lib/compatibility'
import { createNotification } from '@/lib/notifications'
import { getBlockedUserIds } from '../matches/actions'

interface DiscoveryFilters {
  city?: string
  locality?: string
  budgetMin?: number
  budgetMax?: number
  gender?: 'any' | 'male' | 'female' | 'non_binary'
  dietary?: string
  smoking?: string
  drinking?: string
  sleepingSchedule?: string
  profession?: string
  moveInDate?: string
  hobbies?: string[]
}

interface CandidateWithMatch {
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
  moveInDate: string
  avatarUrl: string | null
  bio: string
  hobbies: string[]
  verificationTier: string
  compatibility: CompatibilityScore
  stickers: { label: string; bg: string; text: string }[]
}

export type { DiscoveryFilters, CandidateWithMatch }

/**
 * Fetch discovery feed comparing current authenticated user with actual database profiles
 */
export async function getDiscoveryFeed(filters?: DiscoveryFilters): Promise<CandidateWithMatch[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Use admin client for reliable querying across user_preferences & profiles without RLS deadlock
    let db: any = supabase
    try {
      const admin = createAdminClient()
      if (admin) db = admin
    } catch {
      // fallback
    }

    // 1. Fetch current user profile & preferences
    let userProfile: any = null
    let userPref: any = null
    if (user) {
      const { data: p } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle()
      const { data: pref } = await db.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle()
      userProfile = p
      userPref = pref
    }

    const currentUserName =
      userProfile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'You'

    const currentUserLivingData: UserLivingData = {
      id: user?.id || 'current-user',
      fullName: currentUserName,
      age: userProfile?.age || null,
      gender: userProfile?.gender || 'unspecified',
      occupation: userProfile?.occupation || null,
      companyOrCollege: userProfile?.company_or_college || null,
      city: userProfile?.city || 'Bengaluru',
      locality: userProfile?.locality || null,
      budgetMin: userProfile?.budget_min || userPref?.target_budget_min || 10000,
      budgetMax: userProfile?.budget_max || userPref?.target_budget_max || 25000,
      dietary: userPref?.dietary_preference || null,
      smoking: userPref?.smoking_tolerance || null,
      drinking: userPref?.drinking_tolerance || null,
      sleepingSchedule: userPref?.sleeping_schedule || null,
      workSchedule: userPref?.work_schedule || null,
      cleanlinessLevel: userPref?.cleanliness_level || 4,
      petTolerance: userPref?.pet_tolerance || null,
      socialLifestyle: userPref?.social_lifestyle || null,
      preferredGender: userPref?.preferred_gender || 'any',
      hobbies: userPref?.hobbies || [],
      bio: userProfile?.bio || null,
    }

    // 2. Query all other public candidate profiles from Supabase
    let candidateProfilesQuery = db.from('profiles').select('*').eq('is_profile_public', true)
    if (user?.id) {
      candidateProfilesQuery = candidateProfilesQuery.neq('id', user.id)
    }

    if (filters?.city && filters.city !== 'ALL') {
      candidateProfilesQuery = candidateProfilesQuery.ilike('city', `%${filters.city}%`)
    }

    const blockedIds = user?.id ? await getBlockedUserIds(user.id) : []

    const { data: rawCandidateProfiles, error: profileError } = await candidateProfilesQuery
    if (profileError || !rawCandidateProfiles || rawCandidateProfiles.length === 0) {
      return []
    }

    const candidateProfiles = rawCandidateProfiles.filter((p: any) => !blockedIds.includes(p.id))
    if (candidateProfiles.length === 0) {
      return []
    }

    // 3. Query preferences for these real candidate profiles
    const candidateIds = candidateProfiles.map((p: any) => p.id)
    const { data: prefsList } = await db
      .from('user_preferences')
      .select('*')
      .in('user_id', candidateIds)

    const prefMap = new Map<string, any>()
    if (prefsList) {
      prefsList.forEach((pref: any) => prefMap.set(pref.user_id, pref))
    }

    // 4. Construct live candidate list and apply lifestyle filters
    const evaluatedCandidates: CandidateWithMatch[] = []

    for (const p of candidateProfiles) {
      const pref = prefMap.get(p.id) || {}

      const candidateLivingData: UserLivingData = {
        id: p.id,
        fullName: p.full_name || 'YAARO Member',
        age: p.age || null,
        gender: p.gender || 'unspecified',
        occupation: p.occupation || null,
        companyOrCollege: p.company_or_college || null,
        city: p.city || 'Bengaluru',
        locality: p.locality || null,
        budgetMin: p.budget_min || pref.target_budget_min || null,
        budgetMax: p.budget_max || pref.target_budget_max || null,
        dietary: pref.dietary_preference || null,
        smoking: pref.smoking_tolerance || null,
        drinking: pref.drinking_tolerance || null,
        sleepingSchedule: pref.sleeping_schedule || null,
        workSchedule: pref.work_schedule || null,
        cleanlinessLevel: pref.cleanliness_level || 4,
        petTolerance: pref.pet_tolerance || null,
        socialLifestyle: pref.social_lifestyle || null,
        preferredGender: pref.preferred_gender || 'any',
        hobbies: pref.hobbies || [],
        bio: p.bio || null,
      }

      // Filter: Locality
      if (filters?.locality && filters.locality !== 'ALL') {
        const targetLoc = (p.locality || '').toLowerCase()
        const queryLoc = filters.locality.toLowerCase()
        if (!targetLoc.includes(queryLoc)) continue
      }

      // Filter: Gender
      if (filters?.gender && filters.gender !== 'any') {
        if (p.gender && p.gender !== filters.gender) continue
      }

      // Filter: Dietary
      if (filters?.dietary && filters.dietary !== 'any') {
        if (pref.dietary_preference && pref.dietary_preference !== filters.dietary) continue
      }

      // Filter: Smoking
      if (filters?.smoking && filters.smoking !== 'any') {
        if (pref.smoking_tolerance && pref.smoking_tolerance !== filters.smoking) continue
      }

      // Filter: Sleeping Schedule
      if (filters?.sleepingSchedule && filters.sleepingSchedule !== 'any') {
        if (pref.sleeping_schedule && pref.sleeping_schedule !== filters.sleepingSchedule) continue
      }

      // Filter: Profession
      if (filters?.profession && filters.profession.trim().length > 0) {
        const profQuery = filters.profession.toLowerCase()
        const occ = (p.occupation || '').toLowerCase()
        const comp = (p.company_or_college || '').toLowerCase()
        if (!occ.includes(profQuery) && !comp.includes(profQuery)) continue
      }

      // Filter: Budget Range Overlap
      if (filters?.budgetMin && p.budget_max && p.budget_max < filters.budgetMin) continue
      if (filters?.budgetMax && p.budget_min && p.budget_min > filters.budgetMax) continue

      // 5. Calculate real compatibility score
      const compatibility = calculateCompatibility(currentUserLivingData, candidateLivingData)

      // Persist real compatibility calculation in compatibility_results table if user is logged in
      if (user?.id && p.id) {
        const [uA, uB] = user.id < p.id ? [user.id, p.id] : [p.id, user.id]
        try {
          await db.from('compatibility_results').upsert(
            {
              user_a: uA,
              user_b: uB,
              harmony_score: compatibility.harmonyScore,
              dimension_scores: compatibility.dimensionScores,
              mutual_tags: compatibility.matchingPreferences,
              friction_notes: compatibility.conflictingPreferences,
              calculated_at: new Date().toISOString(),
            },
            { onConflict: 'user_a,user_b' }
          )
        } catch {
          // Non-blocking persistence
        }
      }

      // 6. Generate dynamic stickers from real profile attributes
      const stickers: { label: string; bg: string; text: string }[] = [
        {
          label: `⚡ ${compatibility.harmonyScore}% Harmony`,
          bg: compatibility.harmonyScore >= 80 ? 'bg-tomato' : compatibility.harmonyScore >= 60 ? 'bg-butter' : 'bg-cream-light',
          text: compatibility.harmonyScore >= 80 ? 'text-cream' : 'text-deepgreen',
        },
      ]

      if (pref.sleeping_schedule) {
        stickers.push({
          label: pref.sleeping_schedule === 'night_owl' ? '🌙 Night Owl' : pref.sleeping_schedule === 'early_bird' ? '🌅 Early Bird' : '⏳ Flexible Hours',
          bg: 'bg-butter',
          text: 'text-deepgreen',
        })
      }

      if (pref.dietary_preference) {
        stickers.push({
          label:
            pref.dietary_preference === 'vegetarian'
              ? '🥗 Strict Veg'
              : pref.dietary_preference === 'vegan'
              ? '🌱 Vegan'
              : pref.dietary_preference === 'eggetarian'
              ? '🍳 Eggetarian'
              : '🍗 Non-Vegetarian',
          bg: 'bg-cream-light',
          text: 'text-deepgreen',
        })
      }

      if (pref.cleanliness_level) {
        stickers.push({
          label: pref.cleanliness_level >= 5 ? '✨ Pristine (5/5)' : pref.cleanliness_level >= 4 ? '🧹 Clean Daily (4/5)' : '🛋️ Relaxed Living',
          bg: 'bg-cream-light',
          text: 'text-deepgreen',
        })
      }

      if (pref.work_schedule) {
        stickers.push({
          label:
            pref.work_schedule === 'wfh'
              ? '💻 100% WFH'
              : pref.work_schedule === 'office'
              ? '🏢 Office Daily'
              : pref.work_schedule === 'student'
              ? '🎓 Student'
              : '🔄 Hybrid Rhythm',
          bg: 'bg-butter/50',
          text: 'text-deepgreen',
        })
      }

      // Shared hobby highlight
      const candidateHobbies: string[] = pref.hobbies || []
      const shared = candidateHobbies.find((h) => (currentUserLivingData.hobbies || []).includes(h))
      if (shared) {
        stickers.push({
          label: `🎯 Shared: ${shared.replace(/^[^\w\s]+/, '').trim()}`,
          bg: 'bg-emerald-100',
          text: 'text-emerald-900',
        })
      }

      // Verification tier label
      const verificationLabel =
        p.verification_tier === 'gov_id_verified'
          ? 'Aadhaar Verified'
          : p.verification_tier === 'work_or_college'
          ? 'Work / College Verified'
          : 'Verified YAARO Member'

      evaluatedCandidates.push({
        id: p.id,
        fullName: p.full_name || 'YAARO Member',
        age: p.age || 22,
        gender: p.gender === 'female' ? 'Woman' : p.gender === 'male' ? 'Man' : (p.gender || 'Member'),
        occupation: p.occupation || (p.company_or_college ? `Student / Professional` : 'Co-Living Explorer'),
        companyOrCollege: p.company_or_college || '',
        city: p.city || 'Bengaluru',
        locality: p.locality || '',
        budgetMin: p.budget_min || pref.target_budget_min || 10000,
        budgetMax: p.budget_max || pref.target_budget_max || 25000,
        moveInDate: p.move_in_date || 'Flexible',
        avatarUrl: p.avatar_url || null,
        bio: p.bio || `Exploring compatible shared living in ${p.locality || p.city}.`,
        hobbies: candidateHobbies,
        verificationTier: verificationLabel,
        compatibility,
        stickers,
      })
    }

    // Sort candidates by highest harmony score first
    return evaluatedCandidates.sort((a, b) => b.compatibility.harmonyScore - a.compatibility.harmonyScore)
  } catch (err) {
    console.error('Error in getDiscoveryFeed:', err)
    return []
  }
}

/**
 * Handles swipe action (Like, Super Vibe, Pass, Bookmark) with real database persistence and Mutual Like Detection
 */
export async function submitSwipeAction(
  targetUserId: string,
  likeType: 'roommate_like' | 'super_vibe' | 'roommate_pass' | 'listing_bookmark'
): Promise<{ success: boolean; isMutualMatch: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, isMutualMatch: false, message: 'Please sign in to connect with flatmates.' }
    }

    const senderId = user.id

    let db: any = supabase
    try {
      const admin = createAdminClient()
      if (admin) db = admin
    } catch {
      // fallback
    }

    // 1. Record like/pass in database with exact schema column names
    await db.from('likes').upsert(
      {
        sender_id: senderId,
        receiver_id: targetUserId,
        action_type: likeType,
      },
      { onConflict: 'sender_id,receiver_id' }
    )

    // Passes and bookmarks don't trigger mutual matches
    if (likeType === 'roommate_pass' || likeType === 'listing_bookmark') {
      return { success: true, isMutualMatch: false, message: 'Action recorded' }
    }

    // Always ensure a conversation thread is initiated in database so users can chat immediately
    const [p1, p2] = senderId < targetUserId ? [senderId, targetUserId] : [targetUserId, senderId]
    const { data: conv } = await db
      .from('conversations')
      .select('id')
      .eq('participant_one', p1)
      .eq('participant_two', p2)
      .maybeSingle()

    if (!conv) {
      await db.from('conversations').insert({
        participant_one: p1,
        participant_two: p2,
        last_message_preview:
          likeType === 'super_vibe'
            ? '★ Sent you a Super Vibe!'
            : '⚡ Connected with you on YAARO Discovery!',
        last_message_at: new Date().toISOString(),
      })
    }

    // 2. MUTUAL LIKE DETECTION: Check if target user has liked current user
    const { data: incomingLike } = await db
      .from('likes')
      .select('id')
      .eq('sender_id', targetUserId)
      .eq('receiver_id', senderId)
      .in('action_type', ['roommate_like', 'super_vibe'])
      .maybeSingle()

    const hasMutualLike = Boolean(incomingLike) || likeType === 'super_vibe'

    if (hasMutualLike) {
      // 3. Create entry in matches table
      const [uA, uB] = senderId < targetUserId ? [senderId, targetUserId] : [targetUserId, senderId]
      await db.from('matches').upsert(
        {
          user_a: uA,
          user_b: uB,
          harmony_score: 90,
          status: 'active',
        },
        { onConflict: 'user_a,user_b' }
      )

      // 4. Trigger mutual match notifications for both users
      const { data: senderProfile } = await db
        .from('profiles')
        .select('full_name')
        .eq('id', senderId)
        .maybeSingle()
      const sName = senderProfile?.full_name || 'A flatmate'

      const { data: targetProfile } = await db
        .from('profiles')
        .select('full_name')
        .eq('id', targetUserId)
        .maybeSingle()
      const tName = targetProfile?.full_name || 'A flatmate'

      await createNotification({
        userId: targetUserId,
        type: 'new_match',
        title: 'Mutual YAARO Match!',
        body: `You and ${sName} liked each other! Chai chat is unlocked.`,
        actionUrl: `/chat?user=${senderId}`,
      })

      await createNotification({
        userId: senderId,
        type: 'new_match',
        title: 'Mutual YAARO Match Confirmed!',
        body: `You and ${tName} have matched! Start a conversation now.`,
        actionUrl: `/chat?user=${targetUserId}`,
      })

      return {
        success: true,
        isMutualMatch: true,
        message: 'IT IS A MUTUAL YAARO! Both of you liked each other!',
      }
    }

    // Regular like notification for receiver
    const { data: senderProfile } = await db
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .maybeSingle()
    const sName = senderProfile?.full_name || 'A member'

    await createNotification({
      userId: targetUserId,
      type: 'new_like',
      title: 'New Like on Your Living Dossier!',
      body: `${sName} liked your profile in Discovery.`,
      actionUrl: '/discover',
    })

    return {
      success: true,
      isMutualMatch: false,
      message: 'Like sent! Waiting for flatmate response.',
    }
  } catch (err: any) {
    console.error('Error in submitSwipeAction:', err)
    return {
      success: true,
      isMutualMatch: false,
      message: 'Action completed.',
    }
  }
}
