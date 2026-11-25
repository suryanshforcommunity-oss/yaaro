'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Camera,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  SlidersHorizontal,
  Home,
  Users,
  Compass,
  Heart,
  Loader2,
  Calendar,
  Building,
  GraduationCap,
  Briefcase,
  MapPin,
  Clock,
  Coffee,
  ShieldCheck,
} from 'lucide-react'
import { uploadAvatar } from '@/lib/storage'
import { saveOnboardingProfile } from './actions'
import { getCurrentUserSessionData } from '@/lib/user-profile'

const HOBBIES_LIST = [
  '☕ Coffee Brewing',
  '🎸 Indie Gigs',
  '🏸 Badminton',
  '🍳 Weekend Cooking',
  '📚 Book Club',
  '💻 Tech & Startups',
  '🎮 PC & Console Gaming',
  '🧘 Yoga & Fitness',
  '🎬 Cinema & Binging',
  '🐶 Dog Lover',
  '🐱 Cat Lover',
  '🌱 Plant Parent',
  '🎨 UI / Graphic Design',
  '✈️ Weekend Roadtrips',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  // Step 1: Identity & Photograph
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [age, setAge] = useState<number>(23)
  const [gender, setGender] = useState<'male' | 'female' | 'non_binary' | 'prefer_not_to_say'>('male')
  const [occupation, setOccupation] = useState('Software Engineer')
  const [companyOrCollege, setCompanyOrCollege] = useState('Swiggy')

  // Step 2: Living & Logistics
  const [city, setCity] = useState('Pune')
  const [locality, setLocality] = useState('Hinjewadi')
  const [budgetMin, setBudgetMin] = useState(12000)
  const [budgetMax, setBudgetMax] = useState(22000)
  const [moveInDate, setMoveInDate] = useState('2026-12-01')
  const [livingRequirement, setLivingRequirement] = useState<'join' | 'have_room' | 'team_up'>('join')

  // Step 3: Habits & Lifestyle
  const [dietary, setDietary] = useState<'any' | 'vegetarian' | 'vegan' | 'non_vegetarian' | 'eggetarian'>('eggetarian')
  const [smoking, setSmoking] = useState<'non_smoker' | 'outside_only' | 'open_to_smokers'>('non_smoker')
  const [drinking, setDrinking] = useState<'teetotaler' | 'social' | 'regular'>('social')
  const [sleepSchedule, setSleepSchedule] = useState<'early_bird' | 'night_owl' | 'flexible'>('night_owl')
  const [workSchedule, setWorkSchedule] = useState<'wfh' | 'office' | 'hybrid' | 'student'>('hybrid')
  const [cleanlinessLevel, setCleanlinessLevel] = useState<number>(4)
  const [petTolerance, setPetTolerance] = useState<'pet_friendly' | 'no_pets' | 'has_pets'>('pet_friendly')

  // Step 4: Social & Hobbies
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([
    '☕ Coffee Brewing',
    '🏸 Badminton',
    '💻 Tech & Startups',
    '🎸 Indie Gigs',
  ])
  const [socialLifestyle, setSocialLifestyle] = useState<'introvert' | 'balanced' | 'extrovert'>('balanced')
  const [bio, setBio] = useState(
    'Moving close to 100ft road Indiranagar. Big fan of clean common areas, weekend cooking, and quiet weekdays.'
  )

  useEffect(() => {
    async function loadInitialUserData() {
      try {
        const data = await getCurrentUserSessionData()
        if (data.isAuthenticated) {
          if (data.displayName && data.displayName !== 'YAARO Member') {
            setFullName(data.displayName)
          }
          if (data.profile?.avatar_url) {
            setAvatarPreview(data.profile.avatar_url)
            setAvatarUrl(data.profile.avatar_url)
          }
          if (data.profile?.age) setAge(data.profile.age)
          if (data.profile?.gender) setGender(data.profile.gender as any)
          if (data.profile?.occupation) setOccupation(data.profile.occupation)
          if (data.profile?.company_or_college) setCompanyOrCollege(data.profile.company_or_college)
          if (data.profile?.city) setCity(data.profile.city)
          if (data.profile?.locality) setLocality(data.profile.locality)
          if (data.profile?.budget_min) setBudgetMin(data.profile.budget_min)
          if (data.profile?.budget_max) setBudgetMax(data.profile.budget_max)
          if (data.profile?.bio) setBio(data.profile.bio)
        }
      } catch (err) {
        // Fallback gracefully
      }
    }
    loadInitialUserData()
  }, [])

  const toggleHobby = (hobby: string) => {
    setSelectedHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby]
    )
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarPreview(URL.createObjectURL(file))
    setIsUploadingPhoto(true)

    const res = await uploadAvatar(file, 'user-avatar')
    setIsUploadingPhoto(false)
    if (res.success && res.url) {
      setAvatarUrl(res.url)
    }
  }

  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await saveOnboardingProfile({
        fullName,
        avatarUrl: avatarUrl || avatarPreview,
        age,
        gender,
        occupation,
        companyOrCollege,
        city,
        locality,
        budgetMin,
        budgetMax,
        moveInDate,
        isLookingForRoom: livingRequirement === 'join' || livingRequirement === 'team_up',
        isLookingForRoommate: livingRequirement === 'have_room' || livingRequirement === 'team_up',
        dietaryPreference: dietary,
        smokingTolerance: smoking,
        drinkingTolerance: drinking,
        sleepingSchedule: sleepSchedule,
        workSchedule,
        cleanlinessLevel,
        petTolerance,
        hobbies: selectedHobbies,
        socialLifestyle,
        bio,
      })

      if (res && res.success) {
        router.push('/dashboard')
      } else {
        setSubmitError(res?.error || 'Failed to complete profile calibration. Please try again.')
        setIsSubmitting(false)
      }
    } catch (err: any) {
      console.error('Error in handleFinalSubmit:', err)
      setSubmitError(err?.message || 'A network error occurred while publishing your profile.')
      setIsSubmitting(false)
    }
  }

  const progressPercent = Math.round((currentStep / 4) * 100)

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b-2 border-deepgreen px-4 sm:px-8 py-4 bg-cream sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-3xl font-black uppercase tracking-tighter text-deepgreen">
            YAARO<span className="text-tomato font-serif italic text-2xl lowercase">.live</span>
          </Link>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="bg-butter border border-deepgreen px-2.5 py-0.5 font-bold uppercase text-deepgreen">
              Step {currentStep} of 4
            </span>
            <span className="text-deepgreen/70 hidden sm:inline">Dossier Calibration</span>
          </div>
        </div>
      </header>

      {/* Progress Strip */}
      <div className="w-full bg-deepgreen/10 h-1.5">
        <div
          className="bg-tomato h-1.5 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Questionnaire Card */}
      <main className="max-w-2xl mx-auto w-full p-4 sm:p-8 my-auto">
        <div className="border-2 border-deepgreen bg-cream-light p-6 sm:p-10 shadow-[8px_8px_0px_#263F32] relative">
          {/* Step 1: Identity & Profile */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-deepgreen/20 pb-4">
                <span className="font-mono text-xs uppercase tracking-widest text-tomato font-bold">
                  Part 01 / Living Identity
                </span>
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-deepgreen mt-1">
                  WHO ARE YOU <br />
                  <span className="font-serif italic font-normal text-tomato lowercase">at</span> HOME?
                </h2>
                <p className="font-serif italic text-sm text-deepgreen/70 mt-1">
                  Authentic details only. We match real personalities, never anonymous profiles.
                </p>
              </div>

              {/* Photo Upload Polaroid */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 border border-deepgreen bg-cream">
                <div className="relative w-28 h-28 border-2 border-deepgreen bg-sand/50 overflow-hidden shrink-0 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2 font-mono text-[10px] text-deepgreen/60 uppercase">
                      35mm Candid Photo
                    </div>
                  )}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-deepgreen/80 flex items-center justify-center text-cream">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-deepgreen text-cream font-serif text-xs font-bold uppercase tracking-wider hover:bg-tomato transition-colors shadow-[2px_2px_0px_#E95D43]">
                    <Camera className="h-3.5 w-3.5" />
                    <span>Upload Candid Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="font-mono text-[10px] text-deepgreen/60">
                    Candid photos get 3.2× more genuine flatmate responses.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-serif text-deepgreen focus:outline-none focus:border-tomato"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                    AGE (YEARS)
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={65}
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 22)}
                    required
                    className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-mono text-deepgreen focus:outline-none focus:border-tomato"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                  GENDER IDENTITY (INCLUSIVE)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  {[
                    { val: 'female', label: 'Woman' },
                    { val: 'male', label: 'Man' },
                    { val: 'non_binary', label: 'Non-Binary' },
                    { val: 'prefer_not_to_say', label: 'Other' },
                  ].map((g) => (
                    <button
                      key={g.val}
                      type="button"
                      onClick={() => setGender(g.val as any)}
                      className={`py-2 px-2 border-2 transition-all font-bold ${
                        gender === g.val
                          ? 'border-deepgreen bg-deepgreen text-cream shadow-[2px_2px_0px_#E95D43]'
                          : 'border-deepgreen/30 bg-cream text-deepgreen hover:border-deepgreen'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                    PROFESSION / ROLE
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="Product Designer"
                    required
                    className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-serif text-deepgreen focus:outline-none focus:border-tomato"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                    COMPANY / COLLEGE
                  </label>
                  <input
                    type="text"
                    value={companyOrCollege}
                    onChange={(e) => setCompanyOrCollege(e.target.value)}
                    placeholder="Swiggy / BITS Pilani"
                    required
                    className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-serif text-deepgreen focus:outline-none focus:border-tomato"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Locality & Rent Budget */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-deepgreen/20 pb-4">
                <span className="font-mono text-xs uppercase tracking-widest text-tomato font-bold">
                  Part 02 / Locality &amp; Logistics
                </span>
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-deepgreen mt-1">
                  WHERE &amp; WHAT BUDGET?
                </h2>
                <p className="font-serif italic text-sm text-deepgreen/70 mt-1">
                  All listings on YAARO cap security deposits at 2 months max with 0% brokerage.
                </p>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                  WHAT ARE YOU LOOKING FOR?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-serif text-xs">
                  {[
                    { val: 'join', label: 'Need a Room in existing Flat', desc: 'Move into an occupied flat' },
                    { val: 'have_room', label: 'Have an Empty Bedroom', desc: 'Find 1 chill flatmate' },
                    { val: 'team_up', label: 'Team Up to Rent a New Flat', desc: 'Find flatmate then hunt' },
                  ].map((req) => (
                    <button
                      key={req.val}
                      type="button"
                      onClick={() => setLivingRequirement(req.val as any)}
                      className={`p-3 border-2 text-left transition-all ${
                        livingRequirement === req.val
                          ? 'border-tomato bg-tomato/5 font-bold text-deepgreen shadow-[3px_3px_0px_#E95D43]'
                          : 'border-deepgreen/30 bg-cream text-deepgreen hover:border-deepgreen'
                      }`}
                    >
                      <p className="font-bold">{req.label}</p>
                      <p className="font-mono text-[10px] text-deepgreen/60 mt-0.5">{req.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                    PRIMARY CITY
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-serif text-deepgreen focus:outline-none focus:border-tomato"
                  >
                    <option value="Pune">Pune</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                    PREFERRED LOCALITY / CLUSTER
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Hinjewadi Phase 1, Baner, or Indiranagar"
                    className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-serif text-deepgreen focus:outline-none focus:border-tomato"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                  MONTHLY RENT BUDGET (₹10K - ₹40K+)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="font-mono text-[10px] text-deepgreen/60">MINIMUM</span>
                    <input
                      type="number"
                      step={1000}
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(parseInt(e.target.value) || 10000)}
                      className="w-full border-2 border-deepgreen bg-cream px-3 py-1.5 font-mono text-sm text-deepgreen"
                    />
                  </div>
                  <span className="pt-4 font-mono font-bold text-deepgreen">—</span>
                  <div className="flex-1">
                    <span className="font-mono text-[10px] text-deepgreen/60">MAXIMUM</span>
                    <input
                      type="number"
                      step={1000}
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(parseInt(e.target.value) || 25000)}
                      className="w-full border-2 border-deepgreen bg-cream px-3 py-1.5 font-mono text-sm text-deepgreen"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                  TARGET MOVE-IN TIMELINE
                </label>
                <input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream px-3 py-2 font-mono text-sm text-deepgreen focus:outline-none focus:border-tomato"
                />
              </div>
            </div>
          )}

          {/* Step 3: Habits & Domestic Living Boundaries */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-deepgreen/20 pb-4">
                <span className="font-mono text-xs uppercase tracking-widest text-tomato font-bold">
                  Part 03 / Living Boundaries
                </span>
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-deepgreen mt-1">
                  DOMESTIC VIBE &amp; RHYTHM
                </h2>
                <p className="font-serif italic text-sm text-deepgreen/70 mt-1">
                  92% of flatmate clashes come from unspoken domestic differences. Let’s get aligned.
                </p>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                  DIETARY &amp; KITCHEN PREFERENCE
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  {[
                    { val: 'vegetarian', label: 'Strict Veg' },
                    { val: 'eggetarian', label: 'Eggetarian' },
                    { val: 'non_vegetarian', label: 'Non-Veg Friendly' },
                    { val: 'any', label: 'Any / Flexible' },
                  ].map((d) => (
                    <button
                      key={d.val}
                      type="button"
                      onClick={() => setDietary(d.val as any)}
                      className={`p-2 border-2 font-bold ${
                        dietary === d.val
                          ? 'border-deepgreen bg-deepgreen text-cream shadow-[2px_2px_0px_#E95D43]'
                          : 'border-deepgreen/30 bg-cream text-deepgreen'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                  SLEEPING SCHEDULE
                </label>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  {[
                    { val: 'early_bird', label: 'Early Bird (10 PM)' },
                    { val: 'night_owl', label: 'Night Owl (2 AM)' },
                    { val: 'flexible', label: 'Flexible Rhythms' },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setSleepSchedule(s.val as any)}
                      className={`p-2 border-2 font-bold ${
                        sleepSchedule === s.val
                          ? 'border-deepgreen bg-deepgreen text-cream shadow-[2px_2px_0px_#E95D43]'
                          : 'border-deepgreen/30 bg-cream text-deepgreen'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                  SMOKING POLICY
                </label>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  {[
                    { val: 'non_smoker', label: 'Strict Non-Smoker' },
                    { val: 'outside_only', label: 'Balcony Only' },
                    { val: 'open_to_smokers', label: 'Smoking Friendly' },
                  ].map((sm) => (
                    <button
                      key={sm.val}
                      type="button"
                      onClick={() => setSmoking(sm.val as any)}
                      className={`p-2 border-2 font-bold ${
                        smoking === sm.val
                          ? 'border-deepgreen bg-deepgreen text-cream shadow-[2px_2px_0px_#E95D43]'
                          : 'border-deepgreen/30 bg-cream text-deepgreen'
                      }`}
                    >
                      {sm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold">
                    CLEANLINESS STANDARD: {cleanlinessLevel}/5
                  </label>
                  <span className="font-serif italic text-xs text-tomato">
                    {cleanlinessLevel >= 4 ? 'Dishes washed before sleep' : 'Casual & relaxed'}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={cleanlinessLevel}
                  onChange={(e) => setCleanlinessLevel(parseInt(e.target.value))}
                  className="w-full accent-tomato"
                />
              </div>
            </div>
          )}

          {/* Step 4: Social Chemistry & Dossier Bio */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-deepgreen/20 pb-4">
                <span className="font-mono text-xs uppercase tracking-widest text-tomato font-bold">
                  Part 04 / Chemistry &amp; Hobbies
                </span>
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-deepgreen mt-1">
                  COMMUNITY &amp; BIO
                </h2>
                <p className="font-serif italic text-sm text-deepgreen/70 mt-1">
                  Select your lifestyle stickers and write a genuine short bio.
                </p>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-2">
                  LIFESTYLE STICKERS (PICK 3+)
                </label>
                <div className="flex flex-wrap gap-2">
                  {HOBBIES_LIST.map((hobby) => {
                    const isSelected = selectedHobbies.includes(hobby)
                    return (
                      <button
                        key={hobby}
                        type="button"
                        onClick={() => toggleHobby(hobby)}
                        className={`px-3 py-1.5 border font-mono text-xs transition-all ${
                          isSelected
                            ? 'border-tomato bg-tomato text-cream shadow-[2px_2px_0px_#263F32] font-bold'
                            : 'border-deepgreen/30 bg-cream text-deepgreen hover:border-deepgreen'
                        }`}
                      >
                        {hobby}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                  YOUR LIVING BIO &amp; EXPECTATIONS
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell potential flatmates what you love about shared living, your chai rules, and how you spend Sundays..."
                  className="w-full border-2 border-deepgreen bg-cream p-3 text-sm font-serif text-deepgreen placeholder:text-deepgreen/40 focus:outline-none focus:border-tomato"
                />
              </div>

              {/* Privacy Guarantee Note */}
              <div className="p-3 bg-butter/30 border border-deepgreen font-mono text-xs text-deepgreen flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-deepgreen shrink-0 mt-0.5" />
                <span>
                  Exact home addresses and contact numbers are never shown publicly. Only verified members can initiate contact.
                </span>
              </div>

              {/* Error Alert Display */}
              {submitError && (
                <div className="p-3 bg-tomato/10 border-2 border-tomato text-tomato font-mono text-xs flex items-center justify-between">
                  <span>{submitError}</span>
                  <button
                    type="button"
                    onClick={() => setSubmitError(null)}
                    className="font-bold underline uppercase ml-2 text-[10px]"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-deepgreen/20 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2.5 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold uppercase transition-colors"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-6 py-2.5 bg-deepgreen text-cream hover:bg-tomato font-serif font-bold uppercase tracking-wider text-xs transition-colors shadow-[3px_3px_0px_#E95D43]"
              >
                Next Section →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border border-deepgreen shadow-[3px_3px_0px_#263F32] flex items-center gap-2 disabled:opacity-75 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Calibrating...</span>
                  </>
                ) : (
                  <span>Publish Dossier ↗</span>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-deepgreen/20 py-4 text-center font-mono text-[10px] text-deepgreen/50">
        YAARO EDITORIAL PLATFORM • FIND YOUR PEOPLE. FIND YOUR PLACE.
      </footer>
    </div>
  )
}
