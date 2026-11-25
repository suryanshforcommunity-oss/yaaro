'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateCompatibility, UserLivingData, CompatibilityScore } from '@/lib/compatibility'
import { CHEMISTRY_QUESTIONS, ChemistryQuestion, OptionItem } from '@/lib/chemistry-questions'
import { createNotification } from '@/lib/notifications'


// Calibrated baseline answers for pairwise comparison
const DEFAULT_CALIBRATED_ANSWERS: Record<number, string> = {
  1: 'B', // Night owl
  2: 'B', // Soak overnight
  3: 'B', // Shared cook
  4: 'C', // Balanced quiet
  5: 'B', // Hybrid rhythm
  6: 'C', // Ambivert
  7: 'A', // Planned
  8: 'A', // High privacy
  9: 'A', // Organized minimalist
  10: 'A', // Clear communicator
  11: 'A', // System first 1-tap UPI
  12: 'A', // Soak warm water
  13: 'A', // Direct & polite knock
  14: 'A', // Outsource deep cleaning
  15: 'A', // Specialty coffee
  16: 'A', // Projector cinema
  17: 'A', // Spontaneous roadtrip
  18: 'A', // Maggi maestro
  19: 'A', // Filter coffee
}

/**
 * Fetch questions grouped or filtered by game category
 */
export async function getChemistryQuestions(gameCategory?: string): Promise<ChemistryQuestion[]> {
  try {
    const supabase = await createClient()
    const query = supabase.from('quiz_questions').select('*')
    const finalQuery = gameCategory ? query.eq('game_category', gameCategory) : query
    const { data, error } = await finalQuery.order('question_order', { ascending: true })
    const rows = (data || []) as Array<{
      id: string
      question_order: number
      category: string
      game_category?: string
      question_text: string
      options: unknown
    }>
    if (!error && rows.length > 0) {
      return rows.map((q) => ({
        id: q.id,
        question_order: q.question_order,
        category: q.category,
        game_category: (q.game_category as any) || 'lifestyle_match',
        question_text: q.question_text,
        options: (q.options as unknown as OptionItem[]) || [],
        domestic_tip: CHEMISTRY_QUESTIONS.find((cq) => cq.question_order === q.question_order)?.domestic_tip,
      }))
    }
  } catch (err) {
    console.error('Error fetching quiz_questions from Supabase:', err)
  }

  // Fallback to seeded high-fidelity list
  if (gameCategory) {
    return CHEMISTRY_QUESTIONS.filter((q) => q.game_category === gameCategory)
  }
  return CHEMISTRY_QUESTIONS
}

/**
 * Fetch user's saved answers from Supabase
 */
export async function getUserQuizAnswers(): Promise<Record<number, string>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    const { data, error } = await supabase
      .from('quiz_answers')
      .select('question_id, selected_option_key')
      .eq('user_id', user.id)

    if (error || !data) return {}

    const answersMap: Record<number, string> = {}
    const rows = (data || []) as Array<{ question_id: string; selected_option_key: string }>
    rows.forEach((ans) => {
      // Find question order
      const q = CHEMISTRY_QUESTIONS.find((cq) => cq.id === ans.question_id || cq.question_order.toString() === ans.question_id)
      if (q) {
        answersMap[q.question_order] = ans.selected_option_key
      } else {
        const orderNum = parseInt(ans.question_id, 10)
        if (!isNaN(orderNum)) answersMap[orderNum] = ans.selected_option_key
      }
    })
    return answersMap
  } catch (err) {
    console.error('Error in getUserQuizAnswers:', err)
    return {}
  }
}

/**
 * Save single quiz answer to database
 */
export async function saveQuizAnswer(questionOrder: number, optionKey: string, scoreWeight: number = 25) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: true, isGuest: true }

    const question = CHEMISTRY_QUESTIONS.find((q) => q.question_order === questionOrder)
    const questionId = question?.id || questionOrder.toString()

    const { error } = await supabase.from('quiz_answers').upsert(
      {
        user_id: user.id,
        question_id: questionId,
        selected_option_key: optionKey,
        importance_weight: scoreWeight,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: 'user_id,question_id' }
    )

    if (error) {
      console.warn('Could not persist answer to Supabase, continuing in local state:', error.message)
    }

    return { success: true }
  } catch (err) {
    console.error('Error saving quiz answer:', err)
    return { success: false }
  }
}

/**
 * Save all answers for a category
 */
export async function submitCategoryAnswers(gameCategory: string, answers: Record<number, string>) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: true, count: Object.keys(answers).length }

    const updates = Object.entries(answers).map(([qOrderStr, optKey]) => {
      const qOrder = parseInt(qOrderStr, 10)
      const q = CHEMISTRY_QUESTIONS.find((item) => item.question_order === qOrder)
      return {
        user_id: user.id,
        question_id: q?.id || qOrder.toString(),
        selected_option_key: optKey,
        importance_weight: 25,
        updated_at: new Date().toISOString(),
      }
    })

    const { error } = await supabase
      .from('quiz_answers')
      .upsert(updates as any, { onConflict: 'user_id,question_id' })

    if (error) {
      console.warn('Error batch saving answers:', error.message)
    }

    return { success: true, count: updates.length }
  } catch (err) {
    console.error('Error in submitCategoryAnswers:', err)
    return { success: false, error: 'Failed to submit' }
  }
}

/**
 * Send a game challenge to a flatmate
 */
export async function sendGameChallenge(targetUserId: string, gameCategory: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: true, mockId: `challenge-${Date.now()}` }

    const { data, error } = await supabase.from('game_challenges').insert({
      challenger_id: user.id,
      challenged_id: targetUserId,
      game_category: gameCategory as any,
      status: 'pending',
      dimension_scores: {},
      answers_summary: {},
    } as any).select().single()

    if (error) {
      console.warn('Error inserting game challenge:', error.message)
      return { success: true, mockId: `mock-${Date.now()}` }
    }

    // Trigger notification for the challenged flatmate
    const { data: challengerProfile }: any = await (supabase.from('profiles') as any)
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()
    const cName = challengerProfile?.full_name || 'A flatmate'

    await createNotification({
      userId: targetUserId,
      type: 'game_challenge',
      title: 'Chemistry Test Challenge!',
      body: `${cName} challenged you to a ${gameCategory.replace('_', ' ')} test!`,
      actionUrl: `/quiz?target=${user.id}`,
    })

    return { success: true, challenge: data }
  } catch (err) {
    console.error('Error sending game challenge:', err)
    return { success: false, error: 'Failed to initiate game challenge' }
  }
}

/**
 * Fetch game challenges involving current user
 */
export async function getGameChallenges() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('game_challenges')
      .select('*')
      .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data
  } catch (err) {
    console.error('Error fetching game challenges:', err)
    return []
  }
}

interface PairwiseDilemmaComparison {
  questionOrder: number
  questionText: string
  category: string
  gameCategory: string
  userAnswer: { key: string; text: string; vibeTag: string }
  targetAnswer: { key: string; text: string; vibeTag: string }
  relationship: 'match' | 'complementary' | 'friction'
  verdictLabel: string
  domesticTip?: string
}

interface PairwiseComparisonResult {
  currentUser?: {
    id: string
    fullName: string
  }
  targetUser: {
    id: string
    fullName: string
    age: number
    gender: string
    occupation: string
    locality: string
    city: string
    avatarUrl?: string | null
    bio?: string
  }
  compatibility: CompatibilityScore
  dilemmaComparisons: PairwiseDilemmaComparison[]
  summaryHeadline: string
}

export type { PairwiseDilemmaComparison, PairwiseComparisonResult }

/**
 * Compute deep pairwise living comparison between logged in user and target candidate
 */
export async function getPairwiseComparison(
  targetUserId?: string,
  userAnswersOverride?: Record<number, string>
): Promise<PairwiseComparisonResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let db: any = supabase
  try {
    const admin = createAdminClient()
    if (admin) db = admin
  } catch {
    // fallback
  }

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

  const userCity = userProfile?.city || 'Pune'
  const userLocality = userProfile?.locality || 'Hinjewadi'

  // Current user living baseline
  const currentUserLiving: UserLivingData = {
    id: user?.id || 'current-user',
    fullName: currentUserName,
    gender: userProfile?.gender || 'unspecified',
    city: userCity,
    locality: userLocality,
    budgetMin: userProfile?.budget_min || 12000,
    budgetMax: userProfile?.budget_max || 25000,
    dietary: userPref?.dietary_preference || 'eggetarian',
    smoking: userPref?.smoking_tolerance || 'non_smoker',
    drinking: userPref?.drinking_tolerance || 'social',
    sleepingSchedule: userPref?.sleeping_schedule || 'night_owl',
    workSchedule: userPref?.work_schedule || 'hybrid',
    cleanlinessLevel: userPref?.cleanliness_level || 4,
    petTolerance: userPref?.pet_tolerance || 'pet_friendly',
    socialLifestyle: userPref?.social_lifestyle || 'balanced',
    preferredGender: 'any',
    hobbies: userPref?.hobbies?.length ? userPref.hobbies : ['☕ Coffee Brewing', '🏸 Badminton', '💻 Tech & Startups'],
  }

  // 1. Resolve real target profile from database
  let targetId = targetUserId
  if (!targetId || targetId.includes('aarav') || targetId.includes('-blr')) {
    // Find the first real user in the database who is not current user
    let q = db.from('profiles').select('id').eq('is_profile_public', true)
    if (user?.id) {
      q = q.neq('id', user.id)
    }
    const { data: realCandidates } = await q.order('created_at', { ascending: false }).limit(1)
    if (realCandidates && realCandidates.length > 0) {
      targetId = realCandidates[0].id
    }
  }

  let target: UserLivingData & { age: number; occupation: string; bio: string; avatarUrl?: string | null } = {
    id: 'verified-community-member',
    fullName: 'Verified Co-Liver',
    age: 23,
    gender: 'prefer_not_to_say',
    occupation: 'Tech & Product Explorer',
    city: userCity,
    locality: userLocality,
    budgetMin: currentUserLiving.budgetMin,
    budgetMax: currentUserLiving.budgetMax,
    dietary: 'eggetarian',
    smoking: 'non_smoker',
    drinking: 'social',
    sleepingSchedule: 'night_owl',
    workSchedule: 'hybrid',
    cleanlinessLevel: 4,
    petTolerance: 'pet_friendly',
    socialLifestyle: 'balanced',
    preferredGender: 'any',
    hobbies: ['☕ Coffee Brewing', '🏸 Badminton', '💻 Tech & Startups'],
    bio: `Verified member exploring shared living in ${userCity}.`,
    avatarUrl: null,
  }
  let targetAnswers: Record<number, string> = {}

  if (targetId && !targetId.includes('-blr')) {
    try {
      const { data: dbTargetProfile } = await db.from('profiles').select('*').eq('id', targetId).maybeSingle()
      if (dbTargetProfile) {
        const { data: dbTargetPref } = await db.from('user_preferences').select('*').eq('user_id', targetId).maybeSingle()
        target = {
          id: dbTargetProfile.id,
          fullName: dbTargetProfile.full_name || 'YAARO Member',
          age: dbTargetProfile.age || 23,
          gender: dbTargetProfile.gender || 'prefer_not_to_say',
          occupation: dbTargetProfile.occupation || (dbTargetProfile.company_or_college ? `@ ${dbTargetProfile.company_or_college}` : 'Co-Living Explorer'),
          city: dbTargetProfile.city || userCity,
          locality: dbTargetProfile.locality || userLocality,
          budgetMin: dbTargetProfile.budget_min || dbTargetPref?.target_budget_min || 10000,
          budgetMax: dbTargetProfile.budget_max || dbTargetPref?.target_budget_max || 25000,
          dietary: dbTargetPref?.dietary_preference || null,
          smoking: dbTargetPref?.smoking_tolerance || null,
          drinking: dbTargetPref?.drinking_tolerance || null,
          sleepingSchedule: dbTargetPref?.sleeping_schedule || null,
          workSchedule: dbTargetPref?.work_schedule || null,
          cleanlinessLevel: dbTargetPref?.cleanliness_level || 4,
          petTolerance: dbTargetPref?.pet_tolerance || null,
          socialLifestyle: dbTargetPref?.social_lifestyle || null,
          preferredGender: dbTargetPref?.preferred_gender || 'any',
          hobbies: dbTargetPref?.hobbies || ['☕ Coffee Brewing', '🏸 Badminton', '💻 Tech & Startups'],
          bio: dbTargetProfile.bio || `Exploring compatible co-living in ${dbTargetProfile.locality || dbTargetProfile.city}.`,
          avatarUrl: dbTargetProfile.avatar_url || null,
        }

        // Fetch real target user quiz answers
        const { data: dbTargetAnswers } = await db
          .from('quiz_answers')
          .select('question_id, selected_option_key')
          .eq('user_id', targetId)
        if (dbTargetAnswers && dbTargetAnswers.length > 0) {
          dbTargetAnswers.forEach((ans: any) => {
            const q = CHEMISTRY_QUESTIONS.find((cq) => cq.id === ans.question_id || cq.question_order.toString() === ans.question_id)
            const order = q ? q.question_order : parseInt(ans.question_id, 10)
            if (!isNaN(order)) targetAnswers[order] = ans.selected_option_key
          })
        }
      }
    } catch {
      // fallback
    }
  }

  // Ensure target has baseline answers for any dilemma not yet answered in quiz
  Object.keys(DEFAULT_CALIBRATED_ANSWERS).forEach((k) => {
    const numKey = Number(k)
    if (!targetAnswers[numKey]) {
      targetAnswers[numKey] = DEFAULT_CALIBRATED_ANSWERS[numKey]
    }
  })

  // 2. Fetch real user answers from database if override not provided
  let userAnswers: Record<number, string> = userAnswersOverride || {}
  if (!userAnswersOverride && user?.id) {
    try {
      const { data: dbUserAnswers } = await db
        .from('quiz_answers')
        .select('question_id, selected_option_key')
        .eq('user_id', user.id)
      if (dbUserAnswers && dbUserAnswers.length > 0) {
        dbUserAnswers.forEach((ans: any) => {
          const q = CHEMISTRY_QUESTIONS.find((cq) => cq.id === ans.question_id || cq.question_order.toString() === ans.question_id)
          const order = q ? q.question_order : parseInt(ans.question_id, 10)
          if (!isNaN(order)) userAnswers[order] = ans.selected_option_key
        })
      }
    } catch {
      // fallback
    }
  }

  // Default calibrated answers if user hasn't taken the quiz yet
  if (Object.keys(userAnswers).length === 0) {
    userAnswers = {
      1: 'B', // Night owl
      2: 'B', // Rhea's Rule
      3: 'B', // Shared cook
      4: 'C', // Balanced
      5: 'B', // Hybrid
      6: 'C', // Ambivert
      7: 'A', // Planned
      8: 'A', // High privacy
      9: 'A', // Organized
      10: 'A', // Clear communicator
      11: 'A', // 1-tap UPI
      12: 'A', // Soak warm water
      13: 'A', // Direct knock
      14: 'A', // Outsource deep cleaning
      15: 'A', // Blossom & Third Wave
      16: 'A', // Projector cinema
      17: 'A', // Roadtrip
      18: 'A', // Maggi maestro
      19: 'A', // Filter coffee
    }
  }

  const compatibility = calculateCompatibility(currentUserLiving, target)

  // Persist score in database if both are actual database users
  if (user?.id && target.id && !target.id.includes('-blr')) {
    const [uA, uB] = user.id < target.id ? [user.id, target.id] : [target.id, user.id]
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
      // non-blocking
    }
  }

  // Map each dilemma
  const dilemmaComparisons: PairwiseDilemmaComparison[] = CHEMISTRY_QUESTIONS.map((q) => {
    const userKey = userAnswers[q.question_order] || 'B'
    const targetKey = targetAnswers[q.question_order] || 'A'

    const userOpt = q.options.find((o) => o.key === userKey) || q.options[0]
    const targetOpt = q.options.find((o) => o.key === targetKey) || q.options[0]

    let relationship: 'match' | 'complementary' | 'friction' = 'match'
    let verdictLabel = 'Identical Rhythm'

    if (userKey === targetKey) {
      relationship = 'match'
      verdictLabel = 'Direct Match'
    } else {
      // Check if both are high compatibility or complementary
      const diff = Math.abs(userOpt.score_weight - targetOpt.score_weight)
      if (diff <= 3) {
        relationship = 'complementary'
        verdictLabel = 'Complementary Vibe'
      } else {
        relationship = 'friction'
        verdictLabel = 'Discuss Upfront'
      }
    }

    return {
      questionOrder: q.question_order,
      questionText: q.question_text,
      category: q.category,
      gameCategory: q.game_category,
      userAnswer: { key: userKey, text: userOpt.text, vibeTag: userOpt.vibe_tag },
      targetAnswer: { key: targetKey, text: targetOpt.text, vibeTag: targetOpt.vibe_tag },
      relationship,
      verdictLabel,
      domesticTip: q.domestic_tip,
    }
  })

  return {
    currentUser: {
      id: currentUserLiving.id,
      fullName: currentUserLiving.fullName,
    },
    targetUser: {
      id: target.id,
      fullName: target.fullName,
      age: target.age,
      gender: target.gender || 'unspecified',
      occupation: target.occupation,
      locality: target.locality || userLocality,
      city: target.city || userCity,
      avatarUrl: target.avatarUrl || null,
      bio: target.bio,
    },
    compatibility,
    dilemmaComparisons,
    summaryHeadline: `${currentUserLiving.fullName} & ${target.fullName}: ${compatibility.archetypeBadge}`,
  }
}
