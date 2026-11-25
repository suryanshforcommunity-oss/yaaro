'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  CheckCircle2,
  Mail,
  ArrowRight,
  Clock,
  Sparkles,
  Lock,
  Compass,
  Heart,
  Send,
  Loader2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import EditorialNavigation from '@/components/EditorialNavigation'
import {
  getVerificationStatusAction,
  sendEmailOtpAction,
  verifyEmailOtpAction,
} from './actions'
import type { VerificationProfileState } from '@/lib/verification'

export default function VerificationCenterPage() {
  const [state, setState] = useState<VerificationProfileState | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Email verification states
  const [emailSent, setEmailSent] = useState<boolean>(false)
  const [otpInput, setOtpInput] = useState<string>('')
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false)

  const refreshStatus = async (showNotification = false) => {
    setIsRefreshing(true)
    const res = await getVerificationStatusAction()
    if (res.success && res.state) {
      setState(res.state)
      setUserEmail(res.userEmail || '')
      if (showNotification) {
        if (res.state.badgeEligible) {
          setStatusMsg({ text: '✓ Congratulations! Your account holds Verified YAARO Member status.', type: 'success' })
        } else {
          setStatusMsg({ text: 'Verification pending. Please click the link in your email or enter your code.', type: 'error' })
        }
      }
    }
    setIsRefreshing(false)
    setLoading(false)
  }

  useEffect(() => {
    refreshStatus(false)
  }, [])

  const handleSendVerificationEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSendingEmail(true)
    setStatusMsg(null)

    const res = await sendEmailOtpAction()
    setIsSendingEmail(false)

    if (res.success) {
      setEmailSent(true)
      setStatusMsg({
        text: res.message || `Verification email dispatched to ${userEmail}. Check your inbox!`,
        type: 'success',
      })
    } else {
      setStatusMsg({ text: res.message || 'Failed to dispatch verification email.', type: 'error' })
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpInput.trim()) {
      setStatusMsg({ text: 'Please enter the verification code or token from your email.', type: 'error' })
      return
    }

    setIsVerifyingCode(true)
    setStatusMsg(null)

    const res = await verifyEmailOtpAction(otpInput)
    setIsVerifyingCode(false)

    if (res.success) {
      setStatusMsg({ text: 'Email verified! You are now a Verified YAARO Member.', type: 'success' })
      setOtpInput('')
      await refreshStatus(false)
    } else {
      setStatusMsg({ text: res.message || 'Invalid or expired verification code.', type: 'error' })
    }
  }

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-16">
      <EditorialNavigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Editorial Top Masthead */}
        <div className="border-b-2 border-deepgreen pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
                <span>VOL. 07 // TRUST &amp; SAFETY DESK</span>
                <span>•</span>
                <span className="text-deepgreen/70">Anti-Broker &amp; Flatmate Integrity Standard</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deepgreen mt-0.5">
                VERIFICATION CENTER
              </h1>
              <p className="font-serif italic text-sm text-deepgreen/80 mt-1 max-w-2xl">
                YAARO protects our shared-living collective from phantom listings, deposit fraud, and commercial brokers.
                Verification is completely free and completed in under 60 seconds via email confirmation.
              </p>
            </div>

            {/* Current Badge Status Pill */}
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => refreshStatus(true)}
                disabled={isRefreshing}
                className="px-3 py-2 border-2 border-deepgreen bg-cream hover:bg-butter text-deepgreen font-mono text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#263F32] transition-colors disabled:opacity-50"
                title="Check Verification Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh Status</span>
              </button>

              {state?.badgeEligible ? (
                <div className="px-4 py-2 bg-emerald-100 border-2 border-emerald-700 text-emerald-900 font-mono text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#263F32]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>✓ VERIFIED YAARO MEMBER</span>
                </div>
              ) : (
                <div className="px-4 py-2 bg-butter border-2 border-deepgreen text-deepgreen font-mono text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#263F32]">
                  <Lock className="w-4 h-4 text-tomato" />
                  <span>EMAIL VERIFICATION PENDING</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusMsg && (
          <div
            className={`p-4 border-2 font-mono text-xs font-bold flex items-center justify-between shadow-[3px_3px_0px_#263F32] ${
              statusMsg.type === 'success'
                ? 'bg-emerald-100 border-emerald-700 text-emerald-900'
                : 'bg-tomato/10 border-tomato text-tomato'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="underline ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* Verification Overview Grid (3 Steps) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Free Email OTP Verification */}
          <div className="border-2 border-deepgreen bg-cream-light p-5 space-y-4 shadow-[4px_4px_0px_#263F32] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-tomato uppercase tracking-widest">
                  STAGE 01
                </span>
                {state?.badgeEligible ? (
                  <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    VERIFIED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-tomato/10 text-tomato border border-tomato/30">
                    READY TO VERIFY
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 border border-deepgreen bg-cream text-deepgreen">
                  <Mail className="w-5 h-5 text-tomato" />
                </div>
                <div>
                  <h4 className="font-serif font-black uppercase text-sm text-deepgreen">
                    Email Identity Anchor
                  </h4>
                  <p className="font-mono text-xs text-deepgreen/60 truncate max-w-[200px]">
                    {userEmail || 'Active account'}
                  </p>
                </div>
              </div>
              <p className="font-serif italic text-xs text-deepgreen/80">
                100% Free verification via 1-click magic link or code sent to your inbox.
              </p>
            </div>

            {state?.badgeEligible ? (
              <div className="pt-3 border-t border-deepgreen/20 font-mono text-[11px] text-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Email Anchor Confirmed</span>
              </div>
            ) : (
              <div className="pt-3 border-t border-deepgreen/20">
                <a
                  href="#email-verification-desk"
                  className="w-full py-2 bg-tomato hover:bg-tomato-dark text-cream-light font-mono text-xs font-bold uppercase text-center block shadow-[2px_2px_0px_#263F32] transition-all"
                >
                  Verify Email Now ↓
                </a>
              </div>
            )}
          </div>

          {/* Step 2: Living Rhythm Profile */}
          <div className="border-2 border-deepgreen bg-cream-light p-5 space-y-4 shadow-[4px_4px_0px_#263F32] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-tomato uppercase tracking-widest">
                  STAGE 02
                </span>
                {state?.isProfileComplete ? (
                  <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    COMPLETE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-butter text-deepgreen border border-deepgreen/40">
                    IN PROGRESS
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 border border-deepgreen bg-cream text-deepgreen">
                  <Compass className="w-5 h-5 text-tomato" />
                </div>
                <div>
                  <h4 className="font-serif font-black uppercase text-sm text-deepgreen">
                    Living Profile
                  </h4>
                  <p className="font-mono text-xs text-deepgreen/60">
                    City, bio &amp; flatmate habits
                  </p>
                </div>
              </div>
              <p className="font-serif italic text-xs text-deepgreen/80">
                Helps flatmates understand your kitchen rules, sleeping hours, and weekend chai habits.
              </p>
            </div>

            <div className="pt-3 border-t border-deepgreen/20">
              <Link
                href="/profile/edit"
                className="font-mono text-xs text-deepgreen hover:text-tomato underline font-bold uppercase block text-center"
              >
                Update Living Bio →
              </Link>
            </div>
          </div>

          {/* Step 3: Chemistry Quiz */}
          <div className="border-2 border-deepgreen bg-cream-light p-5 space-y-4 shadow-[4px_4px_0px_#263F32] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-tomato uppercase tracking-widest">
                  STAGE 03
                </span>
                <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  RECOMMENDED
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 border border-deepgreen bg-cream text-deepgreen">
                  <Heart className="w-5 h-5 text-tomato" />
                </div>
                <div>
                  <h4 className="font-serif font-black uppercase text-sm text-deepgreen">
                    Chemistry Quiz
                  </h4>
                  <p className="font-mono text-xs text-deepgreen/60">
                    10 lifestyle balance questions
                  </p>
                </div>
              </div>
              <p className="font-serif italic text-xs text-deepgreen/80">
                Powers your compatibility percentage so you only live with people you genuinely vibe with.
              </p>
            </div>

            <div className="pt-3 border-t border-deepgreen/20">
              <Link
                href="/quiz"
                className="font-mono text-xs text-tomato hover:text-tomato-dark underline font-bold uppercase block text-center"
              >
                Play Chemistry Quiz →
              </Link>
            </div>
          </div>
        </div>

        {/* Free Email Verification Action Desk */}
        {!state?.badgeEligible ? (
          <div id="email-verification-desk" className="border-2 border-deepgreen bg-cream-light p-6 sm:p-8 shadow-[6px_6px_0px_#263F32] space-y-6">
            <div className="border-b border-deepgreen/20 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-tomato font-bold block mb-1">
                INSTANT FREE VERIFICATION
              </span>
              <h3 className="font-serif font-black uppercase text-2xl text-deepgreen">
                Confirm Your Email Address
              </h3>
              <p className="font-serif italic text-xs text-deepgreen/70 mt-1">
                Zero document uploads, no government ID friction, and no carrier SMS fees. Supabase sends a secure confirmation magic link &amp; code directly to your inbox.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Send Email & Magic Link Instructions */}
              <div className="space-y-4 border-b md:border-b-0 md:border-r border-deepgreen/20 pb-6 md:pb-0 md:pr-6">
                <div className="p-3 bg-butter/30 border border-deepgreen font-mono text-xs space-y-1">
                  <span className="text-[10px] text-deepgreen/60 uppercase block">Registered Email Address:</span>
                  <span className="font-bold text-sm text-deepgreen">{userEmail || 'Your Account Email'}</span>
                </div>

                <form onSubmit={handleSendVerificationEmail} className="space-y-3">
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="w-full py-3 bg-tomato hover:bg-tomato-dark text-cream-light font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[3px_3px_0px_#263F32] transition-all hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Dispatching Verification Email...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Verification Email / Magic Link ↗</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="p-3.5 bg-cream border border-deepgreen/40 space-y-2 text-xs">
                  <span className="font-mono font-bold text-deepgreen uppercase block text-[11px]">
                    Method A: One-Click Magic Link (Recommended)
                  </span>
                  <p className="font-serif text-deepgreen/80 text-xs leading-relaxed">
                    Open your email inbox and click the **"Confirm Your Email"** or **"Log In"** button. Your browser will authenticate automatically and grant your verified badge!
                  </p>
                  <button
                    type="button"
                    onClick={() => refreshStatus(true)}
                    disabled={isRefreshing}
                    className="w-full mt-1 py-1.5 bg-cream border border-deepgreen hover:bg-butter font-mono text-[11px] font-bold uppercase text-deepgreen flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>I Clicked the Link — Check Status</span>
                  </button>
                </div>
              </div>

              {/* Right Column: ALWAYS VISIBLE Code Input Space */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="font-mono text-xs uppercase font-bold text-deepgreen block">
                    Method B: Enter 6-Digit Code / Token
                  </span>
                  <p className="font-serif italic text-xs text-deepgreen/70">
                    If your email contained a 6-digit confirmation code, enter it below to verify immediately:
                  </p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-deepgreen/70 block">
                      VERIFICATION CODE / PASSCODE
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 123456"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-deepgreen bg-cream font-mono text-lg tracking-widest text-deepgreen placeholder:text-deepgreen/30 focus:outline-none focus:border-tomato"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingCode || !otpInput.trim()}
                    className="w-full py-3 bg-deepgreen hover:bg-tomato text-cream font-mono text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_#E95D43] transition-all hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isVerifyingCode ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Validating Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify Code &amp; Claim Badge</span>
                      </>
                    )}
                  </button>
                </form>

                <p className="font-mono text-[10px] text-deepgreen/60">
                  Tip: Emails usually arrive within 2–5 seconds. Check your spam/promotions folder if you don't see it immediately.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-deepgreen bg-emerald-50/70 p-6 sm:p-8 shadow-[6px_6px_0px_#263F32] space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-600 text-white border-2 border-deepgreen shadow-[2px_2px_0px_#263F32]">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 border border-emerald-400">
                    TRUST STATUS: FULLY VERIFIED
                  </span>
                </div>
                <h3 className="font-serif font-black uppercase text-2xl text-deepgreen">
                  Your Account Holds Verified Member Standing
                </h3>
                <p className="font-serif italic text-xs text-deepgreen/80 max-w-xl">
                  You now carry the verified green checkmark across Roommate Discovery, direct chat messages, and room listings.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-200 flex flex-wrap gap-4">
              <Link
                href="/discover"
                className="px-5 py-2.5 bg-deepgreen text-cream font-mono text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_#E95D43] hover:bg-tomato transition-colors"
              >
                Browse Roommates →
              </Link>
              <Link
                href="/rooms"
                className="px-5 py-2.5 bg-cream border border-deepgreen text-deepgreen font-mono text-xs font-bold uppercase tracking-wider hover:bg-butter transition-colors"
              >
                Explore Rooms →
              </Link>
            </div>
          </div>
        )}

        {/* Anti-Broker Community Principles */}
        <div className="border-t-2 border-deepgreen pt-6 text-xs font-mono text-deepgreen/70 space-y-2">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-deepgreen">
            <Sparkles className="w-3.5 h-3.5 text-tomato" />
            <span>YAARO Collective Living Standard</span>
          </div>
          <p className="font-serif italic text-sm text-deepgreen/80">
            “No brokerage, no fake listings, no aggressive landlords. YAARO connects real young adults who share living values, cleanliness standards, and mutual respect.”
          </p>
        </div>
      </main>
    </div>
  )
}
