'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, SlidersHorizontal, ArrowLeft, Loader2 } from 'lucide-react'
import EditorialNavigation from '@/components/EditorialNavigation'
import { getCurrentUserSessionData, updateCurrentUserPreferences } from '@/lib/user-profile'

export default function PreferencesPage() {
  const router = useRouter()
  const [dietary, setDietary] = useState('eggetarian')
  const [smoking, setSmoking] = useState('non_smoker')
  const [drinking, setDrinking] = useState('social')
  const [sleep, setSleep] = useState('night_owl')
  const [cleanliness, setCleanliness] = useState(4)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function loadPreferences() {
      const data = await getCurrentUserSessionData()
      if (data.preferences) {
        if (data.preferences.dietary_preference) setDietary(data.preferences.dietary_preference)
        if (data.preferences.smoking_tolerance) setSmoking(data.preferences.smoking_tolerance)
        if (data.preferences.drinking_tolerance) setDrinking(data.preferences.drinking_tolerance)
        if (data.preferences.sleeping_schedule) setSleep(data.preferences.sleeping_schedule)
        if (data.preferences.cleanliness_level) setCleanliness(data.preferences.cleanliness_level)
      }
      setIsLoading(false)
    }
    loadPreferences()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    await updateCurrentUserPreferences({
      dietary_preference: dietary as any,
      smoking_tolerance: smoking as any,
      drinking_tolerance: drinking as any,
      sleeping_schedule: sleep as any,
      cleanliness_level: cleanliness,
    })

    setIsSaving(false)
    setSaved(true)
    setTimeout(() => {
      router.push('/profile')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-12">
      <EditorialNavigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="border-b-2 border-deepgreen pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-deepgreen">
              LIVING BOUNDARIES
            </h1>
            <p className="font-serif italic text-xs text-deepgreen/70">
              Calibrate your daily domestic rhythms and kitchen rules.
            </p>
          </div>
          <Link
            href="/profile"
            className="font-mono text-xs text-deepgreen/70 hover:text-tomato underline"
          >
            ← Cancel
          </Link>
        </div>

        <div className="border-2 border-deepgreen bg-cream-light p-6 sm:p-8 shadow-[8px_8px_0px_#263F32]">
          {saved && (
            <div className="mb-4 p-3 border border-emerald-600 bg-emerald-50 text-emerald-800 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Preferences calibrated &amp; synced with database!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                DIETARY PREFERENCE
              </label>
              <select
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-serif text-deepgreen focus:outline-none focus:border-tomato"
              >
                <option value="vegetarian">Strict Vegetarian</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="non_vegetarian">Non-Vegetarian Friendly</option>
                <option value="any">Any / Flexible</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                SLEEPING SCHEDULE
              </label>
              <select
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
                className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-serif text-deepgreen focus:outline-none focus:border-tomato"
              >
                <option value="early_bird">Early Bird (10 PM)</option>
                <option value="night_owl">Night Owl (1:30 AM)</option>
                <option value="flexible">Flexible Rhythms</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                SMOKING TOLERANCE
              </label>
              <select
                value={smoking}
                onChange={(e) => setSmoking(e.target.value)}
                className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-serif text-deepgreen focus:outline-none focus:border-tomato"
              >
                <option value="non_smoker">Non-Smoker Only</option>
                <option value="outside_only">Balcony Only</option>
                <option value="open_to_smokers">Smoking Friendly</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold">
                  CLEANLINESS STANDARD: {cleanliness}/5
                </label>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={cleanliness}
                onChange={(e) => setCleanliness(parseInt(e.target.value))}
                className="w-full accent-tomato"
              />
            </div>

            {/* Notification Preferences */}
            <div className="pt-4 border-t border-deepgreen/20 space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-tomato font-bold block">
                NOTIFICATION &amp; PING PREFERENCES
              </span>
              <div className="space-y-2 font-mono text-xs text-deepgreen">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-tomato h-4 w-4" />
                  <span>Instant alerts for new mutual matches</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-tomato h-4 w-4" />
                  <span>Direct chat message notifications</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-tomato h-4 w-4" />
                  <span>Chemistry dilemma test challenges</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-tomato h-4 w-4" />
                  <span>Verified room listing activity in my locality</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border border-deepgreen shadow-[3px_3px_0px_#263F32] mt-4 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <span>Update Preferences ↗</span>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
