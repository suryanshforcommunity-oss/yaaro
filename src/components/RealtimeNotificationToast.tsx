'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, AlertTriangle, Ban, X, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface LiveAlert {
  id: string
  type: 'verified' | 'revoked' | 'suspended' | 'general'
  title: string
  body: string
  actionUrl?: string
}

export default function RealtimeNotificationToast() {
  const [activeAlert, setActiveAlert] = useState<LiveAlert | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    let notifChannel: any = null
    let isMounted = true

    async function setupListener() {
      try {
        const supabase = createClient()
        if (!supabase) return

        const { data, error } = await supabase.auth.getUser()
        if (error || !data?.user || !isMounted) return
        const user = data.user

        // Don't show resident alert popups to the admin account itself
        if (user.email?.toLowerCase() === 'admin@yaaro.live') return

        setCurrentUserId(user.id)

        // 1. Listen for new notifications specifically targeting this user
        notifChannel = supabase
          .channel(`realtime_alerts_${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload: any) => {
              if (!isMounted) return
              const notif = payload?.new
              if (!notif) return

              let alertType: LiveAlert['type'] = 'general'
              if (notif.type === 'verification_approved') alertType = 'verified'
              else if (notif.type === 'verification_revoked') alertType = 'revoked'
              else if (notif.type === 'account_suspended') alertType = 'suspended'

              setActiveAlert({
                id: notif.id || String(Date.now()),
                type: alertType,
                title: notif.title || 'Notification Update',
                body: notif.body || 'Your account status was updated by Admin.',
                actionUrl: notif.action_url || '/dashboard',
              })
            }
          )
          // 2. Also listen for direct profile updates on verification_tier
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            },
            (payload: any) => {
              if (!isMounted) return
              const updated = payload?.new
              if (!updated) return

              if (updated.verification_tier === 'verified' || updated.verification_status === 'verified') {
                setActiveAlert({
                  id: `prof_ver_${Date.now()}`,
                  type: 'verified',
                  title: '🎉 APPLICATION VERIFIED!',
                  body: 'Congratulations! Your YAARO Identity & Resident Dossier has been officially verified by Admin. Your verified badge is now active across all searches and flatmate chats.',
                  actionUrl: '/dashboard',
                })
              } else if (updated.verification_tier === 'unverified') {
                setActiveAlert({
                  id: `prof_unver_${Date.now()}`,
                  type: 'revoked',
                  title: '⚠️ VERIFICATION STATUS REVOKED',
                  body: 'Your verification badge has been reset by Admin compliance. Please review your profile.',
                  actionUrl: '/verify',
                })
              } else if (updated.verification_tier === 'suspended') {
                setActiveAlert({
                  id: `prof_susp_${Date.now()}`,
                  type: 'suspended',
                  title: '🚫 ACCOUNT SUSPENDED',
                  body: 'Your account has been suspended by community compliance moderators.',
                  actionUrl: '/profile',
                })
              }
            }
          )
          .subscribe()
      } catch (err) {
        console.warn('Realtime listener error:', err)
      }
    }

    setupListener()

    return () => {
      isMounted = false
      if (notifChannel) {
        try {
          const supabase = createClient()
          supabase.removeChannel(notifChannel)
        } catch (_) {}
      }
    }
  }, [])

  if (!activeAlert) return null

  const isVerified = activeAlert.type === 'verified'
  const isSuspended = activeAlert.type === 'suspended'
  const isRevoked = activeAlert.type === 'revoked'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deepgreen/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg p-6 sm:p-8 border-2 shadow-[8px_8px_0px_#263F32] relative font-serif transition-all ${
          isVerified
            ? 'bg-emerald-50 border-emerald-800 text-emerald-950'
            : isSuspended
            ? 'bg-red-50 border-red-800 text-red-950'
            : 'bg-cream-light border-deepgreen text-deepgreen'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setActiveAlert(null)}
          className="absolute top-4 right-4 p-1.5 border border-current hover:bg-black/5 transition-colors"
          title="Dismiss Alert"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Content */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 mt-0.5">
            {isVerified ? (
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-[2px_2px_0px_#263F32]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            ) : isSuspended ? (
              <div className="w-12 h-12 rounded-full bg-tomato text-white flex items-center justify-center shadow-[2px_2px_0px_#263F32]">
                <Ban className="w-7 h-7" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-butter border border-deepgreen text-deepgreen flex items-center justify-center shadow-[2px_2px_0px_#263F32]">
                <AlertTriangle className="w-7 h-7 text-tomato" />
              </div>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-white/70 border border-current">
                OFFICIAL YAARO COMPLIANCE UPDATE
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">
              {activeAlert.title}
            </h3>

            <p className="font-serif italic text-sm leading-relaxed opacity-90">
              {activeAlert.body}
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              {activeAlert.actionUrl && (
                <Link
                  href={activeAlert.actionUrl}
                  onClick={() => setActiveAlert(null)}
                  className={`px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-[2px_2px_0px_#263F32] flex items-center gap-1.5 ${
                    isVerified
                      ? 'bg-emerald-800 text-cream hover:bg-emerald-900'
                      : 'bg-deepgreen text-cream hover:bg-tomato'
                  }`}
                >
                  <span>Acknowledge Status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              <button
                onClick={() => setActiveAlert(null)}
                className="px-4 py-2.5 border border-current bg-transparent hover:bg-black/5 font-mono text-xs font-bold uppercase transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
