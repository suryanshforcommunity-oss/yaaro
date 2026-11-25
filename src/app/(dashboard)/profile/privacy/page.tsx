'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, Lock, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import EditorialNavigation from '@/components/EditorialNavigation'
import { getCurrentUserSessionData, updateCurrentUserProfile } from '@/lib/user-profile'

export default function PrivacyControlsPage() {
  const [hidePhone, setHidePhone] = useState(true)
  const [hideAge, setHideAge] = useState(false)
  const [publicProfile, setPublicProfile] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function loadPrivacy() {
      const data = await getCurrentUserSessionData()
      if (data.profile) {
        if (data.profile.is_profile_public !== undefined) {
          setPublicProfile(data.profile.is_profile_public)
        }
      }
      setIsLoading(false)
    }
    loadPrivacy()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    await updateCurrentUserProfile({
      is_profile_public: publicProfile,
    })
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-12">
      <EditorialNavigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="border-b-2 border-deepgreen pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-deepgreen">
              PRIVACY CONTROLS
            </h1>
            <p className="font-serif italic text-xs text-deepgreen/70">
              Manage how your details and contact information appear across YAARO.
            </p>
          </div>
          <Link
            href="/profile"
            className="font-mono text-xs text-deepgreen/70 hover:text-tomato underline"
          >
            ← Back to Dossier
          </Link>
        </div>

        <div className="border-2 border-deepgreen bg-cream-light p-6 sm:p-8 shadow-[8px_8px_0px_#263F32]">
          {saved && (
            <div className="mb-4 p-3 border border-emerald-600 bg-emerald-50 text-emerald-800 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Privacy settings updated in database!</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-deepgreen/20 pb-4">
              <div>
                <h4 className="font-serif font-bold text-base text-deepgreen">
                  Hide Exact Phone Number
                </h4>
                <p className="font-serif italic text-xs text-deepgreen/70 mt-0.5">
                  Your phone number is only shared after mutual chat connection approval.
                </p>
              </div>
              <input
                type="checkbox"
                checked={hidePhone}
                onChange={(e) => setHidePhone(e.target.checked)}
                className="mt-1 h-5 w-5 rounded-none border-2 border-deepgreen text-tomato accent-tomato cursor-pointer"
              />
            </div>

            <div className="flex items-start justify-between border-b border-deepgreen/20 pb-4">
              <div>
                <h4 className="font-serif font-bold text-base text-deepgreen">
                  Suppress Exact Residential Address
                </h4>
                <p className="font-serif italic text-xs text-deepgreen/70 mt-0.5">
                  Only city cluster and locality (e.g. 12th Main Indiranagar) are shown publicly.
                </p>
              </div>
              <span className="font-mono text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                Always Enforced
              </span>
            </div>

            <div className="flex items-start justify-between border-b border-deepgreen/20 pb-4">
              <div>
                <h4 className="font-serif font-bold text-base text-deepgreen">
                  Active in Roommate Discovery
                </h4>
                <p className="font-serif italic text-xs text-deepgreen/70 mt-0.5">
                  Allows compatible flatmates in your city to view your living dossier.
                </p>
              </div>
              <input
                type="checkbox"
                checked={publicProfile}
                onChange={(e) => setPublicProfile(e.target.checked)}
                className="mt-1 h-5 w-5 rounded-none border-2 border-deepgreen text-tomato accent-tomato cursor-pointer"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border border-deepgreen shadow-[3px_3px_0px_#263F32] mt-4 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Settings...</span>
                </>
              ) : (
                <span>Save Privacy Settings ↗</span>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
