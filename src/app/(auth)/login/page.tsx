'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2, Sparkles, Send } from 'lucide-react'
import { sendEmailMagicLink, verifyEmailOtp, signInWithEmail } from '@/lib/auth'
import GoogleAuthButton from '@/components/GoogleAuthButton'

export default function LoginPage() {
  const router = useRouter()
  const [authMethod, setAuthMethod] = useState<'magic_link' | 'password'>('magic_link')

  // Email States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Magic Link / OTP States
  const [otp, setOtp] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // Status States
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setErrorMessage(null)
    setIsLoading(true)

    const res = await sendEmailMagicLink(email)
    setIsLoading(false)

    if (res.success) {
      setMagicLinkSent(true)
      setSuccessMessage('Magic Link sent to your inbox! Click the button in the email to log in instantly, or enter the code below.')
    } else {
      setErrorMessage(res.error || 'Failed to dispatch magic link. Please check your email.')
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) {
      setErrorMessage('Please enter the code or token from your email.')
      return
    }

    setErrorMessage(null)
    setIsLoading(true)

    const res = await verifyEmailOtp(email, otp)
    setIsLoading(false)

    if (res.success) {
      const isAdmin = email.trim().toLowerCase() === 'admin@yaaro.live'
      setSuccessMessage(isAdmin ? 'Admin authenticated! Entering Operator Command...' : 'Verified! Entering the YAARO Collective...')
      setTimeout(() => {
        router.push(isAdmin ? '/admin' : '/dashboard')
      }, 800)
    } else {
      setErrorMessage(res.error || 'Invalid code or expired magic link. Please check your inbox.')
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    const res = await signInWithEmail(formData)
    setIsLoading(false)

    if (res.success) {
      const isAdmin = email.trim().toLowerCase() === 'admin@yaaro.live'
      setSuccessMessage(isAdmin ? 'Admin authenticated! Entering Operator Command...' : 'Signed in! Welcome back to YAARO.')
      setTimeout(() => {
        router.push(isAdmin ? '/admin' : '/dashboard')
      }, 800)
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
          Resident Access
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
            <span className="font-mono text-[11px] text-deepgreen/60">Bangalore • Mumbai • Pune</span>
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
                or email access
              </span>
              <div className="border-t border-deepgreen/20 w-full" />
            </div>
          </div>

          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6 font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('magic_link')
                setErrorMessage(null)
              }}
              className={`py-2 px-3 border-2 transition-all flex items-center justify-center gap-2 font-bold ${
                authMethod === 'magic_link'
                  ? 'border-deepgreen bg-deepgreen text-cream shadow-[2px_2px_0px_#E95D43]'
                  : 'border-deepgreen/40 bg-cream text-deepgreen/80 hover:border-deepgreen'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-butter" />
              <span>MAGIC LINK</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password')
                setErrorMessage(null)
              }}
              className={`py-2 px-3 border-2 transition-all flex items-center justify-center gap-2 font-bold ${
                authMethod === 'password'
                  ? 'border-deepgreen bg-deepgreen text-cream shadow-[2px_2px_0px_#E95D43]'
                  : 'border-deepgreen/40 bg-cream text-deepgreen/80 hover:border-deepgreen'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>PASSWORD</span>
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

          {/* MAGIC LINK & EMAIL CODE AUTHENTICATION */}
          {authMethod === 'magic_link' && (
            <div className="space-y-4">
              <form onSubmit={handleSendMagicLink} className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                    YOUR REGISTERED EMAIL
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-mono text-deepgreen placeholder:text-deepgreen/40 focus:outline-none focus:border-tomato"
                  />
                  <p className="mt-1 font-mono text-[10px] text-deepgreen/60">
                    We will send a 1-tap sign-in link and verification code to your inbox.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border border-deepgreen shadow-[3px_3px_0px_#263F32] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Instant Magic Link ↗</span>
                    </>
                  )}
                </button>
              </form>

              {/* DEDICATED CODE INPUT SPACE (Always visible or highlighted after dispatch) */}
              <div className="pt-4 border-t border-deepgreen/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold">
                    HAVE A 6-DIGIT CODE FROM EMAIL?
                  </span>
                  {magicLinkSent && (
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 border border-emerald-300 font-bold">
                      CODE DISPATCHED
                    </span>
                  )}
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-3">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code (e.g. 123456)"
                    className="w-full text-center text-base tracking-widest border-2 border-deepgreen bg-cream px-3 py-2 font-mono text-deepgreen placeholder:text-deepgreen/30 focus:outline-none focus:border-tomato"
                  />

                  <button
                    type="submit"
                    disabled={isLoading || !otp.trim()}
                    className="w-full py-2.5 bg-deepgreen hover:bg-tomato text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors shadow-[2px_2px_0px_#E95D43] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Sign In with Code →</span>}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* PASSWORD AUTHENTICATION */}
          {authMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
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
                  placeholder="••••••••"
                  required
                  className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-mono text-deepgreen placeholder:text-deepgreen/40 focus:outline-none focus:border-tomato"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-deepgreen hover:bg-tomato text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border border-deepgreen shadow-[3px_3px_0px_#E95D43] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Sign In with Password ↗</span>}
              </button>
            </form>
          )}

          {/* Registration Redirect Footer */}
          <div className="mt-6 pt-4 border-t border-deepgreen/20 text-center font-mono text-xs text-deepgreen/80">
            <span>New to the collective? </span>
            <Link
              href="/signup"
              className="text-tomato font-bold hover:underline uppercase"
            >
              Apply to Join YAARO ↗
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="max-w-md mx-auto w-full pb-4 text-center font-mono text-[10px] text-deepgreen/60">
        YAARO Collective Living Standard • Bangalore • Mumbai • Pune • Delhi
      </div>
    </div>
  )
}
