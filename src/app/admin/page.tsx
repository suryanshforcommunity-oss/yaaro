'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Home,
  Users,
  CreditCard,
  FileText,
  RefreshCw,
  Search,
  ExternalLink,
  Ban,
  Lock,
  ArrowRight,
  TrendingUp,
  LogOut,
} from 'lucide-react'
import { signOutUser } from '@/lib/auth'
import {
  getAdminDashboardDataAction,
  adminReviewVerificationAction,
  adminResolveReportAction,
  adminBanUserAction,
  adminModerateListingAction,
  verifyAdminPasskeyAction,
  type AdminMetrics,
} from './actions'

type AdminTab = 'verifications' | 'listings' | 'reports' | 'users' | 'subscriptions'

export default function AdminModerationPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('verifications')
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [verifications, setVerifications] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [searchFilter, setSearchFilter] = useState<string>('')

  // Terminal Security Access
  const [adminKey, setAdminKey] = useState<string>('')
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false)
  const [keyInput, setKeyInput] = useState<string>('')
  const [authError, setAuthError] = useState<string | null>(null)

  // Reject / Note Modal
  const [rejectionModal, setRejectionModal] = useState<{ id: string; target: 'verification' | 'ban'; title: string } | null>(null)
  const [adminNoteInput, setAdminNoteInput] = useState<string>('')

  const refreshData = async (activeKey?: string) => {
    setLoading(true)
    const keyToUse = activeKey !== undefined ? activeKey : adminKey
    const res = await getAdminDashboardDataAction(keyToUse)
    if (res.success) {
      setIsUnlocked(true)
      if (res.metrics) setMetrics(res.metrics)
      setVerifications(res.verifications || [])
      setReports(res.reports || [])
      setListings(res.listings || [])
      setUsers(res.users || [])
      setSubscriptions(res.subscriptions || [])
    } else {
      if (res.message?.includes('Access denied') || res.message?.includes('Unauthorized')) {
        setIsUnlocked(false)
      } else {
        setActionMsg({ text: res.message || 'Failed to load admin records.', type: 'error' })
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    // Check session storage for saved admin key
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('yaaro_admin_key') : null
    if (saved) {
      setAdminKey(saved)
      refreshData(saved)
    } else {
      refreshData()
    }
  }, [])

  const handleUnlockTerminal = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    const res = await verifyAdminPasskeyAction(keyInput.trim())
    if (res.success) {
      const validKey = keyInput.trim()
      setAdminKey(validKey)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('yaaro_admin_key', validKey)
      }
      setIsUnlocked(true)
      await refreshData(validKey)
    } else {
      setAuthError(res.message || 'Invalid administrative security key.')
    }
  }

  const handleReviewVerification = async (recordId: string, status: 'approved' | 'rejected', notes?: string) => {
    const res = await adminReviewVerificationAction(recordId, status, notes, adminKey)
    if (res.success) {
      setActionMsg({ text: res.message, type: 'success' })
      setRejectionModal(null)
      setAdminNoteInput('')
      refreshData()
    } else {
      setActionMsg({ text: res.message, type: 'error' })
    }
  }

  const handleResolveReport = async (reportId: string, resolution: 'action_taken' | 'dismissed') => {
    const res = await adminResolveReportAction(reportId, resolution, undefined, adminKey)
    if (res.success) {
      setActionMsg({ text: res.message, type: 'success' })
      refreshData()
    } else {
      setActionMsg({ text: res.message, type: 'error' })
    }
  }

  const handleModerateListing = async (listingId: string, status: 'active' | 'paused' | 'flagged') => {
    const res = await adminModerateListingAction(listingId, status, adminKey)
    if (res.success) {
      setActionMsg({ text: res.message, type: 'success' })
      refreshData()
    } else {
      setActionMsg({ text: res.message, type: 'error' })
    }
  }

  const handleBanUser = async (userId: string, reason: string) => {
    const res = await adminBanUserAction(userId, reason, adminKey)
    if (res.success) {
      setActionMsg({ text: res.message, type: 'success' })
      setRejectionModal(null)
      setAdminNoteInput('')
      refreshData()
    } else {
      setActionMsg({ text: res.message, type: 'error' })
    }
  }

  // If locked, render the secret passkey gate
  if (!isUnlocked && !loading) {
    return (
      <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased flex flex-col justify-between p-4 sm:p-8">
        <div className="max-w-md mx-auto w-full my-auto py-12">
          <div className="border-2 border-deepgreen bg-cream-light p-6 sm:p-8 shadow-[8px_8px_0px_#263F32] space-y-6">
            <div className="flex items-center justify-between border-b border-deepgreen/20 pb-3">
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-tomato">
                RESTRICTED // OPERATOR TERMINAL
              </span>
              <Lock className="w-4 h-4 text-tomato" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black uppercase text-deepgreen leading-tight">
              ADMINISTRATION &amp; COMPLIANCE
            </h2>

            <p className="font-serif italic text-xs text-deepgreen/80">
              This terminal is strictly for platform operators and compliance moderators. Please provide the administrative master key to proceed.
            </p>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-500 text-red-800 font-mono text-xs font-bold">
                {authError}
              </div>
            )}

            <form onSubmit={handleUnlockTerminal} className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] uppercase font-bold text-deepgreen mb-1">
                  ADMIN MASTER KEY
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Enter secret passkey..."
                  required
                  className="w-full border-2 border-deepgreen bg-cream px-3 py-2 text-sm font-mono text-deepgreen focus:outline-none focus:border-tomato"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-deepgreen hover:bg-tomato text-cream font-serif font-bold uppercase tracking-wider text-xs transition-colors shadow-[3px_3px_0px_#E95D43]"
              >
                Unlock Terminal Access →
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-16">
      {/* Dedicated Operator Navigation Bar - Strictly operator controls, NO resident consumer pages */}
      <header className="sticky top-0 z-50 bg-deepgreen text-cream border-b-2 border-deepgreen shadow-[0px_2px_10px_rgba(0,0,0,0.15)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl sm:text-2xl font-black uppercase font-serif tracking-tight text-cream">
              YAARO<span className="text-tomato lowercase italic font-normal text-lg">.live</span>
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 bg-tomato text-cream font-bold border border-cream/20">
              OPERATOR COMMAND
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-cream/10 border border-cream/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-cream text-[11px] font-bold">admin@yaaro.live</span>
            </div>

            <button
              onClick={async () => {
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('yaaro_admin_key')
                }
                await signOutUser()
              }}
              className="px-3 py-1.5 bg-tomato hover:bg-tomato-dark text-cream font-mono text-[11px] font-bold uppercase transition-colors border border-cream/30 shadow-[2px_2px_0px_#000] flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Top Header */}
        <div className="border-b-2 border-deepgreen pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
              <span>VOL. 09 // YAARO CENTRAL COMMAND</span>
              <span>•</span>
              <span className="text-deepgreen/70">Trust, Safety &amp; Moderation Terminal</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deepgreen mt-0.5">
              COMPLIANCE &amp; ADMIN DESK
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refreshData()}
              disabled={loading}
              className="px-3.5 py-1.5 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold uppercase transition-colors shadow-[2px_2px_0px_#263F32] flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-tomato' : ''}`} />
              <span>Sync Records</span>
            </button>
          </div>
        </div>

        {/* Status Notification Toast */}
        {actionMsg && (
          <div
            className={`p-4 border-2 font-mono text-xs font-bold flex items-center justify-between shadow-[3px_3px_0px_#263F32] ${
              actionMsg.type === 'success'
                ? 'bg-emerald-100 border-emerald-700 text-emerald-900'
                : 'bg-tomato/10 border-tomato text-tomato'
            }`}
          >
            <span>{actionMsg.text}</span>
            <button onClick={() => setActionMsg(null)} className="underline">Dismiss</button>
          </div>
        )}

        {/* 6 Key Operational Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 font-mono text-xs">
          <div className="p-3.5 bg-cream-light border-2 border-deepgreen shadow-[3px_3px_0px_#263F32]">
            <span className="text-[10px] uppercase tracking-wider text-deepgreen/70 block font-bold">TOTAL USERS</span>
            <span className="text-2xl font-black font-serif text-deepgreen mt-1 block">{metrics?.totalUsers || 0}</span>
          </div>
          <div className="p-3.5 bg-emerald-50 border-2 border-deepgreen shadow-[3px_3px_0px_#263F32]">
            <span className="text-[10px] uppercase tracking-wider text-emerald-800 block font-bold">VERIFIED MEMBERS</span>
            <span className="text-2xl font-black font-serif text-emerald-800 mt-1 block">{metrics?.verifiedUsers || 0}</span>
          </div>
          <div className="p-3.5 bg-butter/40 border-2 border-deepgreen shadow-[3px_3px_0px_#263F32]">
            <span className="text-[10px] uppercase tracking-wider text-tomato block font-bold">PENDING ID REVIEWS</span>
            <span className="text-2xl font-black font-serif text-tomato mt-1 block">{metrics?.pendingVerifications || 0}</span>
          </div>
          <div className="p-3.5 bg-cream-light border-2 border-deepgreen shadow-[3px_3px_0px_#263F32]">
            <span className="text-[10px] uppercase tracking-wider text-deepgreen/70 block font-bold">ACTIVE LISTINGS</span>
            <span className="text-2xl font-black font-serif text-deepgreen mt-1 block">{metrics?.activeListings || 0}</span>
          </div>
          <div className="p-3.5 bg-tomato/10 border-2 border-deepgreen shadow-[3px_3px_0px_#263F32]">
            <span className="text-[10px] uppercase tracking-wider text-tomato block font-bold">OPEN REPORTS</span>
            <span className="text-2xl font-black font-serif text-tomato mt-1 block">{metrics?.openReports || 0}</span>
          </div>
          <div className="p-3.5 bg-deepgreen text-cream border-2 border-deepgreen shadow-[3px_3px_0px_#E95D43]">
            <span className="text-[10px] uppercase tracking-wider text-butter block font-bold">CLUB MRR</span>
            <span className="text-2xl font-black font-serif text-butter mt-1 block">₹{metrics?.estimatedMRR.toLocaleString('en-IN') || 0}</span>
          </div>
        </div>

        {/* Tab Controls Bar */}
        <div className="flex border-b-2 border-deepgreen gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-4 sm:px-6 py-2.5 font-mono text-xs font-bold uppercase transition-all shrink-0 border-2 ${
              activeTab === 'verifications'
                ? 'bg-deepgreen text-cream border-deepgreen shadow-[3px_3px_0px_#E95D43]'
                : 'bg-cream text-deepgreen border-deepgreen/30 hover:border-deepgreen'
            }`}
          >
            01. Verification Queue ({metrics?.pendingVerifications || 0})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 sm:px-6 py-2.5 font-mono text-xs font-bold uppercase transition-all shrink-0 border-2 ${
              activeTab === 'reports'
                ? 'bg-deepgreen text-cream border-deepgreen shadow-[3px_3px_0px_#E95D43]'
                : 'bg-cream text-deepgreen border-deepgreen/30 hover:border-deepgreen'
            }`}
          >
            02. Reports &amp; Safety ({metrics?.openReports || 0})
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 sm:px-6 py-2.5 font-mono text-xs font-bold uppercase transition-all shrink-0 border-2 ${
              activeTab === 'listings'
                ? 'bg-deepgreen text-cream border-deepgreen shadow-[3px_3px_0px_#E95D43]'
                : 'bg-cream text-deepgreen border-deepgreen/30 hover:border-deepgreen'
            }`}
          >
            03. Room Moderation ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 sm:px-6 py-2.5 font-mono text-xs font-bold uppercase transition-all shrink-0 border-2 ${
              activeTab === 'users'
                ? 'bg-deepgreen text-cream border-deepgreen shadow-[3px_3px_0px_#E95D43]'
                : 'bg-cream text-deepgreen border-deepgreen/30 hover:border-deepgreen'
            }`}
          >
            04. User Management ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 sm:px-6 py-2.5 font-mono text-xs font-bold uppercase transition-all shrink-0 border-2 ${
              activeTab === 'subscriptions'
                ? 'bg-deepgreen text-cream border-deepgreen shadow-[3px_3px_0px_#E95D43]'
                : 'bg-cream text-deepgreen border-deepgreen/30 hover:border-deepgreen'
            }`}
          >
            05. Subscriptions ({metrics?.activeSubscriptions || 0})
          </button>
        </div>

        {/* =====================================================================
            TAB 1: VERIFICATION REVIEW QUEUE
        ===================================================================== */}
        {activeTab === 'verifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-deepgreen/70">
              <span>Showing submitted documents awaiting compliance authorization</span>
              <span>Human Audit Policy Active</span>
            </div>

            {verifications.length === 0 ? (
              <div className="p-8 border-2 border-deepgreen bg-cream text-center font-mono text-xs text-deepgreen/60">
                No pending verification submissions in queue.
              </div>
            ) : (
              <div className="space-y-3">
                {verifications.map((v) => {
                  const docUrl = (v.verified_data as any)?.document_url
                  const idMasked = (v.verified_data as any)?.id_masked
                  return (
                    <div
                      key={v.id}
                      className="border-2 border-deepgreen bg-cream-light p-4 sm:p-5 shadow-[4px_4px_0px_#263F32] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-black text-base uppercase text-deepgreen">
                            {v.userName}
                          </span>
                          <span
                            className={`px-2 py-0.5 font-mono text-[9px] uppercase font-bold border ${
                              v.verification_status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : v.verification_status === 'rejected'
                                ? 'bg-tomato text-cream border-deepgreen'
                                : 'bg-butter text-deepgreen border-deepgreen'
                            }`}
                          >
                            {v.verification_status}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-deepgreen/70 flex flex-wrap gap-2">
                          <span>Email: {v.userEmail}</span>
                          <span>•</span>
                          <span>City: {v.city}</span>
                          <span>•</span>
                          <span className="capitalize font-bold text-deepgreen">Category: {v.verification_type.replace('_', ' ')}</span>
                          {idMasked && <span>(Ref: {idMasked})</span>}
                        </div>
                        {docUrl && (
                          <div className="pt-1">
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-tomato underline font-bold"
                            >
                              <span>Inspect Submitted Credential</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Admin Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {v.verification_status !== 'approved' && (
                          <button
                            onClick={() => handleReviewVerification(v.id, 'approved')}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-cream font-mono text-xs font-bold uppercase transition-colors shadow-[2px_2px_0px_#263F32]"
                          >
                            Approve ✓
                          </button>
                        )}
                        {v.verification_status !== 'rejected' && (
                          <button
                            onClick={() => setRejectionModal({ id: v.id, target: 'verification', title: `Reject Verification for ${v.userName}` })}
                            className="px-3.5 py-1.5 bg-tomato hover:bg-tomato-dark text-cream font-mono text-xs font-bold uppercase transition-colors shadow-[2px_2px_0px_#263F32]"
                          >
                            Reject ✕
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 2: REPORTS & SAFETY
        ===================================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="p-8 border-2 border-deepgreen bg-cream text-center font-mono text-xs text-deepgreen/60">
                Zero open community reports. All clear.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div
                    key={r.id}
                    className="border-2 border-deepgreen bg-cream-light p-4 sm:p-5 shadow-[4px_4px_0px_#263F32] flex flex-col md:flex-row md:items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs uppercase font-bold text-tomato">
                          [{r.action_type.toUpperCase()}] REASON: {r.reason.replace('_', ' ').toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-0.5 font-mono text-[9px] uppercase font-bold border ${
                            r.status === 'action_taken'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : r.status === 'dismissed'
                              ? 'bg-gray-100 text-gray-700 border-gray-300'
                              : 'bg-butter text-deepgreen border-deepgreen'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>

                      <p className="font-serif text-xs text-deepgreen font-bold">
                        Reported by: <span className="font-normal">{r.reporterName}</span>
                        {r.targetName && (
                          <>
                            {' '}• Target User: <span className="text-tomato font-bold">{r.targetName}</span>
                          </>
                        )}
                        {r.listingTitle && (
                          <>
                            {' '}• Target Room: <span className="text-tomato font-bold">{r.listingTitle}</span>
                          </>
                        )}
                      </p>

                      {r.details && (
                        <p className="p-2.5 bg-cream border border-deepgreen/30 font-serif italic text-xs text-deepgreen/90">
                          “{r.details}”
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {r.status === 'pending' && (
                        <>
                          {r.target_user_id && (
                            <button
                              onClick={() => handleBanUser(r.target_user_id, `Banned due to report: ${r.reason}`)}
                              className="px-3 py-1.5 bg-tomato text-cream font-mono text-xs font-bold uppercase hover:bg-tomato-dark"
                            >
                              Ban User
                            </button>
                          )}
                          <button
                            onClick={() => handleResolveReport(r.id, 'action_taken')}
                            className="px-3 py-1.5 bg-deepgreen text-cream font-mono text-xs font-bold uppercase hover:bg-tomato"
                          >
                            Mark Action Taken
                          </button>
                          <button
                            onClick={() => handleResolveReport(r.id, 'dismissed')}
                            className="px-3 py-1.5 border border-deepgreen bg-cream text-deepgreen font-mono text-xs font-bold uppercase hover:bg-cream-light"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 3: LISTING MODERATION
        ===================================================================== */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <div className="space-y-3">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="border-2 border-deepgreen bg-cream-light p-4 shadow-[4px_4px_0px_#263F32] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-black uppercase text-base text-deepgreen">
                        {l.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 font-mono text-[9px] uppercase font-bold border ${
                          l.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-tomato/10 text-tomato border-tomato'
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-deepgreen/70">
                      <span>City: {l.city}</span> • <span>Rent: ₹{Number(l.rent_monthly).toLocaleString('en-IN')}/mo</span> •{' '}
                      <span>Deposit: ₹{Number(l.security_deposit).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                    {l.status !== 'active' ? (
                      <button
                        onClick={() => handleModerateListing(l.id, 'active')}
                        className="px-3 py-1.5 bg-emerald-700 text-cream font-bold uppercase hover:bg-emerald-800"
                      >
                        Approve Live
                      </button>
                    ) : (
                      <button
                        onClick={() => handleModerateListing(l.id, 'flagged')}
                        className="px-3 py-1.5 bg-tomato text-cream font-bold uppercase hover:bg-tomato-dark"
                      >
                        Pause / Flag
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: USER MANAGEMENT
        ===================================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="border-2 border-deepgreen bg-cream-light p-4 shadow-[4px_4px_0px_#263F32] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-black uppercase text-base text-deepgreen">
                        {u.full_name || 'Anonymous User'}
                      </span>
                      <span
                        className={`px-2 py-0.5 font-mono text-[9px] uppercase font-bold border ${
                          u.verification_tier === 'id_verified'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : u.verification_tier === 'suspended'
                            ? 'bg-tomato text-cream border-deepgreen'
                            : 'bg-cream text-deepgreen border-deepgreen/40'
                        }`}
                      >
                        {u.verification_tier || 'unverified'}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-deepgreen/70">
                      {u.email} • 📍 {u.city || 'Pune'} • {u.occupation || 'Member'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                    {u.verification_tier === 'suspended' ? (
                      <span className="text-tomato font-bold uppercase">Account Suspended</span>
                    ) : (
                      <button
                        onClick={() => setRejectionModal({ id: u.id, target: 'ban', title: `Suspend ${u.full_name}` })}
                        className="px-3 py-1.5 border border-deepgreen bg-cream hover:bg-tomato hover:text-cream text-deepgreen font-bold uppercase transition-colors"
                      >
                        Suspend User
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: SUBSCRIPTIONS LEDGER
        ===================================================================== */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <div className="border-2 border-deepgreen bg-cream-light p-6 shadow-[4px_4px_0px_#263F32] space-y-4">
              <h3 className="font-serif font-black uppercase text-xl text-deepgreen">
                Active Membership Subscriptions
              </h3>
              {subscriptions.length === 0 ? (
                <p className="font-mono text-xs text-deepgreen/60">No active paid subscriptions found.</p>
              ) : (
                <div className="space-y-2">
                  {subscriptions.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-cream border border-deepgreen flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs"
                    >
                      <div>
                        <span className="font-bold text-deepgreen block uppercase">{s.userName} ({s.userEmail})</span>
                        <span className="text-deepgreen/60 text-[10px]">
                          Tier: <strong className="text-tomato uppercase">{s.plan_tier}</strong> ({s.billing_cycle})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-800 font-bold block">✓ ACTIVE</span>
                        <span className="text-[10px] text-deepgreen/60">
                          Valid until: {s.valid_until ? new Date(s.valid_until).toLocaleDateString('en-IN') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Rejection / Ban Note Modal */}
        {rejectionModal && (
          <div className="fixed inset-0 z-50 bg-deepgreen/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-cream border-2 border-deepgreen max-w-md w-full p-6 shadow-[8px_8px_0px_#263F32] space-y-4 font-serif">
              <h3 className="font-black uppercase text-lg text-deepgreen">{rejectionModal.title}</h3>
              <p className="font-mono text-xs text-deepgreen/70">
                Please provide a clear compliance reason. This note will be recorded in the audit trail.
              </p>
              <textarea
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="Reason (e.g. Document image was blurred; Broker activity detected)..."
                rows={3}
                className="w-full p-3 border-2 border-deepgreen bg-cream-light font-mono text-xs text-deepgreen focus:outline-none"
              />
              <div className="flex gap-2 font-mono text-xs">
                <button
                  onClick={() => setRejectionModal(null)}
                  className="flex-1 py-2 border-2 border-deepgreen bg-cream uppercase font-bold hover:bg-cream-light"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (rejectionModal.target === 'verification') {
                      handleReviewVerification(rejectionModal.id, 'rejected', adminNoteInput)
                    } else {
                      handleBanUser(rejectionModal.id, adminNoteInput)
                    }
                  }}
                  className="flex-1 py-2 bg-tomato text-cream uppercase font-bold hover:bg-tomato-dark"
                >
                  Confirm Action
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
