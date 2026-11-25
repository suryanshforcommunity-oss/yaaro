'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { resetPasswordForEmail } from '@/lib/auth'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const res = await resetPasswordForEmail(email)
    setIsLoading(false)

    if (res.success) {
      setMessage('Recovery pass dispatched! Check your email inbox.')
    } else {
      setError(res.error || 'Failed to dispatch password recovery link.')
    }
  }

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-md mx-auto w-full pt-4 pb-6 flex items-center justify-between border-b-2 border-deepgreen">
        <Link href="/" className="text-3xl font-black uppercase tracking-tighter text-deepgreen">
          YAARO<span className="text-tomato font-serif italic text-2xl lowercase">.live</span>
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-deepgreen bg-butter text-deepgreen font-bold">
          Dossier Recovery
        </span>
      </div>

      <div className="max-w-md mx-auto w-full my-auto py-8">
        <div className="border-2 border-deepgreen bg-cream-light p-6 sm:p-8 shadow-[6px_6px_0px_#263F32] relative">
          <h2 className="text-3xl font-black uppercase tracking-tight text-deepgreen leading-tight">
            RECOVER YOUR <br />
            <span className="font-serif italic font-normal text-tomato lowercase">living</span> ACCESS.
          </h2>

          <p className="font-serif italic text-sm text-deepgreen/80 mt-2 mb-6">
            Enter your registered email address and we will dispatch a secure recovery link to your inbox.
          </p>

          {error && (
            <div className="mb-4 p-3 border border-red-500 bg-red-50 text-red-800 text-xs font-mono flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 border border-emerald-600 bg-emerald-50 text-emerald-800 text-xs font-mono flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                REGISTERED EMAIL
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border border-deepgreen shadow-[3px_3px_0px_#263F32] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Dispatch Recovery Pass ↗</span>}
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-deepgreen/20 text-center font-serif text-sm">
            <Link href="/login" className="text-tomato font-bold hover:underline">
              ← Return to Dossier Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full pb-4 text-center font-mono text-[10px] text-deepgreen/50">
        © 2026 YAARO CO-LIVING TECHNOLOGIES. ZERO BROKERAGE PROMISE.
      </div>
    </div>
  )
}
