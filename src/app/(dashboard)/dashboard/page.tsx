'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Home,
  Receipt,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Flame,
  User,
  Coffee,
  Sparkles,
  Sliders,
} from 'lucide-react'
import EditorialNavigation from '@/components/EditorialNavigation'
import { getCurrentUserSessionData, CurrentUserSessionData } from '@/lib/user-profile'
import { getDiscoveryFeed, type CandidateWithMatch } from '../discover/actions'

export default function DashboardPage() {
  const [userData, setUserData] = useState<CurrentUserSessionData | null>(null)
  const [topMatch, setTopMatch] = useState<CandidateWithMatch | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const data = await getCurrentUserSessionData()
      setUserData(data)
      try {
        const candidates = await getDiscoveryFeed()
        if (candidates && candidates.length > 0) {
          setTopMatch(candidates[0])
        }
      } catch {
        // Non-blocking
      }
      setIsLoading(false)
    }
    loadData()
  }, [])

  const fullName = userData?.profile?.full_name || userData?.displayName || 'YAARO Member'
  const nameParts = fullName.split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || ''
  const occupation = userData?.profile?.occupation || 'Co-Living Explorer'
  const company = userData?.profile?.company_or_college ? `@ ${userData.profile.company_or_college}` : ''
  const city = userData?.profile?.city || 'Pune'
  const locality = userData?.profile?.locality || 'Hinjewadi'
  const bio = userData?.profile?.bio || `Searching for compatible flatmates in ${locality}, ${city} who share mutual respect for domestic rhythms.`
  const profileCompletion = userData?.profile?.profile_completed_percentage || 35
  const isOnboarded = userData?.profile?.onboarded ?? false

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-12">
      {/* Universal Editorial Navigation */}
      <EditorialNavigation user={{ name: fullName, email: userData?.user?.email }} city={city} />

      {/* Editorial Ticker */}
      <div className="bg-deepgreen text-cream py-1.5 px-4 font-mono text-[11px] uppercase tracking-wider overflow-hidden border-b-2 border-deepgreen flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVING DISPATCH // {city.toUpperCase()} • {locality.toUpperCase()} • ZERO BROKERAGE VERIFIED</span>
        </div>
        <span className="hidden sm:inline text-butter font-bold">LIVE DATABASE SYNC</span>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Onboarding Incomplete Notice if user just registered */}
        {!isOnboarded && !isLoading && (
          <div className="p-4 sm:p-6 bg-butter border-2 border-deepgreen shadow-[4px_4px_0px_#263F32] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase font-bold text-tomato tracking-widest">
                STEP 02 // PROFILE CALIBRATION NEEDED
              </span>
              <h3 className="text-xl font-black uppercase text-deepgreen">
                Welcome to YAARO, {firstName}! Complete Your Living Dossier
              </h3>
              <p className="font-serif italic text-xs text-deepgreen/80">
                Calibrate your kitchen rules, sleeping schedule, and budget to unlock 100% accurate chemistry matches.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="px-6 py-2.5 bg-tomato hover:bg-deepgreen text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border border-deepgreen shadow-[2px_2px_0px_#263F32] shrink-0"
            >
              Complete Dossier Now →
            </Link>
          </div>
        )}

        {/* Masthead Banner */}
        <div className="border-b-2 border-deepgreen pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-tomato font-bold mb-1">
              <span>{userData?.user?.email || 'MEMBER DOSSIER'}</span>
              <span>•</span>
              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                {isOnboarded ? 'Calibrated Member' : 'Pending Calibration'}
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-deepgreen">
              WELCOME BACK, <br />
              <span className="font-serif italic font-normal text-tomato lowercase">{firstName.toLowerCase()}</span> {lastName}.
            </h1>
            <p className="font-serif italic text-base text-deepgreen/80 mt-1 max-w-xl">
              {occupation} {company} • {bio}
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="p-3 bg-cream-light border-2 border-deepgreen shadow-[3px_3px_0px_#263F32]">
              <span className="block text-2xl font-black font-serif text-tomato">{profileCompletion}%</span>
              <span className="uppercase text-[10px] text-deepgreen/70">Dossier Calibrated</span>
            </div>
            <div className="p-3 bg-butter border-2 border-deepgreen shadow-[3px_3px_0px_#263F32]">
              <span className="block text-2xl font-black font-serif text-deepgreen">6</span>
              <span className="uppercase text-[10px] text-deepgreen/70">Mutual Vibe Matches</span>
            </div>
          </div>
        </div>

        {/* 4 Core Quick Access Editorial Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/discover"
            className="p-6 border-2 border-deepgreen bg-cream-light hover:bg-butter/20 transition-all shadow-[4px_4px_0px_#263F32] group"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
                Tab 01 // Chemistry
              </span>
              <Users className="h-5 w-5 text-deepgreen group-hover:text-tomato transition-colors" />
            </div>
            <h3 className="text-xl font-black uppercase text-deepgreen font-serif">DISCOVER FLATMATES</h3>
            <p className="font-serif text-xs text-deepgreen/70 mt-1">
              Browse compatible flatmates in Indiranagar filtered by quiet hours and kitchen habits.
            </p>
            <span className="inline-block mt-4 font-mono text-xs text-tomato font-bold group-hover:underline">
              Enter Feed →
            </span>
          </Link>

          <Link
            href="/rooms"
            className="p-6 border-2 border-deepgreen bg-cream-light hover:bg-butter/20 transition-all shadow-[4px_4px_0px_#263F32] group"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
                Tab 02 // Directory
              </span>
              <Home className="h-5 w-5 text-deepgreen group-hover:text-tomato transition-colors" />
            </div>
            <h3 className="text-xl font-black uppercase text-deepgreen font-serif">VERIFIED FLATS</h3>
            <p className="font-serif text-xs text-deepgreen/70 mt-1">
              Private rooms with capped 2-month deposits and direct flatmate intros.
            </p>
            <span className="inline-block mt-4 font-mono text-xs text-tomato font-bold group-hover:underline">
              View Homes →
            </span>
          </Link>

          <Link
            href="/quiz"
            className="p-6 border-2 border-deepgreen bg-cream-light hover:bg-butter/20 transition-all shadow-[4px_4px_0px_#263F32] group"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
                Tab 03 // Compatibility
              </span>
              <HelpCircle className="h-5 w-5 text-deepgreen group-hover:text-tomato transition-colors" />
            </div>
            <h3 className="text-xl font-black uppercase text-deepgreen font-serif">VIBE QUIZ</h3>
            <p className="font-serif text-xs text-deepgreen/70 mt-1">
              12 domestic dilemma questions to calculate your exact domestic harmony radar.
            </p>
            <span className="inline-block mt-4 font-mono text-xs text-tomato font-bold group-hover:underline">
              Calibrate Vibe →
            </span>
          </Link>

          <Link
            href="/expenses"
            className="p-6 border-2 border-deepgreen bg-cream-light hover:bg-butter/20 transition-all shadow-[4px_4px_0px_#263F32] group"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
                Tab 04 // Ledger
              </span>
              <Receipt className="h-5 w-5 text-deepgreen group-hover:text-tomato transition-colors" />
            </div>
            <h3 className="text-xl font-black uppercase text-deepgreen font-serif">SHARED LEDGER</h3>
            <p className="font-serif text-xs text-deepgreen/70 mt-1">
              Automate rent, cook salary, and Blinkit groceries with zero awkward WhatsApp texts.
            </p>
            <span className="inline-block mt-4 font-mono text-xs text-tomato font-bold group-hover:underline">
              Open Ledger →
            </span>
          </Link>
        </div>

        {/* Featured Flatmate Match Showcase */}
        <div className="border-2 border-deepgreen bg-cream p-6 sm:p-8 shadow-[6px_6px_0px_#263F32]">
          {topMatch ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-deepgreen/20 pb-4 mb-6 gap-2">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
                    Top Compatibility Match In {topMatch.city.toUpperCase()}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase text-deepgreen font-serif">
                    {topMatch.compatibility.harmonyScore}% HARMONY VIBE MATCH
                  </h2>
                </div>
                <Link
                  href="/discover"
                  className="font-mono text-xs text-tomato font-bold hover:underline"
                >
                  Explore Discovery Feed →
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-4 relative">
                  <div className="border-2 border-deepgreen overflow-hidden relative bg-butter/30 aspect-[4/5] flex items-center justify-center">
                    {topMatch.avatarUrl ? (
                      <img
                        alt={topMatch.fullName}
                        className="w-full h-full object-cover"
                        src={topMatch.avatarUrl}
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <span className="text-6xl">🏡</span>
                        <div className="font-serif font-black text-xl text-deepgreen uppercase">
                          {topMatch.fullName}
                        </div>
                        <span className="font-mono text-[10px] uppercase text-deepgreen/60 block">
                          {topMatch.verificationTier}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-deepgreen text-cream px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                      {topMatch.compatibility.harmonyScore}% Harmony
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <div>
                    <span className="font-mono text-xs uppercase text-tomato font-bold">
                      {topMatch.locality ? `${topMatch.locality.toUpperCase()} • ` : ''}{topMatch.city.toUpperCase()}
                    </span>
                    <h3 className="text-3xl font-black uppercase text-deepgreen font-serif mt-0.5">
                      {topMatch.fullName}{topMatch.age ? `, ${topMatch.age}` : ''}
                    </h3>
                    <p className="font-mono text-xs text-deepgreen/70">
                      {topMatch.occupation}{topMatch.companyOrCollege ? ` @ ${topMatch.companyOrCollege}` : ''}
                    </p>
                  </div>

                  {/* Dynamic Badges */}
                  <div className="flex flex-wrap gap-2">
                    {topMatch.stickers.map((st, i) => (
                      <span
                        key={i}
                        className={`px-2.5 py-1 ${st.bg} ${st.text} border border-deepgreen font-mono text-xs font-bold`}
                      >
                        {st.label}
                      </span>
                    ))}
                    {topMatch.compatibility.matchingPreferences.slice(0, 2).map((m, i) => (
                      <span
                        key={'m-' + i}
                        className="px-2.5 py-1 bg-cream-light border border-deepgreen font-mono text-xs text-deepgreen"
                      >
                        ✓ {m}
                      </span>
                    ))}
                  </div>

                  <p className="font-serif italic text-sm text-deepgreen/90 leading-relaxed">
                    “{topMatch.bio}”
                  </p>

                  <div className="pt-2 flex flex-wrap gap-3">
                    <Link
                      href={`/chat?user=${topMatch.id}`}
                      className="px-6 py-3 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border border-deepgreen shadow-[3px_3px_0px_#263F32] flex items-center gap-2"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Initiate Chai Chat with {topMatch.fullName.split(' ')[0]} ↗</span>
                    </Link>
                    <Link
                      href="/discover"
                      className="px-5 py-3 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold uppercase transition-colors"
                    >
                      View All Flatmates
                    </Link>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-tomato font-bold block">
                Live Discovery Engine Active
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase text-deepgreen font-serif">
                EXPLORE COMPATIBLE FLATMATES IN {locality.toUpperCase()}
              </h2>
              <p className="font-serif italic text-sm text-deepgreen/80 max-w-lg mx-auto">
                Discover registered co-livers matching your budget (₹{userData?.profile?.budget_min || 10000} - ₹{userData?.profile?.budget_max || 25000}), clean habits, and daily rhythm.
              </p>
              <div className="pt-2">
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-tomato hover:bg-deepgreen text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border border-deepgreen shadow-[4px_4px_0px_#263F32]"
                >
                  <Users className="h-4 w-4" />
                  <span>Launch Discovery Feed →</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
