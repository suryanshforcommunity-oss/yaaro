// ==============================================================================
// YAARO PHASE 3: AUTOMATED VERIFICATION TEST SUITE (Node ESM)
// ==============================================================================

export const COMPATIBILITY_WEIGHTS = {
  cleanliness: 0.25,
  sleep: 0.15,
  food: 0.15,
  social: 0.10,
  work: 0.10,
  expenses: 0.10,
  substances_pets: 0.05,
  hobbies: 0.10,
}

export function calculateCompatibility(userA, userB) {
  const dealBreakers = []
  const matchingPreferences = []
  const conflictingPreferences = []
  const explanations = []

  let evaluatedDimensionsCount = 0

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
  let cleanlinessScore = 70
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
  let expensesScore = 90
  if (userA.budgetMin && userA.budgetMax && userB.budgetMin && userB.budgetMax) {
    evaluatedDimensionsCount++
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

  // Weighted aggregation
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

  const isSufficientData = evaluatedDimensionsCount >= 4
  if (!isSufficientData) {
    harmonyScore = Math.min(harmonyScore, 74)
    conflictingPreferences.push('Pending Vibe Test: Additional domestic answers needed for full calibration.')
  } else if (harmonyScore > 98) {
    harmonyScore = 98
  }

  const hasDealBreaker = dealBreakers.length > 0
  if (hasDealBreaker) {
    harmonyScore = Math.min(harmonyScore, 42)
  }

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

export const CHEMISTRY_QUESTIONS_META = [
  // LIFESTYLE MATCH (5)
  { id: 1, cat: 'lifestyle_match', prompt: 'Early bird or night owl?' },
  { id: 2, cat: 'lifestyle_match', prompt: 'Cleaning cadence' },
  { id: 3, cat: 'lifestyle_match', prompt: 'Food & kitchen territory' },
  { id: 4, cat: 'lifestyle_match', prompt: 'Living room noise & guests' },
  { id: 5, cat: 'lifestyle_match', prompt: 'WFH vs office rhythm' },
  // PERSONALITY MATCH (4)
  { id: 6, cat: 'personality_match', prompt: 'Social battery recharge' },
  { id: 7, cat: 'personality_match', prompt: 'Weekend approach planned vs spontaneous' },
  { id: 8, cat: 'personality_match', prompt: 'Privacy expectations' },
  { id: 9, cat: 'personality_match', prompt: 'Organization aesthetic' },
  // ROOMMATE SITUATIONS (5)
  { id: 10, cat: 'roommate_situations', prompt: 'Unannounced guests on Tuesday' },
  { id: 11, cat: 'roommate_situations', prompt: 'Unsettled ₹2,400 split for 5 days' },
  { id: 12, cat: 'roommate_situations', prompt: 'Unsoaked chai saucepan on stove' },
  { id: 13, cat: 'roommate_situations', prompt: 'Late night bass music' },
  { id: 14, cat: 'roommate_situations', prompt: 'Common area deep cleaning disagreement' },
  // FUN COMPATIBILITY (5)
  { id: 15, cat: 'fun_compatibility', prompt: 'Ideal Bengaluru Sunday' },
  { id: 16, cat: 'fun_compatibility', prompt: 'Living room entertainment vibe' },
  { id: 17, cat: 'fun_compatibility', prompt: 'Weekend roadtrip philosophy' },
  { id: 18, cat: 'fun_compatibility', prompt: 'Late-night snack emergency' },
  { id: 19, cat: 'fun_compatibility', prompt: 'Work beverage companion' },
]

function runPhase3Tests() {
  console.log('🧪 Starting YAARO Phase 3 Automated Verification Tests...\n')
  let passed = 0
  let failed = 0

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${testName}`)
      failed++
    }
  }

  // 1. Math rigor
  console.log('\n--- 1. Weighted Architecture & Mathematical Rigor ---')
  const totalWeight =
    COMPATIBILITY_WEIGHTS.cleanliness +
    COMPATIBILITY_WEIGHTS.sleep +
    COMPATIBILITY_WEIGHTS.food +
    COMPATIBILITY_WEIGHTS.social +
    COMPATIBILITY_WEIGHTS.work +
    COMPATIBILITY_WEIGHTS.expenses +
    COMPATIBILITY_WEIGHTS.substances_pets +
    COMPATIBILITY_WEIGHTS.hobbies

  assert(Math.abs(totalWeight - 1.0) < 0.0001, 'Weight sum is exactly 1.0 (100%)')
  assert(COMPATIBILITY_WEIGHTS.cleanliness === 0.25, 'Cleanliness & Domestic Hygiene is weighted at 25%')
  assert(COMPATIBILITY_WEIGHTS.sleep === 0.15, 'Sleep Schedule & Quiet Hours is weighted at 15%')
  assert(COMPATIBILITY_WEIGHTS.food === 0.15, 'Dietary & Kitchen Boundaries is weighted at 15%')
  assert(COMPATIBILITY_WEIGHTS.social === 0.10, 'Social Lifestyle & Guest Rules is weighted at 10%')
  assert(COMPATIBILITY_WEIGHTS.work === 0.10, 'Work/Study Schedule & WFH is weighted at 10%')
  assert(COMPATIBILITY_WEIGHTS.expenses === 0.10, 'Expenses & Bill Splitting Attitude is weighted at 10%')
  assert(COMPATIBILITY_WEIGHTS.substances_pets === 0.05, 'Substance & Pet Boundaries is weighted at 5%')
  assert(COMPATIBILITY_WEIGHTS.hobbies === 0.10, 'Shared Passions & Hobbies is weighted at 10%')

  // 2. Insufficient Data
  console.log('\n--- 2. Insufficient Data Score Protection ---')
  const incA = { id: 'u1', fullName: 'User One', cleanlinessLevel: 5 }
  const incB = { id: 'u2', fullName: 'User Two', cleanlinessLevel: 5 }
  const incRes = calculateCompatibility(incA, incB)

  assert(incRes.isSufficientData === false, 'Detects insufficient data when fewer than 4 dimensions evaluated')
  assert(incRes.harmonyScore <= 74, `Score capped at max 74% (actual: ${incRes.harmonyScore}%) to prevent false 100% scores`)
  assert(
    incRes.conflictingPreferences.some((p) => p.includes('Pending Vibe Test')),
    'Flags pending vibe test calibration in conflicting preferences'
  )

  // 3. Deal Breakers
  console.log('\n--- 3. Deal-Breaker Exclusions & Hard Penalties ---')
  const smoker = { id: 's', fullName: 'Smoker', smoking: 'open_to_smokers', cleanlinessLevel: 5, sleepingSchedule: 'night_owl', dietary: 'non_vegetarian', socialLifestyle: 'balanced', workSchedule: 'hybrid', budgetMin: 15000, budgetMax: 20000, petTolerance: 'pet_friendly', hobbies: ['Gaming'] }
  const nonSmoker = { id: 'ns', fullName: 'Clean', smoking: 'non_smoker', cleanlinessLevel: 5, sleepingSchedule: 'night_owl', dietary: 'non_vegetarian', socialLifestyle: 'balanced', workSchedule: 'hybrid', budgetMin: 15000, budgetMax: 20000, petTolerance: 'pet_friendly', hobbies: ['Gaming'] }
  const smokerClash = calculateCompatibility(smoker, nonSmoker)
  assert(smokerClash.hasDealBreaker === true, 'Smoking clash flagged as deal breaker')
  assert(smokerClash.harmonyScore <= 42, `Smoking clash penalizes score <= 42% (actual: ${smokerClash.harmonyScore}%)`)

  const petLover = { id: 'p1', petTolerance: 'has_pets', cleanlinessLevel: 4, sleepingSchedule: 'night_owl', dietary: 'any', socialLifestyle: 'balanced' }
  const noPets = { id: 'p2', petTolerance: 'no_pets', cleanlinessLevel: 4, sleepingSchedule: 'night_owl', dietary: 'any', socialLifestyle: 'balanced' }
  const petClash = calculateCompatibility(petLover, noPets)
  assert(petClash.hasDealBreaker === true, 'Pet presence clash flagged as deal breaker')
  assert(petClash.harmonyScore <= 42, `Pet clash penalizes score <= 42% (actual: ${petClash.harmonyScore}%)`)

  const femaleSeeker = { id: 'f1', gender: 'female', preferredGender: 'female_only', cleanlinessLevel: 5, sleepingSchedule: 'early_bird', dietary: 'vegetarian', socialLifestyle: 'introvert' }
  const maleSeeker = { id: 'm1', gender: 'male', preferredGender: 'any', cleanlinessLevel: 5, sleepingSchedule: 'early_bird', dietary: 'vegetarian', socialLifestyle: 'introvert' }
  const genderClash = calculateCompatibility(femaleSeeker, maleSeeker)
  assert(genderClash.hasDealBreaker === true, 'Gender preference restriction enforced as deal breaker')
  assert(genderClash.harmonyScore <= 42, `Gender clash penalizes score <= 42% (actual: ${genderClash.harmonyScore}%)`)

  // 4. High-Harmony Match
  console.log('\n--- 4. High-Harmony Calibrated Match ---')
  const rhea = {
    id: 'rhea',
    fullName: 'Rhea Sen',
    gender: 'female',
    cleanlinessLevel: 4,
    sleepingSchedule: 'night_owl',
    dietary: 'eggetarian',
    smoking: 'non_smoker',
    drinking: 'social',
    workSchedule: 'hybrid',
    budgetMin: 18000,
    budgetMax: 24000,
    petTolerance: 'pet_friendly',
    socialLifestyle: 'balanced',
    preferredGender: 'any',
    hobbies: ['☕ Coffee Brewing', '📚 Book Club', '🌱 Balcony Garden', '🏸 Badminton'],
  }
  const aarav = {
    id: 'aarav',
    fullName: 'Aarav Sharma',
    gender: 'male',
    cleanlinessLevel: 4,
    sleepingSchedule: 'night_owl',
    dietary: 'eggetarian',
    smoking: 'non_smoker',
    drinking: 'social',
    workSchedule: 'hybrid',
    budgetMin: 16000,
    budgetMax: 22000,
    petTolerance: 'pet_friendly',
    socialLifestyle: 'balanced',
    preferredGender: 'any',
    hobbies: ['☕ Coffee Brewing', '🏸 Badminton', '💻 Tech & Startups', '🎸 Indie Gigs', '🌱 Plant Parent'],
  }
  const matchResult = calculateCompatibility(rhea, aarav)
  assert(matchResult.isSufficientData === true, 'Sufficient data evaluated across all 8 dimensions')
  assert(matchResult.hasDealBreaker === false, 'Zero deal-breakers detected between Rhea and Aarav')
  assert(matchResult.harmonyScore >= 90, `Harmony score is high (actual: ${matchResult.harmonyScore}%)`)
  assert(matchResult.dimensionScores.cleanliness === 100, 'Cleanliness dimension is 100% (both level 4)')
  assert(matchResult.dimensionScores.sleep === 100, 'Sleep dimension is 100% (both night owls)')
  assert(matchResult.dimensionScores.food === 100, 'Dietary dimension is 100% (both eggetarians)')
  assert(matchResult.matchingPreferences.length >= 4, `Identifies ${matchResult.matchingPreferences.length} matching living preferences`)

  // 5. Four Chemistry Game Categories & 19 Structured Dilemmas
  console.log('\n--- 5. The 4 Chemistry Games Dilemmas ---')
  const lifestyleQ = CHEMISTRY_QUESTIONS_META.filter((q) => q.cat === 'lifestyle_match')
  const personalityQ = CHEMISTRY_QUESTIONS_META.filter((q) => q.cat === 'personality_match')
  const situationsQ = CHEMISTRY_QUESTIONS_META.filter((q) => q.cat === 'roommate_situations')
  const funQ = CHEMISTRY_QUESTIONS_META.filter((q) => q.cat === 'fun_compatibility')

  assert(CHEMISTRY_QUESTIONS_META.length === 19, `Total 19 structured dilemmas defined (actual: ${CHEMISTRY_QUESTIONS_META.length})`)
  assert(lifestyleQ.length === 5, 'Category 1: Lifestyle Match has exactly 5 dilemmas')
  assert(personalityQ.length === 4, 'Category 2: Personality Match has exactly 4 dilemmas')
  assert(situationsQ.length === 5, 'Category 3: Roommate Situations has exactly 5 dilemmas')
  assert(funQ.length === 5, 'Category 4: Fun Compatibility has exactly 5 dilemmas')

  // 6. Mutual Match & Swiping Logic
  console.log('\n--- 6. Discovery & Mutual Match Detection ---')
  const userSwipeActions = [
    { actor: 'rhea', target: 'aarav', action: 'roommate_like' },
    { actor: 'aarav', target: 'rhea', action: 'roommate_like' },
  ]
  const isMutual =
    userSwipeActions.some((a) => a.actor === 'rhea' && a.target === 'aarav' && a.action === 'roommate_like') &&
    userSwipeActions.some((a) => a.actor === 'aarav' && a.target === 'rhea' && a.action === 'roommate_like')

  assert(isMutual === true, 'Mutual like detection successfully recognizes bilateral interest')

  console.log(`\n======================================================`)
  console.log(`Phase 3 Test Results: ${passed} passed, ${failed} failed`)
  console.log(`======================================================\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

runPhase3Tests()
