'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  Star,
  MessageSquare,
  MapPin,
  Clock,
  Heart,
  SlidersHorizontal,
  Bookmark,
  Award,
  AlertTriangle,
  Info,
  Coffee,
  HelpCircle,
} from 'lucide-react'
import EditorialNavigation from '@/components/EditorialNavigation'
import {
  getDiscoveryFeed,
  submitSwipeAction,
  type CandidateWithMatch,
  type DiscoveryFilters,
} from './actions'

export default function DiscoverPage() {
  const [candidates, setCandidates] = useState<CandidateWithMatch[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState<CandidateWithMatch | null>(null)
  const [mutualMatchCelebration, setMutualMatchCelebration] = useState<CandidateWithMatch | null>(null)
  const [feedbackOverlay, setFeedbackOverlay] = useState<string | null>(null)
  const [savedProfiles, setSavedProfiles] = useState<string[]>([])

  // Filter state
  const [cityFilter, setCityFilter] = useState('ALL')
  const [localityFilter, setLocalityFilter] = useState('ALL')
  const [genderFilter, setGenderFilter] = useState<'any' | 'male' | 'female'>('any')
  const [dietaryFilter, setDietaryFilter] = useState('any')
  const [smokingFilter, setSmokingFilter] = useState('any')
  const [sleepFilter, setSleepFilter] = useState('any')
  const [professionFilter, setProfessionFilter] = useState('')
  const [budgetMaxFilter, setBudgetMaxFilter] = useState<string>('any')

  useEffect(() => {
    async function loadFeed() {
      setLoading(true)
      const data = await getDiscoveryFeed({
        city: cityFilter === 'ALL' ? undefined : cityFilter,
        locality: localityFilter === 'ALL' ? undefined : localityFilter,
        gender: genderFilter,
        dietary: dietaryFilter === 'any' ? undefined : dietaryFilter,
        smoking: smokingFilter === 'any' ? undefined : smokingFilter,
        sleepingSchedule: sleepFilter === 'any' ? undefined : sleepFilter,
        profession: professionFilter.trim() || undefined,
        budgetMax: budgetMaxFilter === 'any' ? undefined : parseInt(budgetMaxFilter, 10),
      })
      setCandidates(data)
      setCurrentIndex(0)
      setLoading(false)
    }
    loadFeed()
  }, [cityFilter, localityFilter, genderFilter, dietaryFilter, smokingFilter, sleepFilter, professionFilter, budgetMaxFilter])

  const candidate = candidates[currentIndex % (candidates.length || 1)]

  const handleAction = async (action: 'roommate_like' | 'super_vibe' | 'roommate_pass' | 'listing_bookmark') => {
    if (!candidate) return

    if (action === 'listing_bookmark') {
      setSavedProfiles((prev) =>
        prev.includes(candidate.id) ? prev.filter((id) => id !== candidate.id) : [...prev, candidate.id]
      )
      return
    }

    setFeedbackOverlay(action)

    const res = await submitSwipeAction(candidate.id, action)

    setTimeout(() => {
      setFeedbackOverlay(null)
      if (res.isMutualMatch) {
        setMutualMatchCelebration(candidate)
      } else {
        setCurrentIndex((prev) => prev + 1)
      }
    }, 500)
  }

  const isSaved = candidate ? savedProfiles.includes(candidate.id) : false

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-12">
      <EditorialNavigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Editorial Top Section */}
        <div className="border-b-2 border-deepgreen pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
              <span>ISSUE 01 // CHEMISTRY FEED</span>
              <span>•</span>
              <span className="text-deepgreen/70">
                {cityFilter === 'ALL' ? 'Live Discovery Hub' : `${cityFilter} Hub`} ({candidates.length} Profiles Available)
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deepgreen mt-0.5">
              ROOMMATE DISCOVERY
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3.5 py-1.5 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold uppercase transition-colors flex items-center gap-1.5 shadow-[2px_2px_0px_#263F32]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-tomato" />
              <span>{showFilters ? 'Hide Filters' : 'Refine Feed'}</span>
            </button>
          </div>
        </div>

        {/* Real Functional Filter Drawer */}
        {showFilters && (
          <div className="p-6 border-2 border-deepgreen bg-cream-light shadow-[6px_6px_0px_#263F32] space-y-4">
            <div className="flex justify-between items-center border-b border-deepgreen/20 pb-2">
              <h3 className="font-serif font-black uppercase text-sm text-deepgreen">
                FILTERS (CALIBRATE YOUR DISCOVERY)
              </h3>
              <button
                onClick={() => {
                  setCityFilter('ALL')
                  setLocalityFilter('ALL')
                  setGenderFilter('any')
                  setDietaryFilter('any')
                  setSmokingFilter('any')
                  setSleepFilter('any')
                  setProfessionFilter('')
                  setBudgetMaxFilter('any')
                }}
                className="font-mono text-[11px] text-tomato underline hover:opacity-80"
              >
                Reset All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">CITY</label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream p-1.5 font-serif text-xs text-deepgreen focus:outline-none"
                >
                  <option value="ALL">All Cities</option>
                  <option value="Pune">Pune</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi NCR</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">LOCALITY</label>
                <input
                  type="text"
                  placeholder="e.g. Hinjewadi, Indiranagar..."
                  value={localityFilter === 'ALL' ? '' : localityFilter}
                  onChange={(e) => setLocalityFilter(e.target.value.trim() ? e.target.value : 'ALL')}
                  className="w-full border-2 border-deepgreen bg-cream p-1.5 font-serif text-xs text-deepgreen placeholder:text-deepgreen/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">MAX BUDGET</label>
                <select
                  value={budgetMaxFilter}
                  onChange={(e) => setBudgetMaxFilter(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream p-1.5 font-serif text-xs text-deepgreen focus:outline-none"
                >
                  <option value="any">Any Budget</option>
                  <option value="15000">Up to ₹15,000</option>
                  <option value="20000">Up to ₹20,000</option>
                  <option value="25000">Up to ₹25,000</option>
                  <option value="35000">Up to ₹35,000</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">GENDER</label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value as any)}
                  className="w-full border-2 border-deepgreen bg-cream p-1.5 font-serif text-xs text-deepgreen focus:outline-none"
                >
                  <option value="any">All Genders</option>
                  <option value="female">Women Only</option>
                  <option value="male">Men Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">DIET</label>
                <select
                  value={dietaryFilter}
                  onChange={(e) => setDietaryFilter(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream p-1.5 font-serif text-xs text-deepgreen focus:outline-none"
                >
                  <option value="any">Any Dietary Habit</option>
                  <option value="vegetarian">Strict Veg Only</option>
                  <option value="eggetarian">Eggetarian</option>
                  <option value="non_vegetarian">Non-Veg Friendly</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">SLEEP RHYTHM</label>
                <select
                  value={sleepFilter}
                  onChange={(e) => setSleepFilter(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream p-1.5 font-serif text-xs text-deepgreen focus:outline-none"
                >
                  <option value="any">Any Rhythm</option>
                  <option value="night_owl">Night Owls Only</option>
                  <option value="early_bird">Early Birds Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">SMOKING</label>
                <select
                  value={smokingFilter}
                  onChange={(e) => setSmokingFilter(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream p-1.5 font-serif text-xs text-deepgreen focus:outline-none"
                >
                  <option value="any">Any Smoking Habit</option>
                  <option value="non_smoker">Non-Smoker Only</option>
                  <option value="outside_only">Outside / Balcony Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-deepgreen/70 mb-1">PROFESSION / COLLEGE</label>
                <input
                  type="text"
                  placeholder="e.g. Student, Engineer..."
                  value={professionFilter}
                  onChange={(e) => setProfessionFilter(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream p-1.5 font-serif text-xs text-deepgreen placeholder:text-deepgreen/40 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Discovery Feed Stage */}
        {loading ? (
          <div className="p-12 border-2 border-deepgreen bg-cream-light text-center font-serif text-xl font-bold text-deepgreen shadow-[6px_6px_0px_#263F32]">
            Calibrating Roommate Chemistry Scores...
          </div>
        ) : !candidate ? (
          <div className="p-12 border-2 border-deepgreen bg-cream-light text-center space-y-4 shadow-[6px_6px_0px_#263F32]">
            <h3 className="text-2xl font-black uppercase text-deepgreen font-serif">
              {candidates.length === 0 ? 'NO MATCHING FLATMATES FOUND' : 'ALL CANDIDATES EVALUATED'}
            </h3>
            <p className="font-serif italic text-sm text-deepgreen/80 max-w-md mx-auto">
              {candidates.length === 0
                ? 'No flatmate profiles match your current criteria. When new members register and calibrate their living dossiers in this area, they will appear here automatically.'
                : 'You have reviewed all available profiles for this search filter. Reset filters to explore more candidates.'}
            </p>
            <button
              onClick={() => {
                setCityFilter('ALL')
                setLocalityFilter('ALL')
                setGenderFilter('any')
                setDietaryFilter('any')
                setSmokingFilter('any')
                setSleepFilter('any')
                setProfessionFilter('')
                setBudgetMaxFilter('any')
              }}
              className="px-6 py-2.5 bg-tomato hover:bg-deepgreen text-cream font-serif font-bold uppercase text-xs shadow-[2px_2px_0px_#263F32] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="border-2 border-deepgreen bg-cream-light shadow-[8px_8px_0px_#263F32] overflow-hidden relative">
            {/* Action Feedback Overlay */}
            {feedbackOverlay && (
              <div className="absolute inset-0 bg-deepgreen/90 z-30 flex items-center justify-center text-cream font-serif text-4xl font-black uppercase animate-fade-in">
                {feedbackOverlay === 'roommate_pass' && 'Passed'}
                {feedbackOverlay === 'super_vibe' && '★ Super Vibe Dispatched!'}
                {feedbackOverlay === 'roommate_like' && '⚡ Said YAARO!'}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Left 35mm Portrait Area */}
              <div className="md:col-span-5 relative border-b-2 md:border-b-0 md:border-r-2 border-deepgreen bg-sand/30 flex flex-col justify-between">
                <div className="relative">
                  <img
                    src={
                      candidate.avatarUrl
                        ? candidate.avatarUrl
                        : candidate.gender?.toLowerCase().includes('man') || candidate.gender?.toLowerCase() === 'male'
                        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
                        : candidate.gender?.toLowerCase().includes('woman') || candidate.gender?.toLowerCase() === 'female'
                        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'
                        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={candidate.fullName}
                    className="w-full h-80 md:h-[440px] object-cover"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.onerror = null
                      const isMale =
                        candidate.gender?.toLowerCase().includes('man') || candidate.gender?.toLowerCase() === 'male'
                      const isFemale =
                        candidate.gender?.toLowerCase().includes('woman') || candidate.gender?.toLowerCase() === 'female'
                      target.src = isMale
                        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
                        : isFemale
                        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'
                        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80'
                    }}
                  />
                  {/* Dynamic Match Score Tag */}
                  <div className="absolute top-3 left-3 bg-deepgreen text-cream px-3 py-1 font-mono text-xs font-bold uppercase border border-deepgreen shadow-[2px_2px_0px_#E95D43]">
                    {candidate.compatibility.harmonyScore}% Chemistry Match
                  </div>

                  <button
                    onClick={() => handleAction('listing_bookmark')}
                    className={`absolute top-3 right-3 p-2 border border-deepgreen transition-colors ${
                      isSaved ? 'bg-tomato text-cream' : 'bg-cream text-deepgreen hover:bg-butter'
                    }`}
                    title={isSaved ? 'Saved to bookmarks' : 'Save profile'}
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>

                  <div className="absolute bottom-3 left-3 bg-cream/95 text-deepgreen px-3 py-1 font-mono text-[11px] font-bold border border-deepgreen">
                    📍 {candidate.locality}
                  </div>
                </div>

                {/* Archetype Indicator */}
                <div className="p-3 bg-deepgreen text-cream text-center font-mono text-xs font-bold border-t-2 border-deepgreen">
                  ARCHETYPE: <span className="text-butter">{candidate.compatibility.archetypeBadge}</span>
                </div>
              </div>

              {/* Right Dossier Specifications */}
              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-baseline justify-between border-b border-deepgreen/20 pb-3 mb-4">
                    <div>
                      <h2 className="text-3xl font-black uppercase text-deepgreen font-serif">
                        {candidate.fullName}, {candidate.age}
                      </h2>
                      <p className="font-mono text-xs text-tomato font-bold uppercase tracking-wider mt-0.5">
                        {candidate.occupation} @ {candidate.companyOrCollege}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-deepgreen/60">
                      {candidate.gender}
                    </span>
                  </div>

                  {/* Certified Lifestyle Stickers */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {candidate.stickers.map((s, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 font-mono text-xs border border-deepgreen ${s.bg} ${s.text} font-bold shadow-[1px_1px_0px_#263F32]`}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>

                  {/* Bio */}
                  <div className="p-4 bg-cream border border-deepgreen mb-4">
                    <p className="font-serif italic text-sm text-deepgreen leading-relaxed">
                      “{candidate.bio}”
                    </p>
                  </div>

                  {/* Why You Match Explainer */}
                  <div className="p-3 bg-butter/30 border border-deepgreen mb-4">
                    <span className="font-mono text-[10px] uppercase font-bold text-deepgreen block mb-1">
                      WHY YOU MATCH (ALGORITHM BREAKDOWN):
                    </span>
                    <ul className="space-y-1 font-serif text-xs text-deepgreen/90 list-disc list-inside">
                      {candidate.compatibility.explanations.slice(0, 2).map((exp, i) => (
                        <li key={i}>{exp}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Potential Conflicts / Deal Breakers */}
                  {candidate.compatibility.hasDealBreaker ? (
                    <div className="p-3 bg-red-50 border border-red-500 text-red-800 text-xs font-mono mb-4 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                      <span>{candidate.compatibility.dealBreakers[0]}</span>
                    </div>
                  ) : candidate.compatibility.conflictingPreferences.length > 0 ? (
                    <div className="p-2.5 bg-sand/30 border border-deepgreen text-deepgreen/80 text-[11px] font-mono mb-4 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-tomato shrink-0" />
                      <span>Note: {candidate.compatibility.conflictingPreferences[0]}</span>
                    </div>
                  ) : null}

                  {/* Quick Logistics Radar */}
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs border-t border-deepgreen/20 pt-3">
                    <div>
                      <span className="text-[10px] text-deepgreen/60 uppercase block">BUDGET TOLERANCE</span>
                      <span className="font-bold text-deepgreen">
                        ₹{candidate.budgetMin.toLocaleString()} - ₹{candidate.budgetMax.toLocaleString()}/mo
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-deepgreen/60 uppercase block">MOVE-IN TIMELINE</span>
                      <span className="font-bold text-deepgreen">{candidate.moveInDate}</span>
                    </div>
                  </div>
                </div>

                {/* Action Tray & Modal Trigger */}
                <div className="space-y-3 pt-4 border-t-2 border-deepgreen">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleAction('roommate_pass')}
                      className="w-14 h-14 rounded-full border-2 border-deepgreen bg-cream hover:bg-red-50 text-deepgreen hover:text-red-600 flex items-center justify-center transition-all shadow-[3px_3px_0px_#263F32] shrink-0"
                      title="Pass"
                    >
                      <X className="h-6 w-6" />
                    </button>

                    <button
                      onClick={() => handleAction('super_vibe')}
                      className="w-14 h-14 rounded-full border-2 border-deepgreen bg-butter hover:bg-yellow-300 text-deepgreen flex items-center justify-center transition-all shadow-[3px_3px_0px_#263F32] shrink-0"
                      title="Super Vibe (Simulates Mutual Match)"
                    >
                      <Star className="h-6 w-6 fill-deepgreen" />
                    </button>

                    <button
                      onClick={() => handleAction('roommate_like')}
                      className="flex-1 py-4 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border-2 border-deepgreen shadow-[4px_4px_0px_#263F32] flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Say YAARO! (Connect) ↗</span>
                    </button>

                    <Link
                      href={`/chat?user=${candidate.id}`}
                      className="px-4 py-4 bg-deepgreen hover:bg-deepgreen/90 text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border-2 border-deepgreen shadow-[4px_4px_0px_#263F32] flex items-center justify-center gap-2"
                      title={`Chat directly with ${candidate.fullName}`}
                    >
                      <MessageSquare className="h-4 w-4 text-butter" />
                      <span className="hidden sm:inline">Chat</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedCandidateForModal(candidate)}
                      className="py-2 border border-deepgreen bg-cream hover:bg-butter font-mono text-[11px] font-bold uppercase text-deepgreen text-center transition-colors"
                    >
                      Inspect Living Dossier →
                    </button>
                    <Link
                      href={`/quiz`}
                      className="py-2 border border-deepgreen bg-butter hover:bg-yellow-300 font-mono text-[11px] font-bold uppercase text-deepgreen text-center transition-colors"
                    >
                      Compare Living Dilemmas ↗
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MUTUAL MATCH CELEBRATION MODAL */}
        {mutualMatchCelebration && (
          <div className="fixed inset-0 z-50 bg-deepgreen/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-cream border-4 border-tomato p-6 sm:p-10 shadow-[10px_10px_0px_#263F32] text-center space-y-6 animate-scale-up">
              <span className="font-mono text-xs uppercase px-3 py-1 bg-butter border border-deepgreen font-bold text-deepgreen">
                MUTUAL YAARO MATCH DETECTED!
              </span>

              <h2 className="text-4xl sm:text-5xl font-black uppercase text-deepgreen font-serif leading-none">
                YOU &amp; {mutualMatchCelebration.fullName} <br />
                <span className="font-serif italic text-tomato lowercase font-normal">vibe at</span> {mutualMatchCelebration.compatibility.harmonyScore}%
              </h2>

              <p className="font-serif italic text-base text-deepgreen/90">
                Both of you liked each other’s living dossiers. You both share quiet focus hours and respect kitchen hygiene.
              </p>

              <div className="p-4 bg-cream-light border-2 border-deepgreen text-left font-mono text-xs space-y-1">
                <p className="font-bold text-deepgreen">✓ Chat Unlocked Instantly</p>
                <p className="text-deepgreen/70">✓ Direct 1-Page Flat Rules Agreement Available</p>
                <p className="text-deepgreen/70">✓ Safe &amp; Zero Brokerage</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href={`/chat?user=${mutualMatchCelebration.id}`}
                  className="w-full py-3.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs border border-deepgreen shadow-[3px_3px_0px_#263F32] flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Initiate Chai Chat with {mutualMatchCelebration.fullName.split(' ')[0]} ↗</span>
                </Link>
                <button
                  onClick={() => {
                    setMutualMatchCelebration(null)
                    setCurrentIndex((prev) => prev + 1)
                  }}
                  className="w-full py-3.5 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold uppercase"
                >
                  Keep Browsing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DETAILED LIVING DOSSIER MODAL */}
        {selectedCandidateForModal && (
          <div className="fixed inset-0 z-50 bg-deepgreen/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-2xl w-full bg-cream-light border-2 border-deepgreen p-6 sm:p-8 shadow-[10px_10px_0px_#263F32] space-y-6 my-8">
              <div className="flex justify-between items-start border-b-2 border-deepgreen pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
                    FULL LIVING DOSSIER
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-deepgreen font-serif">
                    {selectedCandidateForModal.fullName}, {selectedCandidateForModal.age}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCandidateForModal(null)}
                  className="p-1 border border-deepgreen bg-cream hover:bg-red-50 text-deepgreen"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 8-Point Harmony Radar Grid */}
              <div>
                <h4 className="font-mono text-xs uppercase font-bold text-deepgreen mb-3">
                  8-POINT HARMONY RADAR BREAKDOWN (25/15/15/10/10/10/5/10 WEIGHTS)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  <div className="p-2.5 border border-deepgreen bg-cream">
                    <span className="text-[10px] text-deepgreen/60 block">CLEANLINESS (25%)</span>
                    <span className="text-sm font-bold text-tomato">
                      {selectedCandidateForModal.compatibility.dimensionScores.cleanliness}%
                    </span>
                  </div>
                  <div className="p-2.5 border border-deepgreen bg-cream">
                    <span className="text-[10px] text-deepgreen/60 block">SLEEP RHYTHM (15%)</span>
                    <span className="text-sm font-bold text-deepgreen">
                      {selectedCandidateForModal.compatibility.dimensionScores.sleep}%
                    </span>
                  </div>
                  <div className="p-2.5 border border-deepgreen bg-cream">
                    <span className="text-[10px] text-deepgreen/60 block">DIETARY &amp; FOOD (15%)</span>
                    <span className="text-sm font-bold text-deepgreen">
                      {selectedCandidateForModal.compatibility.dimensionScores.food}%
                    </span>
                  </div>
                  <div className="p-2.5 border border-deepgreen bg-cream">
                    <span className="text-[10px] text-deepgreen/60 block">SOCIAL VIBE (10%)</span>
                    <span className="text-sm font-bold text-deepgreen">
                      {selectedCandidateForModal.compatibility.dimensionScores.social}%
                    </span>
                  </div>
                  <div className="p-2.5 border border-deepgreen bg-cream">
                    <span className="text-[10px] text-deepgreen/60 block">WORK SCHEDULE (10%)</span>
                    <span className="text-sm font-bold text-deepgreen">
                      {selectedCandidateForModal.compatibility.dimensionScores.work}%
                    </span>
                  </div>
                  <div className="p-2.5 border border-deepgreen bg-cream">
                    <span className="text-[10px] text-deepgreen/60 block">EXPENSES (10%)</span>
                    <span className="text-sm font-bold text-deepgreen">
                      {selectedCandidateForModal.compatibility.dimensionScores.expenses}%
                    </span>
                  </div>
                  <div className="p-2.5 border border-deepgreen bg-cream">
                    <span className="text-[10px] text-deepgreen/60 block">SUBSTANCE/PET (5%)</span>
                    <span className="text-sm font-bold text-deepgreen">
                      {selectedCandidateForModal.compatibility.dimensionScores.substances_pets}%
                    </span>
                  </div>
                  <div className="p-2.5 border border-deepgreen bg-cream">
                    <span className="text-[10px] text-deepgreen/60 block">HOBBIES (10%)</span>
                    <span className="text-sm font-bold text-tomato">
                      {selectedCandidateForModal.compatibility.dimensionScores.hobbies}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Matching Preferences */}
              <div className="p-4 bg-butter/30 border border-deepgreen space-y-2">
                <span className="font-mono text-xs uppercase font-bold text-deepgreen block">
                  SHARED PASSIONS &amp; LIFESTYLE SIMILARITIES
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidateForModal.compatibility.matchingPreferences.map((m, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-cream border border-deepgreen font-mono text-[11px] font-bold text-deepgreen"
                    >
                      ✓ {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/quiz?target=${selectedCandidateForModal.id}`}
                  className="px-4 py-2.5 bg-deepgreen text-cream hover:bg-tomato transition-colors font-serif font-bold uppercase text-xs shadow-[2px_2px_0px_#E95D43] flex items-center gap-1.5"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Compare Chemistry ↗</span>
                </Link>

                <Link
                  href={`/chat?user=${selectedCandidateForModal.id}`}
                  className="px-4 py-2.5 bg-butter text-deepgreen hover:bg-yellow-300 transition-colors font-serif font-bold uppercase text-xs border border-deepgreen shadow-[2px_2px_0px_#263F32] flex items-center gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-tomato" />
                  <span>Direct Chat ↗</span>
                </Link>

                <button
                  onClick={() => {
                    setSelectedCandidateForModal(null)
                    handleAction('roommate_like')
                  }}
                  className="px-6 py-2.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase text-xs shadow-[2px_2px_0px_#263F32]"
                >
                  Say YAARO! (Connect) ↗
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
