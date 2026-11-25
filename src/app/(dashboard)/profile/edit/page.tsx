'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Camera, Loader2, Instagram, Linkedin } from 'lucide-react'
import EditorialNavigation from '@/components/EditorialNavigation'
import { getCurrentUserSessionData, updateCurrentUserProfile, uploadProfileAvatar } from '@/lib/user-profile'

export default function EditProfilePage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [age, setAge] = useState<number | ''>('')
  const [occupation, setOccupation] = useState('')
  const [companyOrCollege, setCompanyOrCollege] = useState('')
  const [city, setCity] = useState('Pune')
  const [locality, setLocality] = useState('')
  const [bio, setBio] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [linkedinHandle, setLinkedinHandle] = useState('')
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const data = await getCurrentUserSessionData()
      if (data.profile) {
        setFullName(data.profile.full_name || '')
        if (data.profile.avatar_url) setAvatarUrl(data.profile.avatar_url)
        if (data.profile.age) setAge(data.profile.age)
        if (data.profile.occupation) setOccupation(data.profile.occupation)
        if (data.profile.company_or_college) setCompanyOrCollege(data.profile.company_or_college)
        if (data.profile.city) setCity(data.profile.city)
        if (data.profile.locality) setLocality(data.profile.locality)
        if (data.profile.bio) setBio(data.profile.bio)
        if ((data.profile as any).instagram_handle) setInstagramHandle((data.profile as any).instagram_handle)
        if ((data.profile as any).linkedin_handle) setLinkedinHandle((data.profile as any).linkedin_handle)
      } else if (data.displayName && data.displayName !== 'Guest Co-Liver') {
        setFullName(data.displayName)
      }
    }
    load()
  }, [])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPhoto(true)
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await uploadProfileAvatar(formData)
    setIsUploadingPhoto(false)

    if (res.success && res.url) {
      setAvatarUrl(res.url)
    } else {
      setErrorMessage(res.error || 'Failed to upload photo. Please try a PNG or JPEG file.')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage(null)

    const res = await updateCurrentUserProfile({
      full_name: fullName,
      avatar_url: avatarUrl,
      age: typeof age === 'number' ? age : null,
      occupation,
      company_or_college: companyOrCollege,
      city,
      locality,
      bio,
      instagram_handle: instagramHandle.trim() ? (instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`) : '',
      linkedin_handle: linkedinHandle.trim() || '',
    })

    setIsSaving(false)
    if (res.success) {
      setSaveSuccess(true)
      setTimeout(() => {
        router.push('/profile')
      }, 800)
    } else {
      setErrorMessage(res.error || 'Failed to update profile.')
    }
  }

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-12">
      <EditorialNavigation user={{ name: fullName || 'My Dossier' }} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="border-b-2 border-deepgreen pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-deepgreen">
              EDIT LIVING DOSSIER
            </h1>
            <p className="font-serif italic text-xs text-deepgreen/70">
              Update your primary identification, socials, and work details.
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
          {saveSuccess && (
            <div className="mb-4 p-3 border border-emerald-600 bg-emerald-50 text-emerald-800 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Dossier successfully updated! Redirecting...</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 border-2 border-tomato bg-tomato/10 text-tomato text-xs font-mono">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Profile Photo Upload Section */}
            <div className="border-b border-deepgreen/20 pb-5">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-2">
                PROFILE PHOTOGRAPH
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 border-2 border-deepgreen bg-butter overflow-hidden relative shadow-[3px_3px_0px_#263F32] flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif font-black text-2xl text-deepgreen uppercase">
                      {fullName ? fullName.slice(0, 2).toUpperCase() : 'YA'}
                    </span>
                  )}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-deepgreen/60 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-cream animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="px-4 py-2 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold uppercase transition-colors inline-flex items-center gap-2 cursor-pointer shadow-[2px_2px_0px_#263F32]">
                    <Camera className="h-3.5 w-3.5 text-tomato" />
                    <span>{isUploadingPhoto ? 'Uploading...' : 'Change Photograph'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                  </label>
                  <p className="font-mono text-[10px] text-deepgreen/60">
                    PNG, JPEG or WebP. Publicly visible to verified members.
                  </p>
                </div>
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                  AGE
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || '')}
                  required
                  className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-mono text-deepgreen focus:outline-none focus:border-tomato"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                  CITY
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Pune, Bengaluru, Mumbai"
                  required
                  className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-serif text-deepgreen focus:outline-none focus:border-tomato"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                  OCCUPATION / ROLE
                </label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Software Engineer, Student"
                  required
                  className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-serif text-deepgreen focus:outline-none focus:border-tomato"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                  COLLEGE / COMPANY
                </label>
                <input
                  type="text"
                  value={companyOrCollege}
                  onChange={(e) => setCompanyOrCollege(e.target.value)}
                  placeholder="e.g. IIIT Pune, Cognizant, Swiggy"
                  required
                  className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-serif text-deepgreen focus:outline-none focus:border-tomato"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                PREFERRED LOCALITY
              </label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Hinjewadi Phase 1, Baner, Indiranagar"
                required
                className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-serif text-deepgreen focus:outline-none focus:border-tomato"
              />
            </div>

            {/* Social Handles Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-deepgreen/20">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1 flex items-center gap-1.5">
                  <Instagram className="h-3.5 w-3.5 text-tomato" />
                  <span>INSTAGRAM HANDLE</span>
                </label>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="@yourusername"
                  className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-mono text-deepgreen focus:outline-none focus:border-tomato"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1 flex items-center gap-1.5">
                  <Linkedin className="h-3.5 w-3.5 text-blue-700" />
                  <span>LINKEDIN URL / HANDLE</span>
                </label>
                <input
                  type="text"
                  value={linkedinHandle}
                  onChange={(e) => setLinkedinHandle(e.target.value)}
                  placeholder="linkedin.com/in/username"
                  className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-mono text-deepgreen focus:outline-none focus:border-tomato"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                LIVING BIO &amp; CHAI RULES
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                required
                className="w-full border-2 border-deepgreen bg-cream p-3 text-sm font-serif text-deepgreen focus:outline-none focus:border-tomato"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border border-deepgreen shadow-[3px_3px_0px_#263F32] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Save Dossier Changes ↗</span>}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
