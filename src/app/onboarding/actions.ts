'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateProfileCompletion } from '@/lib/profile-completion'

interface SaveOnboardingPayload {
  // Step 1: Identity
  fullName: string
  avatarUrl: string | null
  age: number | null
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null
  occupation: string
  companyOrCollege: string
  // Step 2: Logistics
  city: string
  locality: string
  budgetMin: number
  budgetMax: number
  moveInDate: string | null
  isLookingForRoom: boolean
  isLookingForRoommate: boolean
  // Step 3: Habits
  dietaryPreference: 'any' | 'vegetarian' | 'vegan' | 'non_vegetarian' | 'eggetarian'
  smokingTolerance: 'non_smoker' | 'outside_only' | 'open_to_smokers'
  drinkingTolerance: 'teetotaler' | 'social' | 'regular'
  sleepingSchedule: 'early_bird' | 'night_owl' | 'flexible'
  workSchedule: 'wfh' | 'office' | 'hybrid' | 'student'
  cleanlinessLevel: number
  petTolerance: 'pet_friendly' | 'no_pets' | 'has_pets'
  // Step 4: Social
  hobbies: string[]
  socialLifestyle: 'introvert' | 'balanced' | 'extrovert'
  bio: string
}

export type { SaveOnboardingPayload }

export async function saveOnboardingProfile(payload: SaveOnboardingPayload) {
  const supabase = await createClient()

  // Get current session or generate fallback ID for local preview
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    return { success: false, error: 'Session expired or not logged in. Please sign in again.' }
  }

  const userId = user?.id || 'demo-user-id'

  // Calculate completion percentage
  const { percentage } = calculateProfileCompletion(
    {
      full_name: payload.fullName,
      avatar_url: payload.avatarUrl,
      age: payload.age,
      gender: payload.gender,
      occupation: payload.occupation,
      company_or_college: payload.companyOrCollege,
      city: payload.city,
      locality: payload.locality,
      budget_min: payload.budgetMin,
      budget_max: payload.budgetMax,
      move_in_date: payload.moveInDate,
      is_looking_for_room: payload.isLookingForRoom,
      is_looking_for_roommate: payload.isLookingForRoommate,
    },
    {
      dietary_preference: payload.dietaryPreference,
      smoking_tolerance: payload.smokingTolerance,
      drinking_tolerance: payload.drinkingTolerance,
      sleeping_schedule: payload.sleepingSchedule,
      work_schedule: payload.workSchedule,
      cleanliness_level: payload.cleanlinessLevel,
      pet_tolerance: payload.petTolerance,
      hobbies: payload.hobbies,
      social_lifestyle: payload.socialLifestyle,
    }
  )

  // In local development placeholder mode:
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    return {
      success: true,
      percentage,
      message: 'Onboarding completed in local development mode.',
    }
  }

  // 1. Update Profiles Table
  const validMoveInDate = payload.moveInDate && payload.moveInDate.trim().length > 0 ? payload.moveInDate : null
  const profileRecord = {
    id: userId,
    full_name: payload.fullName || 'YAARO Member',
    avatar_url: payload.avatarUrl,
    age: payload.age,
    gender: payload.gender,
    occupation: payload.occupation,
    company_or_college: payload.companyOrCollege,
    city: payload.city,
    locality: payload.locality,
    budget_min: payload.budgetMin,
    budget_max: payload.budgetMax,
    move_in_date: validMoveInDate,
    bio: payload.bio,
    is_looking_for_room: payload.isLookingForRoom,
    is_looking_for_roommate: payload.isLookingForRoommate,
    profile_completed_percentage: percentage,
    onboarded: true,
  }

  // Use admin client for guaranteed persistence and bypass RLS timeout
  let db = supabase
  try {
    const admin = createAdminClient()
    if (admin) db = admin as any
  } catch {
    // fallback to session client
  }

  const { error: profileError } = await (db.from('profiles') as any).upsert(profileRecord)

  if (profileError) {
    console.error('Error saving profile:', profileError)
    return { success: false, error: profileError.message }
  }

  // 2. Update User Preferences Table
  const prefRecord = {
    user_id: userId,
    preferred_cities: [payload.city],
    preferred_localities: payload.locality ? [payload.locality] : [],
    target_budget_min: payload.budgetMin,
    target_budget_max: payload.budgetMax,
    dietary_preference: payload.dietaryPreference,
    smoking_tolerance: payload.smokingTolerance,
    drinking_tolerance: payload.drinkingTolerance,
    sleeping_schedule: payload.sleepingSchedule,
    work_schedule: payload.workSchedule,
    cleanliness_level: payload.cleanlinessLevel,
    pet_tolerance: payload.petTolerance,
    hobbies: payload.hobbies,
    social_lifestyle: payload.socialLifestyle,
  }

  const { error: prefError } = await (db.from('user_preferences') as any).upsert(prefRecord, {
    onConflict: 'user_id',
  })

  if (prefError) {
    console.error('Error saving user_preferences:', prefError)
    return { success: false, error: prefError.message }
  }

  return { success: true, percentage }
}
