'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Flame,
  Award,
  Zap,
  Coffee,
  Moon,
  Sun,
  Utensils,
  Volume2,
  Briefcase,
  Users,
  Compass,
  AlertTriangle,
  Send,
  RefreshCw,
  Sliders,
  Check,
  ChevronRight,
  UserCheck,
} from 'lucide-react'
import EditorialNavigation from '@/components/EditorialNavigation'
import { CHEMISTRY_QUESTIONS, ChemistryQuestion } from '@/lib/chemistry-questions'
import {
  saveQuizAnswer,
  submitCategoryAnswers,
  getUserQuizAnswers,
  getPairwiseComparison,
  sendGameChallenge,
  getGameChallenges,
  type PairwiseComparisonResult,
} from './actions'
import { getDiscoveryFeed } from '../discover/actions'

type MainTab = 'games' | 'compare' | 'challenges'
type GameCategory = 'lifestyle_match' | 'personality_match' | 'roommate_situations' | 'fun_compatibility'

interface CategoryMeta {
  key: GameCategory
  title: string
  subtitle: string
  tag: string
  count: number
  icon: string
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: 'lifestyle_match',
    title: 'Lifestyle Match',
    subtitle: 'Sleep, cleanliness, food territory & WFH rhythm',
    tag: '5 Questions',
    count: 5,
    icon: '🌅',
  },
  {
    key: 'personality_match',
    title: 'Personality Match',
    subtitle: 'Social battery, spontaneous vs planned & privacy',
    tag: '4 Questions',
    count: 4,
    icon: '⚡',
  },
  {
    key: 'roommate_situations',
    title: 'Roommate Situations',
    subtitle: 'Late guests, rent split reminders & saucepan dilemmas',
    tag: '5 Questions',
    count: 5,
    icon: '🛋️',
  },
  {
    key: 'fun_compatibility',
    title: 'Fun Compatibility',
    subtitle: 'Bengaluru Sundays, midnight snacks & coffee culture',
    tag: '5 Questions',
    count: 5,
    icon: '☕',
  },
]

export default function ChemistryQuizPage() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('games')
  const [activeCategory, setActiveCategory] = useState<GameCategory>('lifestyle_match')
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({
    1: 'B',
    2: 'B',
    3: 'B',
    4: 'C',
    5: 'B',
    6: 'C',
    7: 'A',
    8: 'A',
    9: 'A',
    10: 'A',
    11: 'A',
    12: 'A',
    13: 'A',
    14: 'A',
    15: 'A',
    16: 'A',
    17: 'A',
    18: 'A',
    19: 'A',
  })
  const [candidatesList, setCandidatesList] = useState<
    Array<{
      id: string
      name: string
      role: string
      score: number
      locality?: string
      city?: string
      avatarUrl?: string | null
      gender?: string
    }>
  >([])
  const [selectedCandidate, setSelectedCandidate] = useState<string>('')
  const [comparisonData, setComparisonData] = useState<PairwiseComparisonResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')
  const [challengeSuccessMsg, setChallengeSuccessMsg] = useState<string | null>(null)
  const [challengesList, setChallengesList] = useState<any[]>([])

  // Filter questions for active game category
  const categoryQuestions = CHEMISTRY_QUESTIONS.filter((q) => q.game_category === activeCategory)
  const currentQuestion: ChemistryQuestion = categoryQuestions[currentQIndex] || categoryQuestions[0]

  // Load existing answers and comparison on mount
  useEffect(() => {
    async function loadInitial() {
      const answers = await getUserQuizAnswers()
      if (answers && Object.keys(answers).length > 0) {
        setUserAnswers((prev) => ({ ...prev, ...answers }))
      }

      let initialTargetId = ''
      try {
        const feed = await getDiscoveryFeed()
        if (feed && feed.length > 0) {
          const mapped = feed.map((c) => ({
            id: c.id,
            name: c.fullName,
            role: c.occupation || 'Co-Living Member',
            score: c.compatibility.harmonyScore,
            locality: c.locality,
            city: c.city,
            avatarUrl: c.avatarUrl,
            gender: c.gender,
          }))
          setCandidatesList(mapped)
          initialTargetId = mapped[0].id
          setSelectedCandidate(initialTargetId)
        }
      } catch (err) {
        console.error('Failed to load discovery candidates:', err)
      }

      const comparison = await getPairwiseComparison(initialTargetId || undefined)
      setComparisonData(comparison)

      const challenges = await getGameChallenges()
      setChallengesList(challenges)
    }
    loadInitial()
  }, [])

  // Recalculate comparison whenever selected candidate or answers change
  useEffect(() => {
    if (!selectedCandidate && candidatesList.length > 0) {
      setSelectedCandidate(candidatesList[0].id)
      return
    }
    startTransition(async () => {
      const comparison = await getPairwiseComparison(selectedCandidate || undefined, userAnswers)
      setComparisonData(comparison)
    })
  }, [selectedCandidate, userAnswers, candidatesList])

  const handleSelectOption = (questionOrder: number, optionKey: string) => {
    const updated = { ...userAnswers, [questionOrder]: optionKey }
    setUserAnswers(updated)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)

    // Fire and forget server persistence
    saveQuizAnswer(questionOrder, optionKey)
  }

  const handleCategorySwitch = (cat: GameCategory) => {
    setActiveCategory(cat)
    setCurrentQIndex(0)
  }

  const handleNextQuestion = () => {
    if (currentQIndex < categoryQuestions.length - 1) {
      setCurrentQIndex((prev) => prev + 1)
    } else {
      // Find next category
      const currentIdx = CATEGORIES.findIndex((c) => c.key === activeCategory)
      if (currentIdx < CATEGORIES.length - 1) {
        setActiveCategory(CATEGORIES[currentIdx + 1].key)
        setCurrentQIndex(0)
      } else {
        // Go to comparison
        setActiveMainTab('compare')
      }
    }
  }

  const handlePrevQuestion = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex((prev) => prev - 1)
    }
  }

  const handleSendChallenge = async (targetId: string, category: GameCategory) => {
    const res = await sendGameChallenge(targetId, category)
    if (res.success) {
      setChallengeSuccessMsg('Game Challenge sent successfully! We will ping them on WhatsApp & YAARO.')
      setTimeout(() => setChallengeSuccessMsg(null), 4000)
    }
  }

  // Calculate quick stats
  const answeredCount = Object.keys(userAnswers).length
  const totalQuestions = CHEMISTRY_QUESTIONS.length
  const completionPercent = Math.round((answeredCount / totalQuestions) * 100)

  // Live Harmony preview score
  const liveHarmony = comparisonData?.compatibility.harmonyScore || 94
  const liveArchetype = comparisonData?.compatibility.archetypeBadge || 'The Diplomatic Night Owls'

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-16">
      <EditorialNavigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Editorial Top Masthead */}
        <div className="border-b-2 border-deepgreen pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
                <span>VOL. 03 // YAARO CHEMISTRY ENGINE</span>
                <span>•</span>
                <span className="text-deepgreen/70">Strict 25/15/15/10/10/10/5/10 Architecture</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-deepgreen mt-0.5">
                ROOMMATE CHEMISTRY
              </h1>
              <p className="font-serif italic text-sm text-deepgreen/80 mt-1">
                Real-world domestic dilemmas: clean sinks, quiet hours, shared pantry rules, and weekend vibes.
              </p>
            </div>

            {/* Quick Completion Badge */}
            <div className="flex items-center gap-3">
              <div className="font-mono text-xs bg-butter border-2 border-deepgreen px-3 py-1 font-bold text-deepgreen shadow-[2px_2px_0px_#263F32]">
                {answeredCount}/{totalQuestions} Calibrated ({completionPercent}%)
              </div>
              {saveStatus === 'saved' && (
                <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100 border border-emerald-600 px-2 py-0.5 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-t border-deepgreen/20 mt-6 pt-4 gap-2 sm:gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveMainTab('games')}
              className={`px-4 sm:px-6 py-2.5 font-serif font-black uppercase text-xs tracking-wider border-2 transition-all shrink-0 ${
                activeMainTab === 'games'
                  ? 'bg-deepgreen text-cream border-deepgreen shadow-[3px_3px_0px_#E95D43]'
                  : 'bg-cream text-deepgreen border-deepgreen/40 hover:border-deepgreen'
              }`}
            >
              01 // The 4 Chemistry Games
            </button>
            <button
              onClick={() => setActiveMainTab('compare')}
              className={`px-4 sm:px-6 py-2.5 font-serif font-black uppercase text-xs tracking-wider border-2 transition-all shrink-0 ${
                activeMainTab === 'compare'
                  ? 'bg-deepgreen text-cream border-deepgreen shadow-[3px_3px_0px_#E95D43]'
                  : 'bg-cream text-deepgreen border-deepgreen/40 hover:border-deepgreen'
              }`}
            >
              02 // Pairwise Living Comparison
            </button>
            <button
              onClick={() => setActiveMainTab('challenges')}
              className={`px-4 sm:px-6 py-2.5 font-serif font-black uppercase text-xs tracking-wider border-2 transition-all shrink-0 ${
                activeMainTab === 'challenges'
                  ? 'bg-deepgreen text-cream border-deepgreen shadow-[3px_3px_0px_#E95D43]'
                  : 'bg-cream text-deepgreen border-deepgreen/40 hover:border-deepgreen'
              }`}
            >
              03 // Challenges & Game History
            </button>
          </div>
        </div>

        {challengeSuccessMsg && (
          <div className="p-4 bg-emerald-100 border-2 border-emerald-700 text-emerald-900 font-mono text-xs font-bold flex items-center justify-between">
            <span>✓ {challengeSuccessMsg}</span>
            <button onClick={() => setChallengeSuccessMsg(null)} className="underline">Dismiss</button>
          </div>
        )}

        {/* =========================================================================
            TAB 1: THE 4 CHEMISTRY GAMES
           ========================================================================= */}
        {activeMainTab === 'games' && (
          <div className="space-y-8">
            {/* 4 Category Selector Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {CATEGORIES.map((cat, idx) => {
                const isSelected = activeCategory === cat.key
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategorySwitch(cat.key)}
                    className={`text-left p-4 border-2 transition-all relative ${
                      isSelected
                        ? 'border-deepgreen bg-butter text-deepgreen shadow-[4px_4px_0px_#263F32]'
                        : 'border-deepgreen/30 bg-cream-light hover:border-deepgreen hover:bg-cream'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-tomato">
                        GAME 0{idx + 1}
                      </span>
                    </div>
                    <h3 className="font-serif font-black uppercase text-sm leading-tight text-deepgreen">
                      {cat.title}
                    </h3>
                    <p className="font-serif italic text-xs text-deepgreen/70 mt-1 line-clamp-1">
                      {cat.subtitle}
                    </p>
                    <div className="mt-3 font-mono text-[10px] text-deepgreen/60 uppercase font-bold">
                      {cat.tag}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Live Interactive Question Player + Radar Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Question Player (7 Cols) */}
              <div className="lg:col-span-7 bg-cream-light border-2 border-deepgreen p-6 sm:p-8 shadow-[8px_8px_0px_#263F32] relative">
                {/* Header within card */}
                <div className="flex items-center justify-between border-b border-deepgreen/20 pb-4 mb-6">
                  <div>
                    <span className="font-mono text-xs uppercase font-bold tracking-wider text-tomato">
                      Dilemma #{currentQuestion.question_order} of {totalQuestions}
                    </span>
                    <span className="mx-2 text-deepgreen/30">•</span>
                    <span className="font-mono text-xs uppercase font-bold text-deepgreen/70">
                      {currentQuestion.game_category.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="font-mono text-xs bg-cream px-2.5 py-0.5 border border-deepgreen text-deepgreen font-bold">
                    Question {currentQIndex + 1} of {categoryQuestions.length}
                  </span>
                </div>

                {/* Question Prompt */}
                <h2 className="text-2xl sm:text-3xl font-black uppercase text-deepgreen font-serif leading-snug mb-6">
                  “{currentQuestion.question_text}”
                </h2>

                {/* Option Choices */}
                <div className="space-y-3 font-serif text-sm">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = userAnswers[currentQuestion.question_order] === opt.key
                    return (
                      <div
                        key={opt.key}
                        onClick={() => handleSelectOption(currentQuestion.question_order, opt.key)}
                        className={`p-4 border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isSelected
                            ? 'border-tomato bg-tomato/5 font-bold text-deepgreen shadow-[3px_3px_0px_#E95D43]'
                            : 'border-deepgreen/30 bg-cream hover:border-deepgreen'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-tomato text-white flex items-center justify-center text-xs font-mono shrink-0">
                              ✓
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full border border-deepgreen/40 flex items-center justify-center text-xs shrink-0" />
                          )}
                          <span className="text-sm sm:text-base leading-snug">{opt.text}</span>
                        </div>
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider shrink-0 self-start sm:self-center font-bold ${
                            isSelected ? 'bg-tomato text-white' : 'bg-deepgreen/10 text-deepgreen'
                          }`}
                        >
                          {opt.vibe_tag}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Domestic Reality Tip */}
                {currentQuestion.domestic_tip && (
                  <div className="mt-6 p-4 bg-butter/30 border border-deepgreen font-mono text-xs text-deepgreen flex items-start gap-3">
                    <span className="text-base shrink-0">💡</span>
                    <div>
                      <span className="font-bold uppercase text-deepgreen">Domestic Reality: </span>
                      {currentQuestion.domestic_tip}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 pt-4 border-t border-deepgreen/20 flex justify-between items-center">
                  {currentQIndex > 0 ? (
                    <button
                      onClick={handlePrevQuestion}
                      className="font-mono text-xs text-deepgreen/70 hover:text-tomato underline font-bold"
                    >
                      ← Previous Dilemma
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-3 bg-deepgreen hover:bg-tomato text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors shadow-[3px_3px_0px_#E95D43]"
                  >
                    {currentQIndex === categoryQuestions.length - 1 ? 'Save & Next Section →' : 'Next Dilemma →'}
                  </button>
                </div>
              </div>

              {/* Live Radar Preview (5 Cols) */}
              <div className="lg:col-span-5 bg-deepgreen text-cream p-6 sm:p-8 border-2 border-deepgreen shadow-[6px_6px_0px_#E95D43] space-y-6">
                <div className="flex items-center justify-between border-b border-cream/20 pb-3">
                  <span className="font-mono text-xs uppercase tracking-widest text-butter font-bold">
                    LIVE RADAR CALIBRATION
                  </span>
                  <span className="text-xs font-mono text-emerald-400">● Active</span>
                </div>

                <div className="text-center py-2">
                  <div className="inline-flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 border-dashed border-butter text-cream mb-2">
                    <span className="text-4xl font-black font-serif text-butter">{liveHarmony}%</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-cream/70">
                      HARMONY RATING
                    </span>
                  </div>
                  <p className="font-serif italic text-cream-light text-sm mt-1">
                    Living Archetype: <span className="text-butter font-bold">{liveArchetype}</span>
                  </p>
                </div>

                {/* Dimension Weight Breakdown */}
                <div className="space-y-3 font-mono text-xs border-t border-cream/20 pt-4">
                  <div className="text-[10px] uppercase text-butter/80 tracking-wider font-bold mb-2">
                    WEIGHTED ARCHITECTURE BREAKDOWN
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>CLEANLINESS (25%)</span>
                      <span className="text-butter font-bold">{comparisonData?.compatibility.dimensionScores.cleanliness || 95}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-cream/10 rounded-none overflow-hidden">
                      <div
                        className="h-full bg-butter"
                        style={{ width: `${comparisonData?.compatibility.dimensionScores.cleanliness || 95}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>SLEEP & QUIET HOURS (15%)</span>
                      <span className="text-butter font-bold">{comparisonData?.compatibility.dimensionScores.sleep || 100}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-cream/10 rounded-none overflow-hidden">
                      <div
                        className="h-full bg-butter"
                        style={{ width: `${comparisonData?.compatibility.dimensionScores.sleep || 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>KITCHEN & FOOD (15%)</span>
                      <span className="text-butter font-bold">{comparisonData?.compatibility.dimensionScores.food || 90}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-cream/10 rounded-none overflow-hidden">
                      <div
                        className="h-full bg-butter"
                        style={{ width: `${comparisonData?.compatibility.dimensionScores.food || 90}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>SOCIAL & GUESTS (10%)</span>
                      <span className="text-butter font-bold">{comparisonData?.compatibility.dimensionScores.social || 85}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-cream/10 rounded-none overflow-hidden">
                      <div
                        className="h-full bg-butter"
                        style={{ width: `${comparisonData?.compatibility.dimensionScores.social || 85}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>WORK & WFH (10%)</span>
                      <span className="text-butter font-bold">{comparisonData?.compatibility.dimensionScores.work || 92}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-cream/10 rounded-none overflow-hidden">
                      <div
                        className="h-full bg-butter"
                        style={{ width: `${comparisonData?.compatibility.dimensionScores.work || 92}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>EXPENSE ATTITUDE (10%)</span>
                      <span className="text-butter font-bold">{comparisonData?.compatibility.dimensionScores.expenses || 96}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-cream/10 rounded-none overflow-hidden">
                      <div
                        className="h-full bg-butter"
                        style={{ width: `${comparisonData?.compatibility.dimensionScores.expenses || 96}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>SUBSTANCE & PETS (5%)</span>
                      <span className="text-butter font-bold">{comparisonData?.compatibility.dimensionScores.substances_pets || 90}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-cream/10 rounded-none overflow-hidden">
                      <div
                        className="h-full bg-butter"
                        style={{ width: `${comparisonData?.compatibility.dimensionScores.substances_pets || 90}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>SHARED PASSIONS (10%)</span>
                      <span className="text-butter font-bold">{comparisonData?.compatibility.dimensionScores.hobbies || 98}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-cream/10 rounded-none overflow-hidden">
                      <div
                        className="h-full bg-butter"
                        style={{ width: `${comparisonData?.compatibility.dimensionScores.hobbies || 98}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveMainTab('compare')}
                    className="w-full py-3 bg-tomato hover:bg-butter hover:text-deepgreen text-white font-serif font-bold uppercase tracking-wider text-xs transition-colors shadow-[3px_3px_0px_#263F32]"
                  >
                    Compare Against Flatmates →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: PAIRWISE LIVING COMPARISON
           ========================================================================= */}
        {activeMainTab === 'compare' && (
          <div className="space-y-8">
            {/* Candidate Selector Tray */}
            <div className="bg-cream-light border-2 border-deepgreen p-4 sm:p-6 shadow-[4px_4px_0px_#263F32]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-mono text-xs uppercase font-bold text-tomato tracking-wider">
                    PAIRWISE LIVING CALIBRATION
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black uppercase text-deepgreen">
                    Select A Roommate To Compare:
                  </h2>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {candidatesList.length > 0 ? (
                    candidatesList.map((cand) => (
                      <button
                        key={cand.id}
                        onClick={() => setSelectedCandidate(cand.id)}
                        className={`px-3 py-2 border-2 text-left transition-all shrink-0 flex items-center gap-2.5 ${
                          selectedCandidate === cand.id
                            ? 'border-deepgreen bg-butter text-deepgreen font-bold shadow-[2px_2px_0px_#263F32]'
                            : 'border-deepgreen/40 bg-cream hover:border-deepgreen'
                        }`}
                      >
                        <img
                          src={
                            cand.avatarUrl ||
                            (cand.gender?.toLowerCase().includes('woman')
                              ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'
                              : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80')
                          }
                          alt={cand.name}
                          className="w-9 h-9 rounded-full border border-deepgreen object-cover shrink-0"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
                          }}
                        />
                        <div>
                          <div className="font-bold text-xs uppercase flex items-center justify-between gap-3">
                            <span>{cand.name}</span>
                            <span className="text-tomato font-black">{cand.score}%</span>
                          </div>
                          <div className="text-[10px] text-deepgreen/70">
                            {cand.role} {cand.locality ? `• 📍 ${cand.locality}` : ''}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-deepgreen/60 py-2">
                      Exploring verified community profiles...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comparison Overview Banner */}
            {comparisonData && (
              <div className="bg-deepgreen text-cream border-2 border-deepgreen p-6 sm:p-8 shadow-[8px_8px_0px_#E95D43]">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-8 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-sans text-[10px] uppercase font-bold px-2 py-0.5 bg-tomato text-white">
                        HARMONY VERDICT
                      </span>
                      <span className="font-sans text-[10px] uppercase font-bold px-2 py-0.5 bg-butter text-deepgreen">
                        {comparisonData.compatibility.archetypeBadge}
                      </span>
                      {comparisonData.compatibility.hasDealBreaker ? (
                        <span className="font-sans text-[10px] uppercase font-bold px-2 py-0.5 bg-red-600 text-white">
                          DEAL-BREAKER DETECTED
                        </span>
                      ) : (
                        <span className="font-sans text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-700 text-white">
                          ZERO DEAL-BREAKERS DETECTED
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {comparisonData.targetUser.avatarUrl && (
                        <img
                          src={comparisonData.targetUser.avatarUrl}
                          alt={comparisonData.targetUser.fullName}
                          className="w-14 h-14 rounded-full border-2 border-butter object-cover shadow-[2px_2px_0px_#263F32] shrink-0"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                      <div>
                        <h2 className="text-3xl sm:text-4xl font-black uppercase text-butter">
                          {comparisonData.currentUser?.fullName || 'You'} &amp; {comparisonData.targetUser.fullName}
                        </h2>
                        <p className="font-serif italic text-cream-light text-sm max-w-2xl">
                          {comparisonData.compatibility.explanations[0]}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2 font-sans text-xs text-cream/80">
                      <div>📍 {comparisonData.targetUser.locality}, {comparisonData.targetUser.city}</div>
                      <div>💼 {comparisonData.targetUser.occupation}</div>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-cream/20 pt-4 md:pt-0 md:pl-6 text-center">
                    <div className="w-28 h-28 rounded-full border-4 border-dashed border-butter flex flex-col items-center justify-center mb-3">
                      <span className="text-4xl font-black font-serif text-butter">
                        {comparisonData.compatibility.harmonyScore}%
                      </span>
                      <span className="font-mono text-[8px] uppercase tracking-widest text-cream/70">
                        HARMONY RATING
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendChallenge(selectedCandidate || candidatesList[0]?.id, 'lifestyle_match')}
                        className="px-4 py-2 bg-tomato hover:bg-butter hover:text-deepgreen text-white font-serif font-bold uppercase text-xs tracking-wider transition-colors shadow-[2px_2px_0px_#263F32]"
                      >
                        Challenge to Game
                      </button>
                      <Link
                        href={`/chat?user=${selectedCandidate || comparisonData.targetUser?.id}`}
                        className="px-4 py-2 bg-cream text-deepgreen hover:bg-butter font-serif font-bold uppercase text-xs tracking-wider transition-colors shadow-[2px_2px_0px_#263F32]"
                      >
                        Say YAARO! (Chat)
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Strict 8-Point Dimension Visualizer */}
            {comparisonData && (
              <div className="bg-cream-light border-2 border-deepgreen p-6 sm:p-8 shadow-[6px_6px_0px_#263F32] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-deepgreen/20 pb-4">
                  <div>
                    <span className="font-mono text-xs uppercase font-bold text-tomato tracking-wider">
                      CATEGORY BREAKDOWN
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-deepgreen">
                      The 8 Compatibility Dimensions
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-deepgreen/70 font-bold">
                    Cleanliness (25%) • Sleep (15%) • Food (15%) • Others (45%)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cleanliness */}
                  <div className="border border-deepgreen/30 p-4 bg-cream space-y-2">
                    <div className="flex justify-between items-baseline font-mono text-xs font-bold text-deepgreen">
                      <span>1. CLEANLINESS & HYGIENE (25%)</span>
                      <span className="text-tomato font-black">
                        {comparisonData.compatibility.dimensionScores.cleanliness}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-deepgreen/10">
                      <div
                        className="h-full bg-tomato"
                        style={{ width: `${comparisonData.compatibility.dimensionScores.cleanliness}%` }}
                      />
                    </div>
                    <p className="font-serif italic text-xs text-deepgreen/70">
                      Dish washing cadence, common bathroom upkeep, and kitchen hygiene boundaries.
                    </p>
                  </div>

                  {/* Sleep & Quiet Hours */}
                  <div className="border border-deepgreen/30 p-4 bg-cream space-y-2">
                    <div className="flex justify-between items-baseline font-mono text-xs font-bold text-deepgreen">
                      <span>2. SLEEP SCHEDULE & QUIET HOURS (15%)</span>
                      <span className="text-tomato font-black">
                        {comparisonData.compatibility.dimensionScores.sleep}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-deepgreen/10">
                      <div
                        className="h-full bg-deepgreen"
                        style={{ width: `${comparisonData.compatibility.dimensionScores.sleep}%` }}
                      />
                    </div>
                    <p className="font-serif italic text-xs text-deepgreen/70">
                      Morning wake-up alarm rhythms, midnight focus hours, and bedroom noise etiquette.
                    </p>
                  </div>

                  {/* Dietary & Kitchen Boundaries */}
                  <div className="border border-deepgreen/30 p-4 bg-cream space-y-2">
                    <div className="flex justify-between items-baseline font-mono text-xs font-bold text-deepgreen">
                      <span>3. DIETARY & KITCHEN SHARING (15%)</span>
                      <span className="text-tomato font-black">
                        {comparisonData.compatibility.dimensionScores.food}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-deepgreen/10">
                      <div
                        className="h-full bg-emerald-700"
                        style={{ width: `${comparisonData.compatibility.dimensionScores.food}%` }}
                      />
                    </div>
                    <p className="font-serif italic text-xs text-deepgreen/70">
                      Vegetarian/eggetarian harmony, shared cook arrangements, and fridge territory.
                    </p>
                  </div>

                  {/* Social & Guest Rules */}
                  <div className="border border-deepgreen/30 p-4 bg-cream space-y-2">
                    <div className="flex justify-between items-baseline font-mono text-xs font-bold text-deepgreen">
                      <span>4. SOCIAL LIFESTYLE & GUESTS (10%)</span>
                      <span className="text-tomato font-black">
                        {comparisonData.compatibility.dimensionScores.social}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-deepgreen/10">
                      <div
                        className="h-full bg-deepgreen"
                        style={{ width: `${comparisonData.compatibility.dimensionScores.social}%` }}
                      />
                    </div>
                    <p className="font-serif italic text-xs text-deepgreen/70">
                      Overnight friends protocol, living room gatherings, and weekend socializing.
                    </p>
                  </div>

                  {/* Work & Study Habits */}
                  <div className="border border-deepgreen/30 p-4 bg-cream space-y-2">
                    <div className="flex justify-between items-baseline font-mono text-xs font-bold text-deepgreen">
                      <span>5. WORK / STUDY & WFH CADENCE (10%)</span>
                      <span className="text-tomato font-black">
                        {comparisonData.compatibility.dimensionScores.work}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-deepgreen/10">
                      <div
                        className="h-full bg-deepgreen"
                        style={{ width: `${comparisonData.compatibility.dimensionScores.work}%` }}
                      />
                    </div>
                    <p className="font-serif italic text-xs text-deepgreen/70">
                      Broadband allocation, video call noise isolation, and home desk sharing.
                    </p>
                  </div>

                  {/* Expenses & Bill Splitting */}
                  <div className="border border-deepgreen/30 p-4 bg-cream space-y-2">
                    <div className="flex justify-between items-baseline font-mono text-xs font-bold text-deepgreen">
                      <span>6. EXPENSES & BILL SPLITTING (10%)</span>
                      <span className="text-tomato font-black">
                        {comparisonData.compatibility.dimensionScores.expenses}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-deepgreen/10">
                      <div
                        className="h-full bg-tomato"
                        style={{ width: `${comparisonData.compatibility.dimensionScores.expenses}%` }}
                      />
                    </div>
                    <p className="font-serif italic text-xs text-deepgreen/70">
                      1-tap automated UPI settlement attitude, grocery sharing, and AC power split.
                    </p>
                  </div>

                  {/* Substance & Pets */}
                  <div className="border border-deepgreen/30 p-4 bg-cream space-y-2">
                    <div className="flex justify-between items-baseline font-mono text-xs font-bold text-deepgreen">
                      <span>7. SUBSTANCE & PET BOUNDARIES (5%)</span>
                      <span className="text-tomato font-black">
                        {comparisonData.compatibility.dimensionScores.substances_pets}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-deepgreen/10">
                      <div
                        className="h-full bg-emerald-700"
                        style={{ width: `${comparisonData.compatibility.dimensionScores.substances_pets}%` }}
                      />
                    </div>
                    <p className="font-serif italic text-xs text-deepgreen/70">
                      Strict non-smoking agreement, balcony policy, and pet friendliness.
                    </p>
                  </div>

                  {/* Shared Passions */}
                  <div className="border border-deepgreen/30 p-4 bg-cream space-y-2">
                    <div className="flex justify-between items-baseline font-mono text-xs font-bold text-deepgreen">
                      <span>8. SHARED PASSIONS & HOBBIES (10%)</span>
                      <span className="text-tomato font-black">
                        {comparisonData.compatibility.dimensionScores.hobbies}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-deepgreen/10">
                      <div
                        className="h-full bg-tomato"
                        style={{ width: `${comparisonData.compatibility.dimensionScores.hobbies}%` }}
                      />
                    </div>
                    <p className="font-serif italic text-xs text-deepgreen/70">
                      Coffee brewing, weekend indie gigs, badminton, and books.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Side-by-Side Dilemma Matrix */}
            {comparisonData && (
              <div className="bg-cream-light border-2 border-deepgreen p-6 sm:p-8 shadow-[6px_6px_0px_#263F32] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-deepgreen/20 pb-4">
                  <div>
                    <span className="font-mono text-xs uppercase font-bold text-tomato tracking-wider">
                      SIDE-BY-SIDE MATRIX
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-deepgreen">
                      Dilemma-by-Dilemma Comparison
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[10px] uppercase font-bold">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" /> Match
                    </span>
                    <span className="flex items-center gap-1 text-amber-700">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Complementary
                    </span>
                    <span className="flex items-center gap-1 text-tomato">
                      <span className="w-2 h-2 rounded-full bg-tomato" /> Friction
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {comparisonData.dilemmaComparisons.map((item) => {
                    const badgeBg =
                      item.relationship === 'match'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-600'
                        : item.relationship === 'complementary'
                        ? 'bg-amber-100 text-amber-800 border-amber-600'
                        : 'bg-tomato/15 text-tomato border-tomato'

                    return (
                      <div
                        key={item.questionOrder}
                        className="border-2 border-deepgreen/30 bg-cream p-4 sm:p-6 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-deepgreen/10 pb-2">
                          <span className="font-mono text-xs font-bold text-deepgreen">
                            Dilemma #{item.questionOrder}: {item.questionText}
                          </span>
                          <span
                            className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 border self-start sm:self-center shrink-0 ${badgeBg}`}
                          >
                            {item.verdictLabel}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-serif pt-1">
                          {/* Your Answer */}
                          <div className="bg-cream-light border border-deepgreen/20 p-3">
                            <div className="font-mono text-[10px] uppercase font-bold text-tomato mb-1">
                              Your Living Answer:
                            </div>
                            <div className="font-bold text-deepgreen">{item.userAnswer.text}</div>
                            <div className="font-mono text-[10px] text-deepgreen/60 mt-1">
                              Vibe: {item.userAnswer.vibeTag}
                            </div>
                          </div>

                          {/* Flatmate's Answer */}
                          <div className="bg-cream-light border border-deepgreen/20 p-3">
                            <div className="font-mono text-[10px] uppercase font-bold text-deepgreen mb-1">
                              {comparisonData.targetUser.fullName}’s Answer:
                            </div>
                            <div className="font-bold text-deepgreen">{item.targetAnswer.text}</div>
                            <div className="font-mono text-[10px] text-deepgreen/60 mt-1">
                              Vibe: {item.targetAnswer.vibeTag}
                            </div>
                          </div>
                        </div>

                        {item.domesticTip && (
                          <div className="font-mono text-[11px] text-deepgreen/70 pt-1">
                            💡 <span className="font-bold">Domestic Note:</span> {item.domesticTip}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: CHALLENGES & HISTORY
           ========================================================================= */}
        {activeMainTab === 'challenges' && (
          <div className="space-y-8">
            <div className="bg-cream-light border-2 border-deepgreen p-6 sm:p-8 shadow-[8px_8px_0px_#263F32] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-deepgreen/20 pb-4 gap-4">
                <div>
                  <span className="font-mono text-xs uppercase font-bold text-tomato tracking-wider">
                    GAME CHALLENGES
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase text-deepgreen">
                    Challenge Prospective Roommates
                  </h2>
                  <p className="font-serif italic text-xs text-deepgreen/70 mt-1">
                    Send a 3-minute Chemistry Test to prospective flatmates to see where your habits match.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const targetId = selectedCandidate || candidatesList[0]?.id
                      if (targetId) handleSendChallenge(targetId, 'lifestyle_match')
                    }}
                    className="px-4 py-2.5 bg-deepgreen hover:bg-tomato text-cream font-serif font-bold uppercase text-xs tracking-wider transition-colors shadow-[2px_2px_0px_#E95D43]"
                  >
                    + New Challenge
                  </button>
                </div>
              </div>

              {/* Active & Past Challenges */}
              <div className="space-y-4">
                {candidatesList.length > 0 ? (
                  candidatesList.map((cand, idx) => (
                    <div
                      key={cand.id}
                      className="border-2 border-deepgreen/30 bg-cream p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            cand.avatarUrl ||
                            (cand.gender?.toLowerCase().includes('woman')
                              ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
                              : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80')
                          }
                          alt={cand.name}
                          className="w-12 h-12 rounded-full border-2 border-deepgreen object-cover shrink-0 shadow-[2px_2px_0px_#263F32]"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
                          }}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase font-bold text-tomato">
                              {idx === 0 ? 'Lifestyle Match' : idx === 1 ? 'Roommate Situations' : 'Personality Match'}
                            </span>
                            <span className="text-deepgreen/30">•</span>
                            <span className="text-xs text-deepgreen/60 font-medium">Verified Active Flatmate</span>
                          </div>
                          <h4 className="text-xl font-black uppercase text-deepgreen">
                            {cand.name}
                          </h4>
                          <p className="italic text-xs text-deepgreen/70">
                            {cand.role} • 📍 {cand.locality}, {cand.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-center sm:text-right">
                          <span className="text-3xl font-black text-tomato">
                            {cand.score}%
                          </span>
                          <div className="text-[9px] uppercase tracking-wider text-deepgreen/60 font-bold">
                            Harmony Score
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedCandidate(cand.id)
                            setActiveMainTab('compare')
                          }}
                          className="px-4 py-2 border-2 border-deepgreen bg-cream hover:bg-butter font-bold uppercase text-xs tracking-wider transition-colors shadow-[2px_2px_0px_#263F32]"
                        >
                          View Breakdown →
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-deepgreen/60 border-2 border-dashed border-deepgreen/30">
                    No active roommate challenges yet. Onboard more flatmates to send chemistry challenges!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
