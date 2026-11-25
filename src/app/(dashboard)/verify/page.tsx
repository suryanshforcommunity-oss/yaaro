'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  FileText,
  Upload,
  ArrowRight,
  Clock,
  XCircle,
  Sparkles,
  Lock,
} from 'lucide-react'
import EditorialNavigation from '@/components/EditorialNavigation'
import {
  getVerificationStatusAction,
  submitIdentityVerificationAction,
  verifyPhoneOtpAction,
} from './actions'
import type { VerificationType, VerificationProfileState } from '@/lib/verification'

export default function VerificationCenterPage() {
  const [state, setState] = useState<VerificationProfileState | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Phone verification state
  const [phoneInput, setPhoneInput] = useState<string>('')
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [otpInput, setOtpInput] = useState<string>('')
  const [isVerifyingPhone, setIsVerifyingPhone] = useState<boolean>(false)

  // Document verification state
  const [docType, setDocType] = useState<VerificationType>('aadhaar')
  const [docUrl, setDocUrl] = useState<string>('')
  const [maskedId, setMaskedId] = useState<string>('')
  const [isSubmittingDoc, setIsSubmittingDoc] = useState<boolean>(false)

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

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneInput || phoneInput.length < 10) {
      setStatusMsg({ text: 'Please enter a valid 10-digit Indian phone number.', type: 'error' })
      return
    }
    setOtpSent(true)
    setStatusMsg({ text: 'SMS OTP sent to ' + phoneInput + '. (Use test code: 1234)', type: 'success' })
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifyingPhone(true)
    const res = await verifyPhoneOtpAction(phoneInput, otpInput)
    setIsVerifyingPhone(false)
    if (res.success) {
      setStatusMsg({ text: 'Phone verified successfully!', type: 'success' })
      setOtpSent(false)
      const fresh = await getVerificationStatusAction()
      if (fresh.state) setState(fresh.state)
    } else {
      setStatusMsg({ text: res.message, type: 'error' })
    }
  }

  const handleSubmitDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docUrl.trim()) {
      setStatusMsg({ text: 'Please provide a document image link or upload preview URL.', type: 'error' })
      return
    }
    setIsSubmittingDoc(true)
    const res = await submitIdentityVerificationAction(docType, docUrl, maskedId)
    setIsSubmittingDoc(false)
    if (res.success) {
      setStatusMsg({ text: res.message, type: 'success' })
      const fresh = await getVerificationStatusAction()
      if (fresh.state) setState(fresh.state)
    } else {
      setStatusMsg({ text: res.message, type: 'error' })
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
                <span>VOL. 07 // TRUST &amp; COMPLIANCE DESK</span>
                <span>•</span>
                <span className="text-deepgreen/70">Anti-Broker &amp; Identity Integrity Standard</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deepgreen mt-0.5">
                VERIFICATION CENTER
              </h1>
              <p className="font-serif italic text-sm text-deepgreen/80 mt-1 max-w-2xl">
                YAARO protects the collective by eliminating disguised brokers, deposit scammers, and phantom listings.
                Badges are earned exclusively through authentic review.
              </p>
            </div>

            {/* Current Badge Status Pill */}
            <div className="shrink-0">
              {state?.badgeEligible ? (
                <div className="px-4 py-2 bg-emerald-100 border-2 border-emerald-700 text-emerald-900 font-mono text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#263F32]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>✓ VERIFIED YAARO MEMBER</span>
                </div>
              ) : state?.overallStatus === 'pending' ? (
                <div className="px-4 py-2 bg-butter border-2 border-deepgreen text-deepgreen font-mono text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#263F32]">
                  <Clock className="w-4 h-4 text-tomato animate-spin" />
                  <span>⏳ REVIEW IN PROGRESS</span>
                </div>
              ) : (
                <div className="px-4 py-2 bg-cream-light border-2 border-deepgreen text-deepgreen/80 font-mono text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#263F32]">
                  <Lock className="w-4 h-4 text-tomato" />
                  <span>STANDARD (UNVERIFIED)</span>
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
            <button onClick={() => setStatusMsg(null)} className="underline">Dismiss</button>
          </div>
        )}

        {/* Verification Overview Grid (3 Steps) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Email Verification */}
          <div className="border-2 border-deepgreen bg-cream-light p-5 space-y-4 shadow-[4px_4px_0px_#263F32] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-tomato uppercase tracking-widest">
                  STAGE 01
                </span>
                <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  CONFIRMED
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 border border-deepgreen bg-cream text-deepgreen">
                  <Mail className="w-5 h-5 text-tomato" />
                </div>
                <div>
                  <h4 className="font-serif font-black uppercase text-sm text-deepgreen">
                    Email Authentication
                  </h4>
                  <p className="font-mono text-xs text-deepgreen/60 truncate max-w-[200px]">
                    {userEmail || 'Active session'}
                  </p>
                </div>
              </div>
              <p className="font-serif italic text-xs text-deepgreen/80">
                Primary contact route for match confirmations and rental agreements.
              </p>
            </div>
            <div className="pt-3 border-t border-deepgreen/20 font-mono text-[11px] text-emerald-800 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Identity Anchor Verified</span>
            </div>
          </div>

          {/* Step 2: Phone Number Verification */}
          <div className="border-2 border-deepgreen bg-cream-light p-5 space-y-4 shadow-[4px_4px_0px_#263F32] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-tomato uppercase tracking-widest">
                  STAGE 02
                </span>
                {state?.isPhoneVerified ? (
                  <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    VERIFIED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-tomato/10 text-tomato border border-tomato/30">
                    ACTION NEEDED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 border border-deepgreen bg-cream text-deepgreen">
                  <Phone className="w-5 h-5 text-tomato" />
                </div>
                <div>
                  <h4 className="font-serif font-black uppercase text-sm text-deepgreen">
                    Phone Verification
                  </h4>
                  <p className="font-mono text-xs text-deepgreen/60">
                    {state?.isPhoneVerified ? 'Confirmed via SMS OTP' : 'Anti-Spam OTP Protocol'}
                  </p>
                </div>
              </div>
              <p className="font-serif italic text-xs text-deepgreen/80">
                Required before initiating chat dialogues or submitting room listing inquiries.
              </p>
            </div>

            {state?.isPhoneVerified ? (
              <div className="pt-3 border-t border-deepgreen/20 font-mono text-[11px] text-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mobile Link Confirmed</span>
              </div>
            ) : (
              <div className="pt-3 border-t border-deepgreen/20 space-y-2">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-2">
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full px-3 py-1.5 border border-deepgreen bg-cream font-mono text-xs text-deepgreen placeholder:text-deepgreen/40 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-deepgreen text-cream font-mono text-xs font-bold uppercase hover:bg-tomato transition-colors"
                    >
                      Send Verification OTP
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-2">
                    <input
                      type="text"
                      placeholder="Enter 4-digit OTP (e.g. 1234)"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="w-full px-3 py-1.5 border border-deepgreen bg-cream font-mono text-xs text-deepgreen placeholder:text-deepgreen/40 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isVerifyingPhone}
                      className="w-full py-1.5 bg-tomato text-cream font-mono text-xs font-bold uppercase hover:bg-tomato-dark transition-colors disabled:opacity-50"
                    >
                      {isVerifyingPhone ? 'Verifying...' : 'Confirm OTP'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Identity Document Verification */}
          <div className="border-2 border-deepgreen bg-cream-light p-5 space-y-4 shadow-[4px_4px_0px_#263F32] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-tomato uppercase tracking-widest">
                  STAGE 03
                </span>
                {state?.isIdentityVerified ? (
                  <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    APPROVED
                  </span>
                ) : state?.overallStatus === 'pending' ? (
                  <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-butter text-deepgreen border border-deepgreen/40">
                    UNDER REVIEW
                  </span>
                ) : state?.overallStatus === 'rejected' ? (
                  <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-tomato text-cream">
                    REJECTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-deepgreen/10 text-deepgreen/70">
                    OPTIONAL BADGE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 border border-deepgreen bg-cream text-deepgreen">
                  <ShieldCheck className="w-5 h-5 text-tomato" />
                </div>
                <div>
                  <h4 className="font-serif font-black uppercase text-sm text-deepgreen">
                    Identity Document
                  </h4>
                  <p className="font-mono text-xs text-deepgreen/60">
                    Aadhaar / Passport / College ID / Work Badge
                  </p>
                </div>
              </div>
              <p className="font-serif italic text-xs text-deepgreen/80">
                Grants the official Verified YAARO badge, unlocks priority discovery ranking, and tenant fast-track.
              </p>
            </div>

            <div className="pt-3 border-t border-deepgreen/20">
              {state?.isIdentityVerified ? (
                <div className="font-mono text-[11px] text-emerald-800 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Document Authenticated</span>
                </div>
              ) : state?.overallStatus === 'pending' ? (
                <div className="font-mono text-[11px] text-deepgreen font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-tomato" />
                  <span>Submitted {state?.submittedAt ? new Date(state.submittedAt).toLocaleDateString('en-IN') : 'recently'}</span>
                </div>
              ) : (
                <a
                  href="#document-upload"
                  className="font-mono text-xs text-tomato underline font-bold uppercase block text-center"
                >
                  Submit Document Below ↓
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Identity Document Submission Form */}
        {!state?.isIdentityVerified && (
          <div id="document-upload" className="border-2 border-deepgreen bg-cream-light p-6 sm:p-8 shadow-[6px_6px_0px_#263F32] space-y-6">
            <div className="border-b border-deepgreen/20 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-tomato font-bold block mb-1">
                COMPLIANCE SUBMISSION PORTAL
              </span>
              <h3 className="font-serif font-black uppercase text-2xl text-deepgreen">
                Submit Government or Institutional Credential
              </h3>
              <p className="font-serif italic text-xs text-deepgreen/70 mt-1">
                Your documents are encrypted with AES-256 and reviewed solely by verified human moderators.
                Numbers are masked and never shared with other roommates or public profiles.
              </p>
            </div>

            {state?.rejectionReason && (
              <div className="p-4 bg-tomato/10 border-2 border-tomato text-deepgreen space-y-1">
                <span className="font-mono text-xs uppercase font-bold text-tomato block">
                  Previous Submission Note from Moderator:
                </span>
                <p className="font-serif text-xs text-deepgreen/90">{state.rejectionReason}</p>
              </div>
            )}

            <form onSubmit={handleSubmitDocument} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Document Type Selector */}
                <div className="space-y-1.5">
                  <label className="font-mono text-xs uppercase font-bold text-deepgreen block">
                    1. Credential Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as VerificationType)}
                    className="w-full px-3 py-2 border-2 border-deepgreen bg-cream font-serif text-sm text-deepgreen focus:outline-none"
                  >
                    <option value="aadhaar">Government ID (Aadhaar / Voter ID / Passport)</option>
                    <option value="college_id">University / College Student ID Card</option>
                    <option value="work_email">Corporate Work ID / Official Employment Letter</option>
                    <option value="social_linkedin">Verified Professional Profile (LinkedIn)</option>
                  </select>
                </div>

                {/* Masked ID Reference */}
                <div className="space-y-1.5">
                  <label className="font-mono text-xs uppercase font-bold text-deepgreen block">
                    2. Masked Reference (Last 4 Digits / Roll No.)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. •••• 9821 or EMP-4029"
                    value={maskedId}
                    onChange={(e) => setMaskedId(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-deepgreen bg-cream font-mono text-xs text-deepgreen focus:outline-none placeholder:text-deepgreen/40"
                  />
                </div>
              </div>

              {/* Document Image Link or Upload Preview */}
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase font-bold text-deepgreen block">
                  3. Document Image Link or Secure Storage URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or uploaded document link"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-deepgreen bg-cream font-mono text-xs text-deepgreen focus:outline-none placeholder:text-deepgreen/40"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDocUrl(
                        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80'
                      )
                    }
                    className="px-3 py-2 border-2 border-deepgreen bg-butter text-deepgreen font-mono text-xs font-bold hover:bg-yellow-300 transition-colors"
                  >
                    Sample Preview
                  </button>
                </div>
                <span className="font-mono text-[10px] text-deepgreen/60 block">
                  PNG, JPG, or PDF. Ensure full legal name and photo are legible. Sensitive numbers can be masked.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingDoc}
                className="w-full sm:w-auto px-8 py-3 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors shadow-[3px_3px_0px_#263F32] disabled:opacity-50"
              >
                {isSubmittingDoc ? 'Submitting to Compliance Desk...' : 'Submit Credential for Review ↗'}
              </button>
            </form>
          </div>
        )}

        {/* Verification Guarantee & Standards */}
        <div className="border-2 border-deepgreen bg-cream p-6 shadow-[4px_4px_0px_#263F32] space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs uppercase font-bold text-deepgreen">
            <ShieldCheck className="w-4 h-4 text-tomato" />
            <span>THE YAARO VERIFICATION PLEDGE</span>
          </div>
          <p className="font-serif text-xs text-deepgreen/80 leading-relaxed">
            In accordance with YAARO architectural policy, verified member badges are mathematically grounded in genuine
            compliance records. Profiles without confirmed telephone credentials and human-audited identity documents
            are restricted from claiming verified status across our matching feed and room directory.
          </p>
        </div>
      </main>
    </div>
  )
}
