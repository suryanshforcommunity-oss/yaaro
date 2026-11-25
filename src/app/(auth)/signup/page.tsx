'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { signUpWithEmail } from '@/lib/auth'
import GoogleAuthButton from '@/components/GoogleAuthButton'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreeTerms) {
      setErrorMessage('Please agree to YAARO community living principles and guidelines.')
      return
    }

    setErrorMessage(null)
    setIsLoading(true)

    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('email', email)
    formData.append('password', password)

    const res = await signUpWithEmail(formData)
    setIsLoading(false)

    if (res.success) {
      setSuccessMessage('Account registered! Taking you to calibrate your living preferences...')
      setTimeout(() => {
        router.push('/onboarding')
      }, 1000)
    } else {
      setErrorMessage(res.error || 'Registration failed. Please check your credentials.')
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
          Issue 01 • Registration
        </span>
      </div>

      {/* Main Signup Card */}
      <div className="max-w-md mx-auto w-full my-auto py-8">
        <div className="border-2 border-deepgreen bg-cream-light p-6 sm:p-8 shadow-[6px_6px_0px_#263F32] relative">
          <div className="flex items-center justify-between border-b border-deepgreen/20 pb-4 mb-6">
            <span className="font-mono text-xs uppercase tracking-widest text-tomato font-bold">
              Join the Living Collective
            </span>
            <span className="font-mono text-[11px] text-deepgreen/60">Bangalore • Mumbai • Delhi</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-deepgreen leading-tight">
            FIND YOUR PEOPLE. <br />
            <span className="font-serif italic font-normal text-tomato lowercase">and then,</span> <br />
            FIND YOUR PLACE.
          </h2>

          <p className="font-serif italic text-sm text-deepgreen/80 mt-2 mb-6">
            Create your dossier to match with verified young professionals who respect your exact living rhythms.
          </p>

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

          {/* Quick Google Sign In */}
          <div className="mb-6 space-y-4">
            <GoogleAuthButton
              label="Quick Sign Up with Google"
              redirectTo="/onboarding"
              onError={(err) => setErrorMessage(err)}
            />

            <div className="relative flex items-center justify-center">
              <div className="border-t border-deepgreen/20 w-full" />
              <span className="bg-cream-light px-3 font-mono text-[10px] uppercase text-deepgreen/60 font-bold shrink-0">
                or register with email
              </span>
              <div className="border-t border-deepgreen/20 w-full" />
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                FULL LEGAL NAME
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Kabir Sethi"
                required
                className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-serif text-deepgreen placeholder:text-deepgreen/40 focus:outline-none focus:border-tomato"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                WORK OR PERSONAL EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-mono text-deepgreen placeholder:text-deepgreen/40 focus:outline-none focus:border-tomato"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                SET A SECURE PASSWORD
              </label>
              <input
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-mono text-deepgreen placeholder:text-deepgreen/40 focus:outline-none focus:border-tomato"
              />
              <span className="font-mono text-[10px] text-deepgreen/50 block mt-1">Minimum 6 characters.</span>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2.5 pt-2">
              <input
                id="terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-none border-2 border-deepgreen text-tomato focus:ring-0"
              />
              <label htmlFor="terms" className="font-serif text-xs text-deepgreen/80 leading-relaxed cursor-pointer">
                I pledge to respect domestic kitchen etiquette, quiet hours, and the zero-brokerage transparent community standard.
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border border-deepgreen shadow-[3px_3px_0px_#263F32] flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Complete Registration ↗</span>}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-8 pt-4 border-t border-deepgreen/20 text-center font-serif text-sm">
            <span className="text-deepgreen/70">Already a registered flatmate? </span>
            <Link href="/login" className="text-tomato font-bold hover:underline">
              Sign In to Your Dossier →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="max-w-md mx-auto w-full pb-4 text-center font-mono text-[10px] text-deepgreen/50">
        © 2026 YAARO CO-LIVING TECHNOLOGIES. AUTHENTIC LIVING VERIFIED.
      </div>
    </div>
  )
}
