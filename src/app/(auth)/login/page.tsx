'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Phone, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { sendPhoneOtp, verifyPhoneOtp, signInWithEmail } from '@/lib/auth'
import GoogleAuthButton from '@/components/GoogleAuthButton'

export default function LoginPage() {
  const router = useRouter()
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email')

  // Phone OTP States
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpNotice, setOtpNotice] = useState<string | null>(null)

  // Email States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Status States
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    const res = await sendPhoneOtp(phone)
    setIsLoading(false)

    if (res.success) {
      setOtpSent(true)
      setOtpNotice(res.data?.message || 'OTP sent successfully! Check your phone.')
      if (res.data?.simulated) {
        setOtp('123456') // Pre-fill in dev mode
      }
    } else {
      setErrorMessage(res.error || 'Failed to send OTP. Please check your phone number.')
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    const res = await verifyPhoneOtp(phone, otp)
    setIsLoading(false)

    if (res.success) {
      setSuccessMessage('Verified! Entering the YAARO Collective...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } else {
      setErrorMessage(res.error || 'Invalid OTP code. Please try again.')
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    const res = await signInWithEmail(formData)
    setIsLoading(false)

    if (res.success) {
      setSuccessMessage('Signed in! Welcome back to YAARO.')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } else {
      setErrorMessage(res.error || 'Invalid email or password.')
    }
  }

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Header Stamp */}
      <div className="max-w-md mx-auto w-full pt-4 pb-6 flex items-center justify-between border-b-2 border-deepgreen">
        <Link href="/" className="text-3xl font-black uppercase tracking-tighter text-deepgreen">
          YAARO<span className="text-tomato font-serif italic text-2xl lowercase">.live</span>
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-deepgreen bg-butter text-deepgreen font-bold">
          Dossier Sign In
        </span>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md mx-auto w-full my-auto py-8">
        <div className="border-2 border-deepgreen bg-cream-light p-6 sm:p-8 shadow-[6px_6px_0px_#263F32] relative">
          {/* Magazine Sub-header */}
          <div className="flex items-center justify-between border-b border-deepgreen/20 pb-4 mb-6">
            <span className="font-mono text-xs uppercase tracking-widest text-tomato font-bold">
              Living Collective Pass
            </span>
            <span className="font-mono text-[11px] text-deepgreen/60">Bangalore • Mumbai • Delhi</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-deepgreen leading-tight">
            RETURN TO YOUR <br />
            <span className="font-serif italic font-normal text-tomato lowercase">chosen</span> PEOPLE.
          </h2>

          <p className="font-serif italic text-sm text-deepgreen/80 mt-2 mb-6">
            Sign in to check flatmate chemistry scores, verified rooms, and your shared living ledger.
          </p>

          {/* Quick Google Sign In */}
          <div className="mb-6 space-y-4">
            <GoogleAuthButton
              label="Continue with Google"
              redirectTo="/dashboard"
              onError={(err) => setErrorMessage(err)}
            />

            <div className="relative flex items-center justify-center">
              <div className="border-t border-deepgreen/20 w-full" />
              <span className="bg-cream-light px-3 font-mono text-[10px] uppercase text-deepgreen/60 font-bold shrink-0">
                or sign in via
              </span>
              <div className="border-t border-deepgreen/20 w-full" />
            </div>
          </div>

          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6 font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email')
                setErrorMessage(null)
              }}
              className={`py-2 px-3 border-2 transition-all flex items-center justify-center gap-2 font-bold ${
                authMethod === 'email'
                  ? 'border-deepgreen bg-deepgreen text-cream shadow-[2px_2px_0px_#E95D43]'
                  : 'border-deepgreen/40 bg-cream text-deepgreen/80 hover:border-deepgreen'
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>EMAIL SIGN IN</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('phone')
                setErrorMessage(null)
              }}
              className={`py-2 px-3 border-2 transition-all flex items-center justify-center gap-2 font-bold ${
                authMethod === 'phone'
                  ? 'border-deepgreen bg-deepgreen text-cream shadow-[2px_2px_0px_#E95D43]'
                  : 'border-deepgreen/40 bg-cream text-deepgreen/80 hover:border-deepgreen'
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              <span>PHONE (DEMO)</span>
            </button>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="mb-4 p-3 border border-red-500 bg-red-50 text-red-800 text-xs font-mono flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 border border-emerald-600 bg-emerald-50 text-emerald-800 text-xs font-mono flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* PHONE OTP AUTHENTICATION */}
          {authMethod === 'phone' && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                      INDIAN MOBILE NUMBER (+91)
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 border-2 border-r-0 border-deepgreen bg-butter text-deepgreen font-mono text-xs font-bold">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="98765 43210"
                        required
                        className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-mono text-deepgreen placeholder:text-deepgreen/40 focus:outline-none focus:border-tomato"
                      />
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-deepgreen/60">
                      Standard SMS verification. No spam guaranteed.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border border-deepgreen shadow-[3px_3px_0px_#263F32] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Request OTP Pass ↗</span>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {otpNotice && (
                    <div className="p-3 bg-butter/40 border border-deepgreen font-mono text-xs text-deepgreen">
                      {otpNotice}
                    </div>
                  )}

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                      ENTER 6-DIGIT CODE
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="• • • • • •"
                      required
                      className="w-full tracking-widest text-center text-lg border-2 border-deepgreen bg-cream px-3 py-2 font-mono text-deepgreen focus:outline-none focus:border-tomato"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-deepgreen hover:bg-tomato text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors shadow-[3px_3px_0px_#E95D43] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Verify &amp; Enter YAARO →</span>}
                  </button>

                  <div className="flex justify-between items-center text-xs font-mono pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-deepgreen/70 hover:text-tomato underline"
                    >
                      Change Number
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-tomato font-bold hover:underline"
                    >
                      Resend Code
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* EMAIL AUTHENTICATION */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                  WORK OR PERSONAL EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-mono text-deepgreen placeholder:text-deepgreen/40 focus:outline-none focus:border-tomato"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold">
                    PASSWORD
                  </label>
                  <Link
                    href="/reset-password"
                    className="font-mono text-[10px] text-tomato hover:underline uppercase"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-mono text-deepgreen placeholder:text-deepgreen/40 focus:outline-none focus:border-tomato"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border border-deepgreen shadow-[3px_3px_0px_#263F32] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Sign In to YAARO ↗</span>}
              </button>
            </form>
          )}

          {/* Switch to Signup */}
          <div className="mt-8 pt-4 border-t border-deepgreen/20 text-center font-serif text-sm">
            <span className="text-deepgreen/70">New to the collective? </span>
            <Link href="/signup" className="text-tomato font-bold hover:underline">
              Register Your Living Profile →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="max-w-md mx-auto w-full pb-4 text-center font-mono text-[10px] text-deepgreen/50">
        © 2026 YAARO CO-LIVING TECHNOLOGIES. ZERO BROKERAGE PROMISE.
      </div>
    </div>
  )
}
