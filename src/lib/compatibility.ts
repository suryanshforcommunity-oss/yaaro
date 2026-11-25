/**
 * YAARO ROOMMATE COMPATIBILITY ENGINE
 * 
 * Strict Weighted Architecture: 25 / 15 / 15 / 10 / 10 / 10 / 5 / 10 = 100%
 * 
 * Category Mapping:
 * 1. Cleanliness & Domestic Hygiene (cleanliness): 25%
 * 2. Sleep Schedule & Quiet Hours (sleep): 15%
 * 3. Dietary & Kitchen Sharing (food): 15%
 * 4. Social Lifestyle & Guest Rules (social): 10%
 * 5. Work & Study Habits / WFH (work): 10%
 * 6. Expenses & Bill Splitting Attitude (expenses): 10%
 * 7. Substance & Pet Boundaries (substances_pets): 5%
 * 8. Shared Interests & Hobbies (hobbies): 10%
 */

export interface UserLivingData {
  id: string
  fullName: string
  age?: number | null
  occupation?: string | null
  companyOrCollege?: string | null
  bio?: string | null
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null
  city?: string
  locality?: string | null
  budgetMin?: number | null
  budgetMax?: number | null
  dietary?: 'any' | 'vegetarian' | 'vegan' | 'non_vegetarian' | 'eggetarian' | null
  smoking?: 'non_smoker' | 'outside_only' | 'open_to_smokers' | null
  drinking?: 'teetotaler' | 'social' | 'regular' | null
  sleepingSchedule?: 'early_bird' | 'night_owl' | 'flexible' | null
  workSchedule?: 'wfh' | 'office' | 'hybrid' | 'student' | null
  cleanlinessLevel?: number | null // 1 to 5
  petTolerance?: 'pet_friendly' | 'no_pets' | 'has_pets' | null
  socialLifestyle?: 'introvert' | 'balanced' | 'extrovert' | null
  preferredGender?: 'any' | 'female_only' | 'male_only' | null
  hobbies?: string[] | null
  // Answers from Chemistry Games
  quizAnswers?: Record<string, string> // question_id / category -> option_key
}

export interface CompatibilityScore {
  harmonyScore: number // 0 to 100
  dimensionScores: {
    cleanliness: number // 0-100
    sleep: number // 0-100
    food: number // 0-100
    social: number // 0-100
    work: number // 0-100
    expenses: number // 0-100
    substances_pets: number // 0-100
    hobbies: number // 0-100
  }
  isSufficientData: boolean
  hasDealBreaker: boolean
  dealBreakers: string[]
  matchingPreferences: string[]
  conflictingPreferences: string[]
  explanations: string[]
  archetypeBadge: string
}

export const COMPATIBILITY_WEIGHTS = {
  cleanliness: 0.25,
  sleep: 0.15,
  food: 0.15,
  social: 0.10,
  work: 0.10,
  expenses: 0.10,
  substances_pets: 0.05,
  hobbies: 0.10,
} as const

/**
 * Calculates pairwise compatibility between two users with strict mathematical rigor.
 */
export function calculateCompatibility(userA: UserLivingData, userB: UserLivingData): CompatibilityScore {
  const dealBreakers: string[] = []
  const matchingPreferences: string[] = []
  const conflictingPreferences: string[] = []
  const explanations: string[] = []

  let evaluatedDimensionsCount = 0

  // --------------------------------------------------------------------------
  // DEAL-BREAKER CHECKS
  // --------------------------------------------------------------------------

  // 1. Gender preference constraint
  if (userA.preferredGender === 'female_only' && userB.gender === 'male') {
    dealBreakers.push('Gender mismatch: User requires female-only flatmates.')
  } else if (userA.preferredGender === 'male_only' && userB.gender === 'female') {
    dealBreakers.push('Gender mismatch: User requires male-only flatmates.')
  } else if (userB.preferredGender === 'female_only' && userA.gender === 'male') {
    dealBreakers.push('Gender mismatch: Flatmate requires female-only co-living.')
  } else if (userB.preferredGender === 'male_only' && userA.gender === 'female') {
    dealBreakers.push('Gender mismatch: Flatmate requires male-only co-living.')
  }

  // 2. Smoking deal-breaker
  if (
    (userA.smoking === 'non_smoker' && userB.smoking === 'open_to_smokers') ||
    (userB.smoking === 'non_smoker' && userA.smoking === 'open_to_smokers')
  ) {
    dealBreakers.push('Smoking clash: Strict non-smoker vs. indoor smoking friendly.')
    conflictingPreferences.push('Smoking policy disagreement')
  }

  // 3. Strict Vegetarian Kitchen deal-breaker
  const isStrictVegA = userA.dietary === 'vegetarian' || userA.dietary === 'vegan'
  const isStrictVegB = userB.dietary === 'vegetarian' || userB.dietary === 'vegan'
  if (
    (isStrictVegA && userB.dietary === 'non_vegetarian') ||
    (isStrictVegB && userA.dietary === 'non_vegetarian')
  ) {
    conflictingPreferences.push('Kitchen dietary friction: Strict Vegetarian vs Non-Vegetarian')
  }

  // 4. Pet intolerance deal-breaker
  if (
    (userA.petTolerance === 'no_pets' && userB.petTolerance === 'has_pets') ||
    (userB.petTolerance === 'no_pets' && userA.petTolerance === 'has_pets')
  ) {
    dealBreakers.push('Pet incompatibility: No-pets restriction vs Pet owner.')
    conflictingPreferences.push('Pet presence disagreement')
  }

  // --------------------------------------------------------------------------
  // DIMENSION SCORING (Each 0 - 100)
  // --------------------------------------------------------------------------

  // 1. Cleanliness & Domestic Hygiene (Weight: 25%)
  let cleanlinessScore = 70 // baseline if unspecified
  if (userA.cleanlinessLevel && userB.cleanlinessLevel) {
    evaluatedDimensionsCount++
    const diff = Math.abs(userA.cleanlinessLevel - userB.cleanlinessLevel)
    if (diff === 0) {
      cleanlinessScore = 100
      matchingPreferences.push('Identical cleanliness standards')
      explanations.push('You both share the exact same standard for kitchen and common area hygiene.')
    } else if (diff === 1) {
      cleanlinessScore = 85
      matchingPreferences.push('Closely aligned domestic hygiene')
    } else if (diff === 2) {
      cleanlinessScore = 65
      conflictingPreferences.push('Moderate gap in cleaning frequency')
    } else {
      cleanlinessScore = 40
      conflictingPreferences.push('Significant cleanliness standard clash')
    }
  }

  // 2. Sleep Schedule & Quiet Hours (Weight: 15%)
  let sleepScore = 70
  if (userA.sleepingSchedule && userB.sleepingSchedule) {
    evaluatedDimensionsCount++
    if (userA.sleepingSchedule === userB.sleepingSchedule) {
      sleepScore = 100
      if (userA.sleepingSchedule === 'night_owl') {
        matchingPreferences.push('Both Night Owls (Peak focus midnight - 2 AM)')
        explanations.push('Both of you hit peak energy at night with aligned quiet hours.')
      } else if (userA.sleepingSchedule === 'early_bird') {
        matchingPreferences.push('Both Early Birds (Awake by 6–7 AM)')
        explanations.push('Shared morning cadence—neither disturbs the other before noon.')
      } else {
        matchingPreferences.push('Flexible daily sleep rhythms')
      }
    } else if (userA.sleepingSchedule === 'flexible' || userB.sleepingSchedule === 'flexible') {
      sleepScore = 80
      matchingPreferences.push('Adaptable sleeping routines')
    } else {
      // Early bird vs Night owl clash
      sleepScore = 45
      conflictingPreferences.push('Opposite sleep rhythms (Early Bird vs Night Owl)')
      explanations.push('Morning vs. midnight routine difference requires designated quiet hours.')
    }
  }

  // 3. Dietary & Kitchen Sharing (Weight: 15%)
  let foodScore = 70
  if (userA.dietary && userB.dietary) {
    evaluatedDimensionsCount++
    if (userA.dietary === userB.dietary) {
      foodScore = 100
      matchingPreferences.push(`Matching food habits (${userA.dietary.replace('_', ' ')})`)
      explanations.push('Harmonious kitchen territory with matching cooking and grocery habits.')
    } else if (userA.dietary === 'any' || userB.dietary === 'any') {
      foodScore = 90
      matchingPreferences.push('Flexible food & fridge sharing')
    } else if (
      (userA.dietary === 'eggetarian' && userB.dietary === 'vegetarian') ||
      (userA.dietary === 'vegetarian' && userB.dietary === 'eggetarian')
    ) {
      foodScore = 85
      matchingPreferences.push('Compatible veg & egg kitchen policy')
    } else {
      foodScore = 55
    }
  }

  // 4. Social Lifestyle & Guest Rules (Weight: 10%)
  let socialScore = 70
  if (userA.socialLifestyle && userB.socialLifestyle) {
    evaluatedDimensionsCount++
    if (userA.socialLifestyle === userB.socialLifestyle) {
      socialScore = 98
      matchingPreferences.push(`Both prefer ${userA.socialLifestyle} living environment`)
      explanations.push(`Compatible social energy: mutual respect for ${userA.socialLifestyle} recharge time.`)
    } else if (userA.socialLifestyle === 'balanced' || userB.socialLifestyle === 'balanced') {
      socialScore = 82
      matchingPreferences.push('Balanced social boundaries')
    } else {
      socialScore = 50
      conflictingPreferences.push('Introvert vs Extrovert social energy disparity')
    }
  }

  // 5. Work & Study Habits / WFH (Weight: 10%)
  let workScore = 70
  if (userA.workSchedule && userB.workSchedule) {
    evaluatedDimensionsCount++
    if (userA.workSchedule === userB.workSchedule) {
      workScore = 95
      matchingPreferences.push(`Matching ${userA.workSchedule.toUpperCase()} work rhythms`)
    } else if (
      (userA.workSchedule === 'hybrid' && userB.workSchedule === 'wfh') ||
      (userA.workSchedule === 'wfh' && userB.workSchedule === 'hybrid')
    ) {
      workScore = 85
      matchingPreferences.push('Complementary desk & broadband usage')
    } else {
      workScore = 70
    }
  }

  // 6. Expenses & Bill Splitting Attitude (Weight: 10%)
  // Default to high score if both use YAARO ledger, adjusted by quiz answers if present
  let expensesScore = 90
  if (userA.budgetMin && userA.budgetMax && userB.budgetMin && userB.budgetMax) {
    evaluatedDimensionsCount++
    // Overlapping budget range check
    const overlapMin = Math.max(userA.budgetMin, userB.budgetMin)
    const overlapMax = Math.min(userA.budgetMax, userB.budgetMax)
    if (overlapMax >= overlapMin) {
      expensesScore = 96
      matchingPreferences.push(`Overlapping rent budget (₹${overlapMin.toLocaleString()} - ₹${overlapMax.toLocaleString()})`)
      explanations.push('Budget tolerances overlap seamlessly with zero financial mismatch.')
    } else {
      expensesScore = 50
      conflictingPreferences.push('Rent budget divergence')
    }
  }

  // 7. Substance & Pet Boundaries (Weight: 5%)
  let substancesPetsScore = 80
  if (userA.smoking && userB.smoking && userA.petTolerance && userB.petTolerance) {
    evaluatedDimensionsCount++
    let subScore = 80
    if (userA.smoking === userB.smoking) subScore += 10
    if (userA.petTolerance === userB.petTolerance) subScore += 10
    substancesPetsScore = Math.min(100, subScore)
  }

  // 8. Shared Interests & Hobbies (Weight: 10%)
  let hobbiesScore = 65
  const hobbiesA = userA.hobbies || []
  const hobbiesB = userB.hobbies || []
  if (hobbiesA.length > 0 && hobbiesB.length > 0) {
    evaluatedDimensionsCount++
    const common = hobbiesA.filter((h) => hobbiesB.includes(h))
    if (common.length >= 3) {
      hobbiesScore = 98
      matchingPreferences.push(`3+ Shared passions (${common.slice(0, 3).join(', ')})`)
      explanations.push(`Instant friendship potential over shared interests in ${common.join(', ')}.`)
    } else if (common.length >= 1) {
      hobbiesScore = 82
      matchingPreferences.push(`Shared hobby: ${common.join(', ')}`)
    } else {
      hobbiesScore = 60
    }
  }

  // --------------------------------------------------------------------------
  // WEIGHTED AGGREGATION
  // --------------------------------------------------------------------------
  const weightedSum =
    cleanlinessScore * COMPATIBILITY_WEIGHTS.cleanliness +
    sleepScore * COMPATIBILITY_WEIGHTS.sleep +
    foodScore * COMPATIBILITY_WEIGHTS.food +
    socialScore * COMPATIBILITY_WEIGHTS.social +
    workScore * COMPATIBILITY_WEIGHTS.work +
    expensesScore * COMPATIBILITY_WEIGHTS.expenses +
    substancesPetsScore * COMPATIBILITY_WEIGHTS.substances_pets +
    hobbiesScore * COMPATIBILITY_WEIGHTS.hobbies

  let harmonyScore = Math.round(weightedSum)

  // RULE: Do not display 100% when insufficient information is available!
  const isSufficientData = evaluatedDimensionsCount >= 4
  if (!isSufficientData) {
    // Cap score at 75 max and note insufficient calibration
    harmonyScore = Math.min(harmonyScore, 74)
    conflictingPreferences.push('Pending Vibe Test: Additional domestic answers needed for full calibration.')
  } else if (harmonyScore > 98) {
    // True human perfection is realistically capped at 98%
    harmonyScore = 98
  }

  // Apply deal-breaker severe penalty
  const hasDealBreaker = dealBreakers.length > 0
  if (hasDealBreaker) {
    harmonyScore = Math.min(harmonyScore, 42)
  }

  // Determine Living Archetype
  let archetypeBadge = 'The Balanced Flatmate'
  if (sleepScore > 90 && socialScore > 85) archetypeBadge = 'The Socialite Co-Liver'
  else if (cleanlinessScore > 90 && sleepScore > 90) archetypeBadge = 'The Harmonious Sanctuary'
  else if (userA.sleepingSchedule === 'night_owl' && userB.sleepingSchedule === 'night_owl') archetypeBadge = 'The Diplomatic Night Owls'
  else if (cleanlinessScore > 90) archetypeBadge = 'The Kitchen Disciplinarian'

  return {
    harmonyScore,
    dimensionScores: {
      cleanliness: Math.round(cleanlinessScore),
      sleep: Math.round(sleepScore),
      food: Math.round(foodScore),
      social: Math.round(socialScore),
      work: Math.round(workScore),
      expenses: Math.round(expensesScore),
      substances_pets: Math.round(substancesPetsScore),
      hobbies: Math.round(hobbiesScore),
    },
    isSufficientData,
    hasDealBreaker,
    dealBreakers,
    matchingPreferences,
    conflictingPreferences,
    explanations: explanations.length > 0 ? explanations : ['Preliminary living parameters align with mutual shared living interest.'],
    archetypeBadge,
  }
}
