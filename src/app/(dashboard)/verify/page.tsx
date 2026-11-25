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
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Email OTP verification states
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [otpInput, setOtpInput] = useState<string>('')
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false)

  useEffect(() => {
    async function loadStatus() {
      setLoading(true)
      const res = await getVerificationStatusAction()
      if (res.success && res.state) {
        setState(res.state)
        setUserEmail(res.userEmail || '')
      }
      setLoading(false)
    }
    loadStatus()
  }, [])

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSendingOtp(true)
    setStatusMsg(null)

    const res = await sendEmailOtpAction()
    setIsSendingOtp(false)

    if (res.success) {
      setOtpSent(true)
      setStatusMsg({
        text: res.message || `Verification code sent to ${userEmail}. Check your inbox!`,
        type: 'success',
      })
    } else {
      setStatusMsg({ text: res.message || 'Failed to dispatch code.', type: 'error' })
    }
  }

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpInput.trim()) {
      setStatusMsg({ text: 'Please enter the 6-digit code received on your email.', type: 'error' })
      return
    }

    setIsVerifyingOtp(true)
    setStatusMsg(null)

    const res = await verifyEmailOtpAction(otpInput)
    setIsVerifyingOtp(false)

    if (res.success) {
      setStatusMsg({ text: 'Email verified! You are now a Verified YAARO Member.', type: 'success' })
      setOtpSent(false)
      const fresh = await getVerificationStatusAction()
      if (fresh.state) setState(fresh.state)
    } else {
      setStatusMsg({ text: res.message || 'Invalid verification code.', type: 'error' })
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
            <div className="shrink-0">
              {state?.badgeEligible ? (
                <div className="px-4 py-2 bg-emerald-100 border-2 border-emerald-700 text-emerald-900 font-mono text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#263F32]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>✓ VERIFIED YAARO MEMBER</span>
                </div>
              ) : (
                <div className="px-4 py-2 bg-butter border-2 border-deepgreen text-deepgreen font-mono text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#263F32]">
                  <Lock className="w-4 h-4 text-tomato" />
                  <span>1-MIN EMAIL VERIFICATION PENDING</span>
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
                100% Free OTP verification code sent directly to your inbox with zero SMS hurdles.
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
                  href="#email-otp-box"
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

        {/* Free Email Verification Action Box */}
        {!state?.badgeEligible ? (
          <div id="email-otp-box" className="border-2 border-deepgreen bg-cream-light p-6 sm:p-8 shadow-[6px_6px_0px_#263F32] space-y-6">
            <div className="border-b border-deepgreen/20 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-tomato font-bold block mb-1">
                INSTANT FREE VERIFICATION
              </span>
              <h3 className="font-serif font-black uppercase text-2xl text-deepgreen">
                Verify Your Email with a 6-Digit Code
              </h3>
              <p className="font-serif italic text-xs text-deepgreen/70 mt-1">
                Zero document uploads, no government ID friction, and no carrier SMS fees. We send a secure one-time passcode directly to your inbox.
              </p>
            </div>

            <div className="max-w-md space-y-4">
              <div className="p-3 bg-butter/30 border border-deepgreen font-mono text-xs space-y-1">
                <span className="text-[10px] text-deepgreen/60 uppercase block">Registered Email Address:</span>
                <span className="font-bold text-sm text-deepgreen">{userEmail || 'Your Account Email'}</span>
              </div>

              {!otpSent ? (
                <form onSubmit={handleSendEmailOtp} className="space-y-3">
                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className="w-full py-3 bg-tomato hover:bg-tomato-dark text-cream-light font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[3px_3px_0px_#263F32] transition-all hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Code to Inbox...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send 6-Digit Code to My Email</span>
                      </>
                    )}
                  </button>
                  <p className="font-mono text-[10px] text-deepgreen/60 text-center">
                    Check your inbox or spam folder. Dispatches in 2–3 seconds.
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyEmailOtp} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="font-mono text-xs uppercase font-bold text-deepgreen block">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 123456"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      maxLength={8}
                      className="w-full px-4 py-2.5 border-2 border-deepgreen bg-cream font-mono text-lg tracking-widest text-deepgreen placeholder:text-deepgreen/30 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isVerifyingOtp}
                      className="flex-1 py-3 bg-deepgreen hover:bg-tomato text-cream font-mono text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0px_#E95D43] transition-all hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Validating Code...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify &amp; Claim Badge</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={isSendingOtp}
                      className="py-3 px-4 border-2 border-deepgreen bg-cream hover:bg-butter/50 font-mono text-xs uppercase text-deepgreen font-bold"
                    >
                      Resend
                    </button>
                  </div>
                </form>
              )}
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
