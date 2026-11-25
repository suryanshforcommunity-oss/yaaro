'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Edit3,
  SlidersHorizontal,
  Lock,
  MapPin,
  Calendar,
  Briefcase,
  Flame,
  CheckCircle2,
  Camera,
  User,
  Instagram,
  Linkedin,
  ExternalLink,
} from 'lucide-react'
import EditorialNavigation from '@/components/EditorialNavigation'
import { getCurrentUserSessionData, CurrentUserSessionData } from '@/lib/user-profile'

export default function ProfileViewPage() {
  const [userData, setUserData] = useState<CurrentUserSessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const data = await getCurrentUserSessionData()
      setUserData(data)
      setIsLoading(false)
    }
    loadData()
  }, [])

  const profile = {
    fullName: userData?.profile?.full_name || userData?.displayName || 'YAARO Member',
    avatarUrl: userData?.profile?.avatar_url || null,
    age: userData?.profile?.age || 23,
    gender: userData?.profile?.gender || 'Unspecified',
    occupation: userData?.profile?.occupation || 'Co-Living Member',
    companyOrCollege: userData?.profile?.company_or_college || 'Freelance / Work',
    city: userData?.profile?.city || 'Pune',
    locality: userData?.profile?.locality || 'Hinjewadi',
    budgetMin: Number(userData?.profile?.budget_min || 15000),
    budgetMax: Number(userData?.profile?.budget_max || 22000),
    moveInDate: userData?.profile?.move_in_date || 'Flexible',
    bio: userData?.profile?.bio || 'Looking for harmonious flatmates who value clean common areas and mutual respect.',
    dietary: userData?.preferences?.dietary_preference || 'eggetarian',
    sleep: userData?.preferences?.sleeping_schedule || 'flexible',
    cleanliness: userData?.preferences?.cleanliness_level || 4,
    smoking: userData?.preferences?.smoking_tolerance || 'non_smoker',
    pets: userData?.preferences?.pet_tolerance || 'pet_friendly',
    hobbies: userData?.preferences?.hobbies?.length ? userData.preferences.hobbies : ['☕ Coffee Brewing', '🏸 Badminton', '🌱 Balcony Garden'],
    completionPercent: userData?.profile?.profile_completed_percentage || 40,
    verificationTier: userData?.profile?.verification_tier || 'Identity Verified',
    instagramHandle: (userData?.profile as any)?.instagram_handle || '',
    linkedinHandle: (userData?.profile as any)?.linkedin_handle || '',
  }

  const initials = profile.fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'Y'

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-12">
      <EditorialNavigation user={{ name: profile.fullName, email: userData?.user?.email }} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Header */}
        <div className="border-b-2 border-deepgreen pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
              <span>MEMBER DOSSIER #2041</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                {profile.verificationTier}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-deepgreen mt-0.5">
              LIVING PROFILE
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/profile/edit"
              className="px-4 py-2 bg-deepgreen text-cream hover:bg-tomato transition-colors font-serif font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#E95D43] flex items-center gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Details</span>
            </Link>
            <Link
              href="/profile/privacy"
              className="px-3.5 py-2 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Privacy</span>
            </Link>
          </div>
        </div>

        {/* Dossier Card */}
        <div className="border-2 border-deepgreen bg-cream-light p-6 sm:p-10 shadow-[8px_8px_0px_#263F32] space-y-8">
          {/* Top Hero Spread */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b-2 border-deepgreen pb-8">
            <div className="relative group shrink-0">
              <div className="w-28 h-28 border-2 border-deepgreen bg-tomato text-cream flex items-center justify-center font-serif text-3xl font-black shadow-[4px_4px_0px_#263F32] overflow-hidden">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <Link
                href="/profile/edit"
                className="absolute -bottom-2 -right-2 p-1.5 bg-cream border-2 border-deepgreen text-deepgreen hover:bg-butter hover:text-tomato transition-colors shadow-[2px_2px_0px_#263F32]"
                title="Change Photo"
              >
                <Camera className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-black uppercase text-deepgreen font-serif">
                  {profile.fullName}, {profile.age}
                </h2>
                <span className="font-mono text-xs text-deepgreen/60">({profile.gender})</span>
              </div>
              <p className="font-mono text-xs text-tomato font-bold uppercase tracking-wider">
                {profile.occupation} @ {profile.companyOrCollege}
              </p>
              <p className="font-mono text-xs text-deepgreen/70">
                📍 {profile.locality}, {profile.city}
              </p>

              {/* Social Handles Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                {profile.instagramHandle && (
                  <a
                    href={
                      profile.instagramHandle.startsWith('http')
                        ? profile.instagramHandle
                        : `https://instagram.com/${profile.instagramHandle.replace('@', '')}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cream border border-deepgreen font-mono text-[11px] font-bold text-deepgreen hover:text-tomato hover:border-tomato transition-colors shadow-[1px_1px_0px_#263F32]"
                  >
                    <Instagram className="h-3 w-3 text-pink-600" />
                    <span>
                      {profile.instagramHandle.startsWith('@')
                        ? profile.instagramHandle
                        : `@${profile.instagramHandle}`}
                    </span>
                    <ExternalLink className="h-2.5 w-2.5 text-deepgreen/40" />
                  </a>
                )}

                {profile.linkedinHandle && (
                  <a
                    href={
                      profile.linkedinHandle.startsWith('http')
                        ? profile.linkedinHandle
                        : profile.linkedinHandle.startsWith('in/')
                        ? `https://linkedin.com/${profile.linkedinHandle}`
                        : `https://linkedin.com/in/${profile.linkedinHandle.replace('@', '')}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cream border border-deepgreen font-mono text-[11px] font-bold text-deepgreen hover:text-[#0A66C2] hover:border-[#0A66C2] transition-colors shadow-[1px_1px_0px_#263F32]"
                  >
                    <Linkedin className="h-3 w-3 text-[#0A66C2]" />
                    <span>
                      {profile.linkedinHandle.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '') || 'LinkedIn'}
                    </span>
                    <ExternalLink className="h-2.5 w-2.5 text-deepgreen/40" />
                  </a>
                )}

                {!profile.instagramHandle && !profile.linkedinHandle && (
                  <Link
                    href="/profile/edit"
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-deepgreen/60 hover:text-tomato underline"
                  >
                    + Add Instagram &amp; LinkedIn handles
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Bio Quote Block */}
          <div className="p-4 bg-cream border-2 border-deepgreen shadow-[3px_3px_0px_#263F32]">
            <p className="font-serif italic text-base text-deepgreen leading-relaxed">
              “{profile.bio}”
            </p>
          </div>

          {/* Living Specifications & Rhythms */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 bg-cream border border-deepgreen">
              <span className="text-[10px] text-deepgreen/60 uppercase block">DIET</span>
              <span className="font-bold text-deepgreen">{profile.dietary}</span>
            </div>
            <div className="p-3 bg-cream border border-deepgreen">
              <span className="text-[10px] text-deepgreen/60 uppercase block">SLEEP RHYTHM</span>
              <span className="font-bold text-deepgreen">{profile.sleep}</span>
            </div>
            <div className="p-3 bg-cream border border-deepgreen">
              <span className="text-[10px] text-deepgreen/60 uppercase block">SMOKING</span>
              <span className="font-bold text-deepgreen">{profile.smoking}</span>
            </div>
            <div className="p-3 bg-cream border border-deepgreen">
              <span className="text-[10px] text-deepgreen/60 uppercase block">CLEANLINESS</span>
              <span className="font-bold text-tomato">{profile.cleanliness} / 5 (Strict)</span>
            </div>
          </div>

          {/* Lifestyle Stickers */}
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-deepgreen/70 font-bold block mb-2">
              CERTIFIED LIFESTYLE STICKERS
            </span>
            <div className="flex flex-wrap gap-2">
              {profile.hobbies.map((h, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-butter border border-deepgreen font-mono text-xs font-bold text-deepgreen shadow-[2px_2px_0px_#263F32]"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Budget & Timeline */}
          <div className="p-4 bg-butter/30 border border-deepgreen grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <span className="text-[10px] text-deepgreen/60 uppercase block">BUDGET TOLERANCE</span>
              <span className="text-sm font-bold text-deepgreen">
                ₹{profile.budgetMin.toLocaleString()} - ₹{profile.budgetMax.toLocaleString()} / mo
              </span>
            </div>
            <div>
              <span className="text-[10px] text-deepgreen/60 uppercase block">TARGET MOVE-IN</span>
              <span className="text-sm font-bold text-deepgreen">{profile.moveInDate}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
