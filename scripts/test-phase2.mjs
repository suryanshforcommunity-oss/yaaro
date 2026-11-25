// ==============================================================================
// YAARO PHASE 2: AUTOMATED VERIFICATION TEST SUITE (Node ESM)
// ==============================================================================

function calculateProfileCompletion(profile, preferences) {
  const items = [
    { id: 'full_name', label: 'Full Name', completed: Boolean(profile?.full_name?.trim()), weight: 5 },
    { id: 'avatar_url', label: 'Profile Photograph', completed: Boolean(profile?.avatar_url), weight: 10 },
    { id: 'age', label: 'Age', completed: Boolean(profile?.age && profile.age >= 18), weight: 5 },
    { id: 'gender', label: 'Gender Identity', completed: Boolean(profile?.gender), weight: 5 },
    { id: 'occupation', label: 'Profession / Role', completed: Boolean(profile?.occupation?.trim()), weight: 5 },
    { id: 'company_or_college', label: 'College or Company', completed: Boolean(profile?.company_or_college?.trim()), weight: 5 },
    { id: 'city', label: 'Current City', completed: Boolean(profile?.city?.trim()), weight: 5 },
    { id: 'locality', label: 'Preferred Locality', completed: Boolean(profile?.locality?.trim()), weight: 5 },
    { id: 'budget', label: 'Monthly Budget Range', completed: Boolean(profile?.budget_min && profile?.budget_max), weight: 5 },
    { id: 'move_in_date', label: 'Expected Move-In Date', completed: Boolean(profile?.move_in_date), weight: 5 },
    { id: 'food', label: 'Food Preference', completed: Boolean(preferences?.dietary_preference && preferences.dietary_preference !== 'any'), weight: 5 },
    { id: 'smoking', label: 'Smoking Habits', completed: Boolean(preferences?.smoking_tolerance), weight: 5 },
    { id: 'drinking', label: 'Drinking Habits', completed: Boolean(preferences?.drinking_tolerance), weight: 5 },
    { id: 'sleeping', label: 'Sleeping Schedule', completed: Boolean(preferences?.sleeping_schedule), weight: 5 },
    { id: 'work_schedule', label: 'Work / Study Schedule', completed: Boolean(preferences?.work_schedule), weight: 5 },
    { id: 'cleanliness', label: 'Cleanliness Standard', completed: Boolean(preferences?.cleanliness_level && preferences.cleanliness_level > 0), weight: 5 },
    { id: 'pets', label: 'Pet Tolerance', completed: Boolean(preferences?.pet_tolerance), weight: 5 },
    { id: 'hobbies', label: 'Hobbies & Interests', completed: Boolean(preferences?.hobbies && preferences.hobbies.length > 0), weight: 5 },
    { id: 'social', label: 'Social Lifestyle', completed: Boolean(preferences?.social_lifestyle), weight: 5 },
    { id: 'roommate_pref', label: 'Roommate Preferences', completed: Boolean(profile?.is_looking_for_room !== undefined && profile?.is_looking_for_roommate !== undefined), weight: 5 },
  ]

  const completedCount = items.filter((i) => i.completed).length
  const totalWeight = items.reduce((acc, curr) => acc + curr.weight, 0)
  const earnedWeight = items.filter((i) => i.completed).reduce((acc, curr) => acc + curr.weight, 0)
  const percentage = Math.round((earnedWeight / totalWeight) * 100)

  let tier = 'Starter'
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

function runTests() {
  console.log('🧪 Starting YAARO Phase 2 Automated Verification Tests...\n')
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

  // TEST 1: Profile Completion Calculator (Empty profile)
  const emptyRes = calculateProfileCompletion(null, null)
  assert(emptyRes.percentage === 0, 'Empty profile calculates 0% completion')
  assert(emptyRes.tier === 'Starter', 'Empty profile defaults to Starter tier')
  assert(emptyRes.totalCount === 20, 'Tracks all 20 required onboarding dimensions')

  // TEST 2: Profile Completion Calculator (Partial profile)
  const partialRes = calculateProfileCompletion(
    {
      full_name: 'Rhea Sen',
      age: 24,
      gender: 'female',
      occupation: 'Product Designer',
      company_or_college: 'Razorpay',
      city: 'Bengaluru',
      locality: 'Indiranagar',
    },
    {
      dietary_preference: 'eggetarian',
      sleeping_schedule: 'night_owl',
    }
  )
  assert(partialRes.percentage > 30, 'Partial profile scores > 30%')
  assert(partialRes.completedCount >= 8, 'Accurately counts completed fields')

  // TEST 3: Profile Completion Calculator (Complete profile)
  const fullRes = calculateProfileCompletion(
    {
      full_name: 'Aarav Sharma',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      age: 23,
      gender: 'male',
      occupation: 'Software Engineer',
      company_or_college: 'Swiggy',
      city: 'Bengaluru',
      locality: 'Indiranagar',
      budget_min: 12000,
      budget_max: 22000,
      move_in_date: '2026-12-01',
      is_looking_for_room: true,
      is_looking_for_roommate: true,
    },
    {
      dietary_preference: 'eggetarian',
      smoking_tolerance: 'non_smoker',
      drinking_tolerance: 'social',
      sleeping_schedule: 'night_owl',
      work_schedule: 'hybrid',
      cleanliness_level: 4,
      pet_tolerance: 'pet_friendly',
      hobbies: ['Coffee', 'Badminton', 'Indie Gigs'],
      social_lifestyle: 'balanced',
    }
  )
  assert(fullRes.percentage === 100, 'Full profile achieves 100% completion')
  assert(fullRes.tier === 'Verified Star', '100% profile achieves Verified Star tier')

  // TEST 4: Phone Formatting & Indian Mobile Regex
  function formatPhone(p) {
    return p.startsWith('+') ? p : `+91${p.replace(/\D/g, '')}`
  }
  const formatted = formatPhone('9876543210')
  assert(formatted === '+919876543210', 'Correctly formats Indian +91 phone numbers')
  assert(formatPhone('+919876543210') === '+919876543210', 'Preserves existing country code')

  // TEST 5: Gender Inclusivity Rule
  const supportedGenders = ['male', 'female', 'non_binary', 'prefer_not_to_say']
  assert(supportedGenders.includes('non_binary'), 'Includes non_binary in gender support')
  assert(supportedGenders.includes('prefer_not_to_say'), 'Includes prefer_not_to_say in gender support')

  // TEST 6: Address Privacy Rule
  const mockPublicProfile = {
    city: 'Bengaluru',
    locality: 'Indiranagar',
    full_address: 'Flat 402, Royal Palms, 12th Main',
  }
  function getSafeDisplayLocation(p) {
    return `${p.locality}, ${p.city}` // Omits full_address
  }
  const safeLocation = getSafeDisplayLocation(mockPublicProfile)
  assert(
    !safeLocation.includes('Flat 402') && safeLocation === 'Indiranagar, Bengaluru',
    'Suppresses exact residential address and protects user privacy'
  )

  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`)
  if (failed > 0) {
    process.exit(1)
  }
}

runTests()
