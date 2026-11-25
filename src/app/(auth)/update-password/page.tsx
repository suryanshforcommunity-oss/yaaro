'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { updatePassword } from '@/lib/auth'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError(null)
    setIsLoading(true)

    const res = await updatePassword(password)
    setIsLoading(false)

    if (res.success) {
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } else {
      setError(res.error || 'Failed to update password.')
    }
  }

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-md mx-auto w-full pt-4 pb-6 flex items-center justify-between border-b-2 border-deepgreen">
        <Link href="/" className="text-3xl font-black uppercase tracking-tighter text-deepgreen">
          YAARO<span className="text-tomato font-serif italic text-2xl lowercase">.live</span>
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-deepgreen bg-butter text-deepgreen font-bold">
          Credential Calibration
        </span>
      </div>

      <div className="max-w-md mx-auto w-full my-auto py-8">
        <div className="border-2 border-deepgreen bg-cream-light p-6 sm:p-8 shadow-[6px_6px_0px_#263F32] relative">
          <h2 className="text-3xl font-black uppercase tracking-tight text-deepgreen leading-tight">
            UPDATE YOUR <br />
            <span className="font-serif italic font-normal text-tomato lowercase">secure</span> PASSWORD.
          </h2>

          <p className="font-serif italic text-sm text-deepgreen/80 mt-2 mb-6">
            Enter your new credentials below to restore complete access to your living collective dashboard.
          </p>

          {error && (
            <div className="mb-4 p-3 border border-red-500 bg-red-50 text-red-800 text-xs font-mono flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 border border-emerald-600 bg-emerald-50 text-emerald-800 text-xs font-mono flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Password successfully calibrated! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                NEW PASSWORD
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
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-deepgreen font-bold mb-1">
                CONFIRM NEW PASSWORD
              </label>
              <input
                type="password"
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-mono text-deepgreen placeholder:text-deepgreen/40 focus:outline-none focus:border-tomato"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors border border-deepgreen shadow-[3px_3px_0px_#263F32] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Update Dossier Password ↗</span>}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full pb-4 text-center font-mono text-[10px] text-deepgreen/50">
        © 2026 YAARO CO-LIVING TECHNOLOGIES. AUTHENTIC LIVING VERIFIED.
      </div>
    </div>
  )
}
