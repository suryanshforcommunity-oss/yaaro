'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface RoomItem {
  id: string
  title: string
  city: string
  rentMonthly: number
  securityDeposit: number
  roomType: string
  furnishedType: string
  amenities: string[]
  images: string[]
  description: string
}

const TOP_CITIES = ['ALL', 'PUNE', 'MUMBAI', 'NAGPUR', 'BANGALORE', 'HYDERABAD'] as const
type CityFilter = (typeof TOP_CITIES)[number]

export default function HomePage() {
  const [selectedOption, setSelectedOption] = useState<number>(1)
  const [activeCity, setActiveCity] = useState<CityFilter>('ALL')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)
  const [walkthroughBooked, setWalkthroughBooked] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [liveRooms, setLiveRooms] = useState<RoomItem[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(true)

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUser(user)
        }

        const { data: rooms } = await (supabase.from('room_listings') as any)
          .select('id, title, city, rent_monthly, security_deposit, room_type, furnished_type, amenities, neighborhood_vibe, description')
          .eq('status', 'active')
          .limit(12)

        if (rooms && rooms.length > 0) {
          const formatted: RoomItem[] = rooms.map((r: any) => {
            let images: string[] = []
            try {
              if (r.neighborhood_vibe) {
                const parsed = typeof r.neighborhood_vibe === 'string' ? JSON.parse(r.neighborhood_vibe) : r.neighborhood_vibe
                images = parsed.images || []
              }
            } catch {}
            if (images.length === 0) {
              images = ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80']
            }
            return {
              id: r.id,
              title: r.title,
              city: r.city || 'Pune',
              rentMonthly: r.rent_monthly || 0,
              securityDeposit: r.security_deposit || 0,
              roomType: r.room_type || 'private',
              furnishedType: r.furnished_type ? r.furnished_type.replace('_', ' ') : 'furnished',
              amenities: Array.isArray(r.amenities) ? r.amenities.slice(0, 4) : ['Attached Bath', 'WiFi'],
              images,
              description: r.description || 'Verified shared living space.'
            }
          })
          setLiveRooms(formatted)
        }
      } catch (err) {
        console.error('Failed to load room listings:', err)
      } finally {
        setIsLoadingRooms(false)
      }
    }
    loadData()
  }, [])

  const filteredRooms = liveRooms.filter((r) => {
    if (activeCity === 'ALL') return true
    return r.city.toUpperCase() === activeCity
  })

  const heroPhotoUrl =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBVwwHS5iS6Ep9fsOBPewI7yo-EzuAB4VRZscQ7ODIyISDc1LpIQrPgrNVuAaNyvkWO9HbDWx_RUMSAGRN5wht1JHFcWl4pv_QgUt5w3jxy-Nw8F6XA0ErHTOX-fzugt9_TO0ZT-couYEVGuTWl0y16ptQ1I6zmm2N_Zg8LsuPpwbdJ9-e-qjmVHiWLi2YKfjfzDM24UmrFYheiY-ICEG9B9sFfM99-xBDkxLxb7y7XKoLQYz7wHCq0-Ic0txzQJWI'

  const heroFallbackUrl =
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80'

  const questions = [
    {
      text: 'Zero tolerance: Wash and rack dishes immediately after dinner.',
      label: 'Strict',
    },
    {
      text: 'Soak overnight with warm water, clean before morning chai.',
      label: "Rhea's Rule",
      featured: true,
    },
    {
      text: 'Cook does not wash pans: Flatmates wash their own plates.',
      label: 'Divided',
    },
    {
      text: 'Maid comes at 10 AM anyway, leave it in the vessel basket.',
      label: 'Relaxed',
    },
  ]

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true)
      setNewsletterEmail('')
    }
  }

  return (
    <div className="bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white min-h-screen">
      {/* =========================================================
          SECTION 1: EXPRESSIVE EDITORIAL HEADER
      ========================================================= */}
      <header className="border-b-2 border-deepgreen px-3 sm:px-6 py-1.5 bg-cream sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Masthead Branding */}
          <div className="flex items-baseline gap-2.5">
            <Link href="/" className="text-2xl sm:text-3xl font-black tracking-tighter uppercase font-serif text-deepgreen hover:opacity-95 transition-opacity inline-block">
              YAARO
              <span className="text-tomato font-serif italic text-xl sm:text-2xl lowercase">
                .live
              </span>
            </Link>
            <span className="hidden xl:inline text-[10px] font-mono tracking-wider uppercase text-deepgreen/60 border-l border-deepgreen/30 pl-2.5">
              “Find your people. Find your place.”
            </span>
          </div>

          {/* Editorial Nav Links & Primary Action */}
          <div className="flex items-center gap-3 sm:gap-5 font-mono text-xs uppercase tracking-wider">
            <nav className="flex items-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs">
              <a
                href="#manifesto"
                className="hover:text-tomato transition-colors underline decoration-tomato decoration-2 underline-offset-4 font-bold"
              >
                01. Manifesto
              </a>
              <a
                href="#chemistry"
                className="hover:text-tomato transition-colors underline decoration-deepgreen/30 decoration-1 underline-offset-4"
              >
                02. Chemistry
              </a>
              <a
                href="#directory"
                className="hover:text-tomato transition-colors underline decoration-deepgreen/30 decoration-1 underline-offset-4"
              >
                03. Directory
              </a>
              {currentUser ? (
                <>
                  <Link
                    href="/discover"
                    prefetch={true}
                    className="hover:text-tomato transition-colors underline decoration-deepgreen/30 decoration-1 underline-offset-4 hidden sm:inline"
                  >
                    04. Discover
                  </Link>
                  <Link
                    href="/dashboard"
                    prefetch={true}
                    className="hover:text-tomato transition-colors underline decoration-tomato decoration-2 underline-offset-4 font-bold text-tomato hidden sm:inline"
                  >
                    05. Dashboard
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  prefetch={true}
                  className="hover:text-tomato transition-colors underline decoration-deepgreen/30 decoration-1 underline-offset-4 hidden sm:inline"
                >
                  04. Sign In
                </Link>
              )}
            </nav>
            {currentUser ? (
              <Link
                href="/dashboard"
                prefetch={true}
                className="px-3 py-1 bg-tomato hover:bg-tomato-dark text-cream-light font-serif font-bold tracking-tight rounded-full transition-all shadow-[2px_2px_0px_#263F32] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#263F32] flex items-center gap-1 text-[11px] sm:text-xs"
              >
                <span>Enter Dashboard</span>
                <span className="text-[10px]">↗</span>
              </Link>
            ) : (
              <Link
                href="/signup"
                prefetch={true}
                className="px-3 py-1 bg-tomato hover:bg-tomato-dark text-cream-light font-serif font-bold tracking-tight rounded-full transition-all shadow-[2px_2px_0px_#263F32] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#263F32] flex items-center gap-1 text-[11px] sm:text-xs"
              >
                <span>Join Collective</span>
                <span className="text-[10px]">↗</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================
          SECTION 2: HERO SECTION (ASYMMETRIC MAGAZINE SPREAD)
      ========================================================= */}
      <section className="border-b-2 border-deepgreen relative overflow-hidden lg:min-h-[calc(100vh-50px)] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left Column: Oversized Asymmetric Typography & Context (7 Cols) */}
          <div className="lg:col-span-7 p-3.5 sm:p-4 lg:p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r-2 border-deepgreen relative bg-cream">
            {/* Metadata Row */}
            <div className="flex items-center justify-between border-b border-deepgreen/20 pb-1 mb-2 text-xs font-mono">
              <span className="bg-deepgreen text-cream px-2 py-0.5 font-bold uppercase tracking-wider font-mono text-[9px] sm:text-[10px]">
                Modern Shared Living
              </span>
              <span className="text-deepgreen/70 text-[10px] sm:text-[11px]">READ TIME: 2 MIN</span>
            </div>

            {/* Massive Headline in Playfair Display */}
            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-[11px] uppercase font-mono tracking-widest text-tomato font-bold">
                A better way to share a home
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-[42px] xl:text-[50px] font-black uppercase tracking-tight leading-[0.92] text-deepgreen font-serif">
                ROOMMATES? <br />
                <span className="font-serif italic font-normal text-tomato tracking-normal lowercase">
                  nah.
                </span>{' '}
                <br />
                YOUR PEOPLE.
              </h2>
              <div className="w-10 h-0.5 bg-tomato mt-1" />
            </div>

            {/* Narrative Subtext in Cursive Font & Interactive Badges */}
            <div className="mt-2 pt-2 border-t border-deepgreen/20 space-y-2.5">
              <p
                style={{ fontFamily: "'Dancing Script', 'Caveat', 'Segoe Script', 'Brush Script MT', 'Lucida Handwriting', cursive" }}
                className="font-cursive text-xl sm:text-2xl md:text-[25px] text-deepgreen leading-snug tracking-wide font-normal max-w-xl italic"
              >
                Shared-living in urban India is broken by brokers, awkward splitwise delays, and
                clashing lifestyle rhythms.{' '}
                <span className="font-bold text-tomato underline decoration-tomato/40 underline-offset-4">YAARO</span> is where you discover
                flatmates who match your exact kitchen rules, weekend chai rituals, midnight focus
                hours, and rent expectations.
              </p>

              {/* Asymmetric Spec Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5 font-mono text-xs">
                <div className="p-1.5 sm:p-2 bg-butter/40 border border-deepgreen rounded-none">
                  <span className="block text-tomato font-bold text-xs sm:text-sm font-serif">0%</span>
                  <span className="uppercase tracking-tight text-deepgreen/80 text-[9px] sm:text-[10px]">
                    Brokerage forever
                  </span>
                </div>
                <div className="p-1.5 sm:p-2 bg-cream-light border border-deepgreen rounded-none">
                  <span className="block text-deepgreen font-bold text-xs sm:text-sm font-serif">
                    2 Months
                  </span>
                  <span className="uppercase tracking-tight text-deepgreen/80 text-[9px] sm:text-[10px]">
                    Max Deposit
                  </span>
                </div>
                <div className="p-1.5 sm:p-2 bg-deepgreen text-cream border border-deepgreen rounded-none col-span-2 sm:col-span-1">
                  <span className="block text-butter font-bold text-xs sm:text-sm font-serif">94%+</span>
                  <span className="uppercase tracking-tight text-cream/80 text-[9px] sm:text-[10px]">
                    Harmony Rate
                  </span>
                </div>
              </div>

              {/* Micro CTA & Proof */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-0.5">
                <a
                  href="#directory"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-deepgreen text-cream hover:bg-tomato transition-all font-serif font-bold uppercase tracking-wider text-[11px] sm:text-xs shadow-[3px_3px_0px_#E95D43]"
                >
                  <span>Explore Verified Spaces Across Top Cities</span>
                  <span>↓</span>
                </a>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-deepgreen/70">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>2,800+ verified members active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Candid Editorial Visual Spread (5 Cols) */}
          <div className="lg:col-span-5 bg-butter/30 relative flex flex-col justify-between p-3.5 sm:p-4 lg:p-5">
            {/* Butter Yellow Block & Overlapping Editorial Image */}
            <div className="relative z-10 my-auto">
              {/* Background Geometric Highlight Tile */}
              <div className="absolute -top-2.5 -right-2 w-24 h-24 bg-butter rounded-none -z-10 border border-deepgreen hidden sm:block" />

              {/* Editorial Photo Container with Tape & Caption */}
              <div className="relative bg-cream-light p-2 pb-2.5 border-2 border-deepgreen shadow-[3px_3px_0px_#263F32]">
                {/* Analog Camera Stamp Tag */}
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-deepgreen/20 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-deepgreen/80">
                  <span>Verified Co-Living Collective</span>
                  <span className="text-tomato font-bold">VERIFIED CO-LIVING</span>
                </div>

                <div className="overflow-hidden relative group">
                  <img
                    alt="Two flatmates laughing over chai at sunlit apartment table"
                    className="w-full h-[180px] sm:h-[200px] lg:h-[190px] xl:h-[220px] object-cover grayscale-[15%] contrast-[1.05] group-hover:grayscale-0 transition-all duration-500"
                    src={heroPhotoUrl}
                    onError={(e) => {
                      // Graceful fallback to verified lifestyle photograph
                      ;(e.target as HTMLImageElement).src = heroFallbackUrl
                    }}
                  />
                  <div className="absolute bottom-2 left-2 bg-deepgreen/90 text-cream px-2 py-0.5 text-[9px] sm:text-[10px] font-mono tracking-wider backdrop-blur-sm border border-cream/20">
                    Aarav (24, SDE) &amp; Rhea (24, Designer)
                  </div>
                </div>

                {/* Authentic Caption Snippet */}
                <div className="pt-1 font-serif italic text-[11px] sm:text-xs text-deepgreen/90 leading-snug">
                  “We matched on weekend badminton &amp; quiet weekday WFH hours. Moved into a sunlit
                  apartment together within 4 days.”
                </div>
              </div>

              {/* Secondary Overlapping Tag */}
              <div className="mt-2 -ml-1 bg-tomato text-cream px-2 py-0.5 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest inline-flex items-center gap-1.5 border border-deepgreen shadow-[2px_2px_0px_#263F32]">
                <span>⚡ HARMONY SCORE: 96%</span>
                <span>• NON-SMOKER FLAT</span>
              </div>
            </div>

            {/* Bottom Detail Footnote */}
            <div className="border-t border-deepgreen/20 pt-1.5 mt-2 flex justify-between items-center text-[9px] sm:text-[10px] font-mono text-deepgreen/60">
              <span>SOURCE: YAARO COMMUNITY DIARIES</span>
              <span>EST. 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 3: BRAND STORY & CULTURAL MANIFESTO (ASYMMETRIC)
      ========================================================= */}
      <section
        className="border-b-2 border-deepgreen bg-cream-light py-16 px-6 md:px-12"
        id="manifesto"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Bold Editorial Callout & Thesis */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-block border border-tomato px-3 py-1 bg-tomato/10 text-tomato text-xs font-mono font-bold uppercase tracking-widest">
                The Living Manifesto
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-none text-deepgreen font-serif">
                WHY CO-LIVING <br />
                SHOULDN’T FEEL <br />
                <span className="font-serif italic text-tomato lowercase font-normal">like a</span>{' '}
                COMPROMISE.
              </h3>
              <p className="font-serif italic text-deepgreen/70 text-lg leading-relaxed">
                In Pune, Mumbai, Nagpur, Bangalore, and Hyderabad, finding a home has been reduced to an extractive,
                stressful gauntlet: 10-month rental deposits, intrusive landlord curfews, and total
                guesswork on who you will share a kitchen with.
              </p>
              <div className="p-6 bg-butter border-2 border-deepgreen shadow-[4px_4px_0px_#263F32]">
                <p className="font-mono text-xs uppercase font-bold text-deepgreen mb-2">
                  Our Stated Oath to Urban India:
                </p>
                <p className="font-serif text-sm text-deepgreen font-medium leading-relaxed">
                  We believe living with the right roommates should feel like building chosen
                  family. You deserve transparent rent, your own private peace, and people who
                  respect the unspoken rules of a clean kitchen counter.
                </p>
              </div>
            </div>

            {/* Right Column: Editorial Tenets (Numbered Magazine Format) */}
            <div className="lg:col-span-7 space-y-8 lg:pl-8 border-t lg:border-t-0 lg:border-l-2 border-deepgreen pt-8 lg:pt-0">
              {/* Tenet 01 */}
              <div className="flex gap-6 items-start pb-8 border-b border-deepgreen/20">
                <span className="font-serif text-2xl font-bold text-tomato">01/</span>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold uppercase tracking-tight text-deepgreen font-serif">
                    THE DEATH OF THE 10-MONTH DEPOSIT
                  </h4>
                  <p className="font-serif text-deepgreen/80 text-sm leading-relaxed">
                    Why should a 23-year-old lock up ₹2,00,000 for a room? YAARO exclusively lists
                    flats with 2-month capped refundable security deposits, backed by digital lease
                    agreements that protect both tenant and flatmate.
                  </p>
                </div>
              </div>

              {/* Tenet 02 */}
              <div className="flex gap-6 items-start pb-8 border-b border-deepgreen/20">
                <span className="font-serif text-2xl font-bold text-tomato">02/</span>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold uppercase tracking-tight text-deepgreen font-serif">
                    NEVER MEET A MIDDLEMAN (0% BROKERAGE)
                  </h4>
                  <p className="font-serif text-deepgreen/80 text-sm leading-relaxed">
                    Brokers push rooms to close a commission. YAARO connects you directly with the
                    young professionals who already live there and have an empty bedroom. You talk
                    vibe first, rent second.
                  </p>
                </div>
              </div>

              {/* Tenet 03 */}
              <div className="flex gap-6 items-start pb-8 border-b border-deepgreen/20">
                <span className="font-serif text-2xl font-bold text-tomato">03/</span>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold uppercase tracking-tight text-deepgreen font-serif">
                    LIFESTYLE COMPATIBILITY OVER GUESSWORK
                  </h4>
                  <p className="font-serif text-deepgreen/80 text-sm leading-relaxed">
                    Are you an early riser who brews pour-over coffee, or a night-owl developer on
                    discord until 2 AM? Our Harmony Radar measures the real friction points before
                    you sign.
                  </p>
                </div>
              </div>

              {/* Tenet 04 */}
              <div className="flex gap-6 items-start">
                <span className="font-serif text-2xl font-bold text-tomato">04/</span>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold uppercase tracking-tight text-deepgreen font-serif">
                    AUTOMATED ZERO-TENSION EXPENSE SPLITS
                  </h4>
                  <p className="font-serif text-deepgreen/80 text-sm leading-relaxed">
                    No awkward WhatsApp pings for cook salary, Wi-Fi bills, or Blinkit groceries.
                    One unified flat ledger with one-tap UPI settlement and instant HRA receipts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 4: THE CHEMISTRY EXPERIENCE (INTERACTIVE SURVEY)
      ========================================================= */}
      <section className="border-b-2 border-deepgreen bg-cream py-16 px-6 md:px-12" id="chemistry">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-deepgreen pb-6 mb-10 gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-tomato font-bold">
                The Chemistry Check
              </span>
              <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deepgreen mt-1 font-serif">
                THE YAARO CHEMISTRY TEST
              </h3>
            </div>
            <p className="text-xs font-mono uppercase text-deepgreen/70 max-w-sm">
              A calibrated 12-question vibe survey that matches how you really exist in a flat
              Monday through Sunday.
            </p>
          </div>

          {/* Chemistry Editorial Showcase Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Live Test Sample Card (7 Cols) */}
            <div className="md:col-span-7 bg-cream-light border-2 border-deepgreen p-6 sm:p-8 relative shadow-[6px_6px_0px_#263F32]">
              <div className="flex items-center justify-between border-b border-deepgreen/20 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-tomato rounded-full" />
                  <span className="font-mono text-xs uppercase font-bold tracking-wider text-deepgreen">
                    Question 06 of 12
                  </span>
                </div>
                <span className="font-mono text-xs bg-butter px-2.5 py-0.5 border border-deepgreen text-deepgreen font-bold">
                  Kitchen &amp; Morning Habits
                </span>
              </div>

              <h4 className="font-serif text-xl sm:text-2xl font-bold text-deepgreen leading-snug mb-6">
                “Dirty dishes in the sink overnight: What’s your honest, real-life house policy?”
              </h4>

              {/* Question Options */}
              <div className="space-y-3 font-serif text-sm">
                {questions.map((q, idx) => {
                  const isSelected = selectedOption === idx
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedOption(idx)}
                      className={`p-3.5 border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-tomato bg-tomato/5 font-bold text-deepgreen shadow-[2px_2px_0px_#E95D43]'
                          : 'border-deepgreen/30 bg-cream hover:border-deepgreen'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected ? (
                          <span className="w-4 h-4 rounded-full bg-tomato text-white flex items-center justify-center text-[10px] font-mono">
                            ✓
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-deepgreen/40 flex items-center justify-center text-[10px]" />
                        )}
                        <span>{q.text}</span>
                      </div>
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider ${
                          isSelected ? 'bg-tomato text-white' : 'text-deepgreen/50'
                        }`}
                      >
                        {q.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Shared Living Trivia Box */}
              <div className="mt-6 p-4 bg-butter/30 border border-deepgreen font-mono text-xs text-deepgreen/90 flex items-start gap-3">
                <span className="text-base">💡</span>
                <div>
                  <span className="font-bold uppercase text-deepgreen">Urban Co-Living Insight:</span> 78%
                  of flatmate disputes start over unsoaked chai
                  saucepans, common cleaning schedules, and maid timing misunderstandings.
                </div>
              </div>
            </div>

            {/* Output Score / Radar Breakdown (5 Cols) */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-6">
              {/* Radar Gauge Card */}
              <div className="bg-deepgreen text-cream p-6 sm:p-8 border-2 border-deepgreen shadow-[6px_6px_0px_#E95D43]">
                <div className="flex items-center justify-between border-b border-cream/20 pb-3 mb-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-butter font-bold">
                    MATCH RADAR PREVIEW
                  </span>
                  <span className="text-xs font-mono text-emerald-400">● Mutual Match</span>
                </div>

                {/* Big Circular Metric */}
                <div className="text-center py-4">
                  <div className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 border-dashed border-butter text-cream mb-2">
                    <span className="text-4xl font-black font-serif text-butter">96%</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-cream/70">
                      SUPER MATCH
                    </span>
                  </div>
                  <p className="font-serif italic text-cream-light text-base mt-2">
                    “High Daily Rhythm &amp; Domestic Etiquette Compatibility”
                  </p>
                </div>

                {/* Trait Breakdown Bars */}
                <div className="space-y-4 font-mono text-xs pt-4 border-t border-cream/20">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>CLEANLINESS &amp; CHORES</span>
                      <span className="text-butter font-bold">95%</span>
                    </div>
                    <div className="w-full bg-cream/20 h-2">
                      <div className="bg-butter h-2 w-[95%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>SLEEP &amp; QUIET HOURS (11:30 PM)</span>
                      <span className="text-butter font-bold">92%</span>
                    </div>
                    <div className="w-full bg-cream/20 h-2">
                      <div className="bg-tomato h-2 w-[92%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>COOK &amp; KITCHEN BOUNDARIES</span>
                      <span className="text-butter font-bold">88%</span>
                    </div>
                    <div className="w-full bg-cream/20 h-2">
                      <div className="bg-butter h-2 w-[88%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>WEEKEND GUEST PROTOCOL</span>
                      <span className="text-butter font-bold">94%</span>
                    </div>
                    <div className="w-full bg-cream/20 h-2">
                      <div className="bg-emerald-400 h-2 w-[94%]" />
                    </div>
                  </div>
                </div>

                <Link
                  href="/onboarding"
                  prefetch={true}
                  className="w-full mt-6 py-3 bg-tomato text-cream font-serif font-bold uppercase tracking-wider text-xs hover:bg-tomato-dark transition-colors border border-cream/20 block text-center"
                >
                  Take the 2-Min Vibe Quiz ↗
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 5: CURATED LIVING DIRECTORY (ROOMS & SPACES)
      ========================================================= */}
      <section
        className="border-b-2 border-deepgreen bg-cream-light py-16 px-6 md:px-12"
        id="directory"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Title & Filter Ticker */}
          <div className="border-b-2 border-deepgreen pb-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-tomato font-bold">
                Handpicked Urban Spaces
              </span>
              <h3 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-deepgreen font-serif">
                CURATED LIVING DIRECTORY
              </h3>
              <p className="font-serif italic text-deepgreen/70 text-lg mt-1">
                Verified shared apartments and authentic community rooms across top cities. Zero brokerage.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {TOP_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => setActiveCity(city)}
                  className={`px-3.5 py-1.5 transition-colors font-bold ${
                    activeCity === city
                      ? 'bg-deepgreen text-cream shadow-[2px_2px_0px_#E95D43]'
                      : 'border border-deepgreen bg-cream hover:bg-butter text-deepgreen'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* If there are live published rooms from the database */}
          {filteredRooms.length > 0 ? (
            <div className="space-y-12">
              {/* Primary Feature Room */}
              <div className="border-2 border-deepgreen bg-cream p-6 sm:p-10 shadow-[8px_8px_0px_#263F32]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 relative">
                    <div className="relative border-2 border-deepgreen overflow-hidden">
                      <img
                        alt={filteredRooms[0].title}
                        className="w-full h-[400px] object-cover"
                        src={filteredRooms[0].images[0]}
                      />
                      <div className="absolute top-4 left-4 bg-tomato text-cream px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider border border-deepgreen">
                        0% BROKERAGE • {filteredRooms[0].city.toUpperCase()}
                      </div>
                      <div className="absolute bottom-4 right-4 bg-cream text-deepgreen px-3 py-1 font-mono text-xs font-bold border border-deepgreen">
                        Verified by YAARO
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2 font-mono text-[10px] text-deepgreen/80">
                      {filteredRooms[0].amenities.slice(0, 3).map((amenity, i) => (
                        <div key={i} className="p-2 border border-deepgreen bg-cream-light text-center">
                          {amenity}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-6">
                    <div className="border-b border-deepgreen/20 pb-4">
                      <span className="text-xs font-mono uppercase text-tomato font-bold">
                        {filteredRooms[0].city} Hub
                      </span>
                      <h4 className="text-2xl sm:text-3xl font-black uppercase text-deepgreen mt-1 font-serif">
                        {filteredRooms[0].title}
                      </h4>
                      <p className="font-serif italic text-sm text-deepgreen/70 mt-1 line-clamp-2">
                        {filteredRooms[0].description}
                      </p>
                    </div>

                    <div className="bg-butter/30 border border-deepgreen p-4">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-4xl font-black font-serif text-deepgreen">
                            ₹{filteredRooms[0].rentMonthly.toLocaleString('en-IN')}
                          </span>
                          <span className="font-mono text-xs uppercase text-deepgreen/70 ml-1">
                            / month
                          </span>
                        </div>
                        <span className="font-mono text-xs bg-tomato text-cream px-2 py-0.5 font-bold uppercase">
                          Deposit: ₹{filteredRooms[0].securityDeposit.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-deepgreen/70 mt-2">
                        {filteredRooms[0].roomType.toUpperCase()} ROOM • {filteredRooms[0].furnishedType.toUpperCase()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Link
                        href="/rooms"
                        className="flex-1 py-3.5 bg-deepgreen text-cream font-serif font-bold uppercase tracking-wider text-xs hover:bg-tomato transition-colors shadow-[3px_3px_0px_#E95D43] text-center"
                      >
                        Explore in Room Directory ↗
                      </Link>
                      <Link
                        href="/rooms"
                        className="px-4 py-3.5 border-2 border-deepgreen bg-cream hover:bg-butter transition-colors font-mono text-xs font-bold"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Grid */}
              {filteredRooms.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredRooms.slice(1).map((room) => (
                    <div
                      key={room.id}
                      className="border-2 border-deepgreen bg-cream p-6 relative shadow-[4px_4px_0px_#263F32]"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-mono text-[10px] uppercase text-tomato font-bold">
                            {room.city}
                          </span>
                          <h5 className="text-xl font-bold uppercase text-deepgreen mt-0.5 font-serif">
                            {room.title}
                          </h5>
                        </div>
                        <span className="font-mono text-sm font-black bg-butter px-2 py-0.5 border border-deepgreen">
                          ₹{room.rentMonthly.toLocaleString('en-IN')}/mo
                        </span>
                      </div>
                      <p className="font-serif text-xs text-deepgreen/80 mb-4 line-clamp-2">{room.description}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-deepgreen/20 font-mono text-xs">
                        <span className="text-deepgreen/60">0% BROKERAGE</span>
                        <Link href="/rooms" className="text-tomato font-bold hover:underline">
                          View Room Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* City Hub Explorer Cards */
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Pune', tag: 'Academic & Tech Collective', rooms: 'Verified Spaces Active', desc: 'Find compatible flatmates and shared flats across top creative hubs.' },
                  { name: 'Mumbai', tag: 'Creative & Financial Hub', rooms: 'Verified Spaces Active', desc: 'Connect with young operators and creative roommates across top city neighborhoods.' },
                  { name: 'Nagpur', tag: 'Central Growth Hub', rooms: 'Emerging Collective', desc: 'Explore modern co-living arrangements and verified shared accommodations.' },
                  { name: 'Bangalore', tag: 'Startup & Tech Capital', rooms: 'Verified Spaces Active', desc: 'Ditch brokers and find authentic flatmates with matching habits and lifestyle rhythms.' },
                  { name: 'Hyderabad', tag: 'Cyber Corridor Hub', rooms: 'Verified Spaces Active', desc: 'Discover quiet shared flats and verified roommates near tech centers.' },
                ]
                  .filter((c) => activeCity === 'ALL' || c.name.toUpperCase() === activeCity)
                  .map((city) => (
                    <div
                      key={city.name}
                      className="border-2 border-deepgreen bg-cream p-6 shadow-[5px_5px_0px_#263F32] flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-deepgreen/20 pb-2 mb-3">
                          <span className="font-mono text-[10px] uppercase font-bold text-tomato tracking-wider">
                            0% Brokerage
                          </span>
                          <span className="text-[10px] font-mono bg-butter px-2 py-0.5 border border-deepgreen font-bold text-deepgreen">
                            {city.rooms}
                          </span>
                        </div>
                        <h4 className="text-3xl font-black font-serif uppercase tracking-tight text-deepgreen">
                          {city.name}
                        </h4>
                        <p className="font-mono text-xs text-tomato font-bold mt-1">
                          {city.tag}
                        </p>
                        <p className="font-serif text-sm text-deepgreen/80 mt-3 leading-relaxed">
                          {city.desc}
                        </p>
                      </div>

                      <div className="pt-6 mt-6 border-t border-deepgreen/20 flex items-center justify-between gap-3">
                        <Link
                          href={`/rooms?city=${encodeURIComponent(city.name)}`}
                          className="px-4 py-2.5 bg-deepgreen text-cream hover:bg-tomato transition-colors font-serif font-bold text-xs uppercase tracking-wider flex-1 text-center shadow-[2px_2px_0px_#E95D43]"
                        >
                          Explore {city.name} Rooms ↗
                        </Link>
                        <Link
                          href="/rooms"
                          className="px-3 py-2.5 border border-deepgreen bg-cream hover:bg-butter transition-colors font-mono text-xs font-bold text-deepgreen"
                          title="List a Flat"
                        >
                          + List
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="p-6 border-2 border-deepgreen bg-butter/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h5 className="font-serif text-xl font-bold text-deepgreen">
                    Own a flat or looking for a flatmate in your city?
                  </h5>
                  <p className="font-serif text-sm text-deepgreen/80">
                    Publish your room listing directly to the YAARO collective with zero broker fees.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/rooms"
                    className="px-5 py-2.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold text-xs uppercase tracking-wider transition-colors shadow-[2px_2px_0px_#263F32]"
                  >
                    Publish Room Listing ↗
                  </Link>
                  <Link
                    href="/discover"
                    className="px-4 py-2.5 border-2 border-deepgreen bg-cream hover:bg-butter font-serif font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Find Flatmates
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          SECTION 6: DISTINCTIVE GEN Z FOOTER (HIGH CONTRAST)
      ========================================================= */}
      <footer
        className="bg-deepgreen text-cream border-t-4 border-tomato pt-16 pb-12 px-6 md:px-12"
        id="join"
      >
        <div className="max-w-7xl mx-auto">
          {/* Massive Signoff Typography */}
          <div className="border-b border-cream/20 pb-12 mb-12">
            <p className="font-mono text-xs uppercase tracking-widest text-butter font-bold mb-4">
              Open Invitation // Yaaro Collective
            </p>
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-tight leading-[0.9] text-cream font-serif">
              FIND YOUR PEOPLE.
              <br />
              <span className="text-tomato font-serif italic lowercase tracking-normal">
                and then,
              </span>
              <br />
              FIND YOUR PLACE.
            </h2>
          </div>

          {/* Action & Newsletter Spread */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-b border-cream/20 pb-12 mb-10">
            <div className="md:col-span-5 space-y-4">
              <h5 className="text-xl font-bold uppercase tracking-tight text-butter font-serif">
                Ready to ditch brokers &amp; find roommates you genuinely like?
              </h5>
              <p className="font-serif text-sm text-cream/70 leading-relaxed">
                Join 12,000+ young engineers, designers, writers, and operators across Pune,
                Mumbai, Nagpur, Bangalore, and Hyderabad who found their home through YAARO.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  prefetch={true}
                  className="px-6 py-3 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors shadow-[3px_3px_0px_#F2C75C]"
                >
                  Create Verified Profile ↗
                </Link>
                <Link
                  href="/rooms"
                  prefetch={true}
                  className="px-6 py-3 border border-cream/40 hover:bg-cream hover:text-deepgreen text-cream font-mono uppercase tracking-wider text-xs transition-colors"
                >
                  Publish a Room Listing
                </Link>
              </div>
            </div>

            <div className="md:col-span-3 font-mono text-xs space-y-3">
              <p className="uppercase font-bold text-butter">DIRECTORY CITIES</p>
              <ul className="space-y-1.5 text-cream/80">
                <li>
                  <Link href="/rooms?city=Pune" className="hover:text-tomato transition-colors">
                    → Pune
                  </Link>
                </li>
                <li>
                  <Link href="/rooms?city=Mumbai" className="hover:text-tomato transition-colors">
                    → Mumbai
                  </Link>
                </li>
                <li>
                  <Link href="/rooms?city=Nagpur" className="hover:text-tomato transition-colors">
                    → Nagpur
                  </Link>
                </li>
                <li>
                  <Link href="/rooms?city=Bangalore" className="hover:text-tomato transition-colors">
                    → Bangalore
                  </Link>
                </li>
                <li>
                  <Link href="/rooms?city=Hyderabad" className="hover:text-tomato transition-colors">
                    → Hyderabad
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 font-mono text-xs space-y-3">
              <p className="uppercase font-bold text-butter">THE YAARO JOURNAL</p>
              <p className="text-cream/70 text-[11px]">
                Bi-weekly dispatches on urban living, landlord tenant rights, domestic playlists,
                and filter coffee guides.
              </p>
              {newsletterSubscribed ? (
                <div className="p-3 bg-tomato text-cream font-bold text-xs">
                  Welcome to the collective! First dispatch arrives Sunday morning.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      required
                      className="bg-deepgreen-dark border border-cream/30 px-3 py-2 text-xs text-cream placeholder-cream/40 focus:outline-none focus:border-butter flex-1"
                      placeholder="YOUR WORK OR PERSONAL EMAIL"
                      type="email"
                    />
                    <button
                      type="submit"
                      className="bg-butter text-deepgreen font-bold px-4 py-2 uppercase hover:bg-white transition-colors"
                    >
                      JOIN
                    </button>
                  </div>
                  <span className="text-[10px] text-cream/50 block">
                    No spam. Only domestic harmony dispatches.
                  </span>
                </form>
              )}
            </div>
          </div>

          {/* Copyright & Bottom Metadata */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-cream/50 gap-4">
            <div>© 2026 YAARO CO-LIVING TECHNOLOGIES PVT. LTD. ALL RIGHTS RESERVED.</div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-cream">
                PRIVACY POLICY
              </Link>
              <Link href="/guidelines" className="hover:text-cream">
                COMMUNITY GUIDELINES
              </Link>
              <Link href="/hra" className="hover:text-cream">
                HRA SPLIT CALCULATOR
              </Link>
              <span className="text-tomato font-bold">MADE FOR URBAN INDIA</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
