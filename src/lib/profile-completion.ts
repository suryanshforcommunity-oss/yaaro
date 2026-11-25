import { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type PreferencesRow = Database['public']['Tables']['user_preferences']['Row']

export interface CompletionItem {
  id: string
  label: string
  completed: boolean
  weight: number
  category: 'identity' | 'logistics' | 'habits' | 'social'
}

/**
 * Calculates Profile Completion Percentage across the 20 onboarding dimensions
 */
export function calculateProfileCompletion(
  profile?: Partial<ProfileRow> | null,
  preferences?: Partial<PreferencesRow> | null
): {
  percentage: number
  completedCount: number
  totalCount: number
  checklist: CompletionItem[]
  tier: 'Starter' | 'Bronze' | 'Silver' | 'Gold' | 'Verified Star'
} {
  const items: CompletionItem[] = [
    // 1. Full name
    { id: 'full_name', label: 'Full Name', completed: Boolean(profile?.full_name?.trim()), weight: 5, category: 'identity' },
    // 2. Profile photo
    { id: 'avatar_url', label: 'Profile Photograph', completed: Boolean(profile?.avatar_url), weight: 10, category: 'identity' },
    // 3. Age
    { id: 'age', label: 'Age', completed: Boolean(profile?.age && profile.age >= 18), weight: 5, category: 'identity' },
    // 4. Gender
    { id: 'gender', label: 'Gender Identity', completed: Boolean(profile?.gender), weight: 5, category: 'identity' },
    // 5. Profession
    { id: 'occupation', label: 'Profession / Role', completed: Boolean(profile?.occupation?.trim()), weight: 5, category: 'identity' },
    // 6. College or Company
    { id: 'company_or_college', label: 'College or Company', completed: Boolean(profile?.company_or_college?.trim()), weight: 5, category: 'identity' },
    // 7. Current city
    { id: 'city', label: 'Current City', completed: Boolean(profile?.city?.trim()), weight: 5, category: 'logistics' },
    // 8. Preferred locality
    { id: 'locality', label: 'Preferred Locality', completed: Boolean(profile?.locality?.trim()), weight: 5, category: 'logistics' },
    // 9. Accommodation Budget
    { id: 'budget', label: 'Monthly Budget Range', completed: Boolean(profile?.budget_min && profile?.budget_max), weight: 5, category: 'logistics' },
    // 10. Expected move-in date
    { id: 'move_in_date', label: 'Expected Move-In Date', completed: Boolean(profile?.move_in_date), weight: 5, category: 'logistics' },
    // 11. Food preferences
    { id: 'food', label: 'Food Preference', completed: Boolean(preferences?.dietary_preference && preferences.dietary_preference !== 'any'), weight: 5, category: 'habits' },
    // 12. Smoking preferences
    { id: 'smoking', label: 'Smoking Habits', completed: Boolean(preferences?.smoking_tolerance), weight: 5, category: 'habits' },
    // 13. Drinking preferences
    { id: 'drinking', label: 'Drinking Habits', completed: Boolean(preferences?.drinking_tolerance), weight: 5, category: 'habits' },
    // 14. Sleeping schedule
    { id: 'sleeping', label: 'Sleeping Schedule', completed: Boolean(preferences?.sleeping_schedule), weight: 5, category: 'habits' },
    // 15. Work / Study schedule
    { id: 'work_schedule', label: 'Work / Study Schedule', completed: Boolean(preferences?.work_schedule), weight: 5, category: 'habits' },
    // 16. Cleanliness habits
    { id: 'cleanliness', label: 'Cleanliness Standard', completed: Boolean(preferences?.cleanliness_level && preferences.cleanliness_level > 0), weight: 5, category: 'habits' },
    // 17. Pet preferences
    { id: 'pets', label: 'Pet Tolerance', completed: Boolean(preferences?.pet_tolerance), weight: 5, category: 'habits' },
    // 18. Hobbies and interests
    { id: 'hobbies', label: 'Hobbies & Interests', completed: Boolean(preferences?.hobbies && preferences.hobbies.length > 0), weight: 5, category: 'social' },
    // 19. Social lifestyle
    { id: 'social', label: 'Social Lifestyle', completed: Boolean(preferences?.social_lifestyle), weight: 5, category: 'social' },
    // 20. Roommate preferences
    { id: 'roommate_pref', label: 'Roommate Preferences', completed: Boolean(profile?.is_looking_for_room !== undefined && profile?.is_looking_for_roommate !== undefined), weight: 5, category: 'social' },
  ]

  const completedCount = items.filter((i) => i.completed).length
  const totalWeight = items.reduce((acc, curr) => acc + curr.weight, 0)
  const earnedWeight = items.filter((i) => i.completed).reduce((acc, curr) => acc + curr.weight, 0)
  const percentage = Math.round((earnedWeight / totalWeight) * 100)

  let tier: 'Starter' | 'Bronze' | 'Silver' | 'Gold' | 'Verified Star' = 'Starter'
  if (percentage >= 90) tier = 'Verified Star'
  else if (percentage >= 70) tier = 'Gold'
  else if (percentage >= 50) tier = 'Silver'
  else if (percentage >= 30) tier = 'Bronze'

  return {
    percentage,
    completedCount,
    totalCount: items.length,
    checklist: items,
    tier,
  }
}
