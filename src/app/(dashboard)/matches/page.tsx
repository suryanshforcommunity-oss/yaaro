'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  MessageSquare,
  ShieldAlert,
  UserX,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import EditorialNavigation from '@/components/EditorialNavigation'
import {
  getUserMatches,
  unmatchUser,
  blockUser,
  reportUser,
  type MatchItem,
} from './actions'

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null)
  const [actionTarget, setActionTarget] = useState<MatchItem | null>(null)
  const [actionType, setActionType] = useState<'unmatch' | 'report_block' | null>(null)
  const [reportReason, setReportReason] = useState('Inappropriate conduct')
  const [reportDetails, setReportDetails] = useState('')
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null)

  const loadMatches = async () => {
    setIsLoading(true)
    try {
      const data = await getUserMatches()
      setMatches(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMatches()
  }, [])

  const handleUnmatch = async () => {
    if (!actionTarget) return
    setIsSubmittingAction(true)
    const res = await unmatchUser(actionTarget.otherUser.id)
    setIsSubmittingAction(false)
    setActionType(null)
    setActionTarget(null)
    if (res.success) {
      setStatusFeedback(res.message)
      setTimeout(() => setStatusFeedback(null), 3000)
      loadMatches()
    }
  }

  const handleReportAndBlock = async () => {
    if (!actionTarget) return
    setIsSubmittingAction(true)
    const res = await reportUser(actionTarget.otherUser.id, reportReason, reportDetails, true)
    setIsSubmittingAction(false)
    setActionType(null)
    setActionTarget(null)
    if (res.success) {
      setStatusFeedback('User reported and blocked successfully.')
      setTimeout(() => setStatusFeedback(null), 3000)
      loadMatches()
    }
  }

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-12">
      <EditorialNavigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Editorial Top Section */}
        <div className="border-b-2 border-deepgreen pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
              <span>VOL. 03 // MUTUAL CHEMISTRY ARCHIVE</span>
              <span>•</span>
              <span className="text-deepgreen/70">Certified Mutual Matches ({matches.length})</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deepgreen mt-0.5">
              CONFIRMED MATCHES
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/discover"
              className="px-4 py-2 border-2 border-deepgreen bg-tomato text-cream hover:bg-deepgreen font-mono text-xs font-bold uppercase transition-colors shadow-[2px_2px_0px_#263F32] flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Explore Discovery ↗</span>
            </Link>
          </div>
        </div>

        {/* Status Toast */}
        {statusFeedback && (
          <div className="p-3 bg-butter border-2 border-deepgreen shadow-[3px_3px_0px_#263F32] font-mono text-xs font-bold text-deepgreen flex items-center justify-between animate-fade-in">
            <span>{statusFeedback}</span>
            <button onClick={() => setStatusFeedback(null)} className="text-tomato">✕</button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 text-center font-mono text-xs text-deepgreen/60 flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-tomato" />
            <span>Loading mutual co-living connections...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && matches.length === 0 && (
          <div className="p-12 border-2 border-deepgreen bg-cream-light text-center space-y-4 shadow-[6px_6px_0px_#263F32]">
            <div className="w-16 h-16 rounded-full border-2 border-deepgreen bg-butter text-deepgreen flex items-center justify-center mx-auto shadow-[2px_2px_0px_#263F32]">
              <Sparkles className="h-8 w-8 text-tomato" />
            </div>
            <h3 className="text-2xl font-black uppercase text-deepgreen font-serif">
              NO MUTUAL MATCHES RECORDED YET
            </h3>
            <p className="font-serif italic text-sm text-deepgreen/70 max-w-md mx-auto">
              When both you and another roommate like each other’s living dossiers, your confirmed match will appear here with instant chat and flat agreement unlocks.
            </p>
            <div className="pt-2">
              <Link
                href="/discover"
                className="inline-block px-6 py-3 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase text-xs border border-deepgreen shadow-[3px_3px_0px_#263F32]"
              >
                Browse Roommate Discovery Feed ↗
              </Link>
            </div>
          </div>
        )}

        {/* Matches Grid */}
        {!isLoading && matches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((m) => {
              const u = m.otherUser
              return (
                <div
                  key={m.id}
                  className="border-2 border-deepgreen bg-cream-light shadow-[6px_6px_0px_#263F32] overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    {/* Header with Photo & Harmony Score */}
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-24 border-2 border-deepgreen bg-sand overflow-hidden shrink-0 shadow-[2px_2px_0px_#263F32]">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-butter flex items-center justify-center font-serif font-black text-2xl text-deepgreen">
                            {u.fullName[0]}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-black uppercase text-deepgreen font-serif truncate">
                              {u.fullName}, {u.age}
                            </h3>
                            <p className="font-mono text-xs text-tomato font-bold uppercase truncate">
                              {u.occupation} {u.companyOrCollege ? `@ ${u.companyOrCollege}` : ''}
                            </p>
                          </div>
                          <span className="font-mono text-[10px] px-2 py-0.5 bg-deepgreen text-butter font-bold border border-deepgreen shrink-0 shadow-[1px_1px_0px_#E95D43]">
                            {m.harmonyScore}% HARMONY
                          </span>
                        </div>

                        <p className="font-mono text-[11px] text-deepgreen/70 mt-1">
                          📍 {u.locality}, {u.city}
                        </p>
                        <p className="font-mono text-[10px] text-deepgreen/50 mt-0.5">
                          Matched on {m.matchDate}
                        </p>
                      </div>
                    </div>

                    {/* Bio Snippet */}
                    <p className="font-serif italic text-xs text-deepgreen/80 bg-cream p-3 border border-deepgreen leading-relaxed line-clamp-2">
                      “{u.bio}”
                    </p>

                    {/* Budget & Timeline */}
                    <div className="flex justify-between items-center font-mono text-[11px] border-t border-deepgreen/20 pt-2 text-deepgreen/80">
                      <span>Budget: ₹{u.budgetMin.toLocaleString()} - ₹{u.budgetMax.toLocaleString()}/mo</span>
                      <span className="text-emerald-700 font-bold">✓ Mutual Like Verified</span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="p-4 bg-cream border-t-2 border-deepgreen flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/chat?user=${u.id}`}
                        className="px-4 py-2 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase text-xs transition-colors border border-deepgreen shadow-[2px_2px_0px_#263F32] flex items-center gap-1.5"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat Now ↗</span>
                      </Link>

                      <button
                        onClick={() => setSelectedMatch(m)}
                        className="px-3 py-2 bg-cream-light hover:bg-butter border border-deepgreen font-mono text-xs font-bold text-deepgreen transition-colors shadow-[2px_2px_0px_#263F32]"
                      >
                        Details
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActionTarget(m)
                          setActionType('unmatch')
                        }}
                        className="p-2 border border-deepgreen/50 hover:border-deepgreen bg-cream text-deepgreen/70 hover:text-red-600 transition-colors"
                        title="Unmatch Flatmate"
                      >
                        <UserX className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => {
                          setActionTarget(m)
                          setActionType('report_block')
                        }}
                        className="p-2 border border-deepgreen/50 hover:border-deepgreen bg-cream text-deepgreen/70 hover:text-red-700 transition-colors"
                        title="Report or Block"
                      >
                        <ShieldAlert className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* MATCH DETAILS MODAL */}
        {selectedMatch && (
          <div className="fixed inset-0 z-50 bg-deepgreen/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-xl w-full bg-cream-light border-2 border-deepgreen p-6 sm:p-8 shadow-[10px_10px_0px_#263F32] space-y-6 animate-scale-up">
              <div className="flex justify-between items-start border-b-2 border-deepgreen pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 border-2 border-deepgreen bg-sand overflow-hidden shrink-0 shadow-[2px_2px_0px_#263F32]">
                    {selectedMatch.otherUser.avatarUrl ? (
                      <img
                        src={selectedMatch.otherUser.avatarUrl}
                        alt={selectedMatch.otherUser.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-butter flex items-center justify-center font-bold text-xl">
                        {selectedMatch.otherUser.fullName[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
                      MUTUAL MATCH DOSSIER
                    </span>
                    <h3 className="text-2xl font-black uppercase text-deepgreen font-serif">
                      {selectedMatch.otherUser.fullName}, {selectedMatch.otherUser.age}
                    </h3>
                    <p className="font-mono text-xs text-deepgreen/70">
                      📍 {selectedMatch.otherUser.locality}, {selectedMatch.otherUser.city}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMatch(null)}
                  className="p-1 border border-deepgreen bg-cream hover:bg-red-50 text-deepgreen"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Harmony Score Highlight */}
              <div className="p-4 bg-deepgreen text-cream border-2 border-deepgreen flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase text-butter tracking-wider block font-bold">
                    ALGORITHMIC COMPATIBILITY
                  </span>
                  <span className="text-sm font-serif italic text-cream-light">
                    Zero domestic deal-breakers detected.
                  </span>
                </div>
                <span className="font-serif font-black text-3xl text-butter">
                  {selectedMatch.harmonyScore}%
                </span>
              </div>

              {/* Living Specs */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 border border-deepgreen bg-cream">
                  <span className="text-[10px] text-deepgreen/60 uppercase block">OCCUPATION</span>
                  <span className="font-bold text-deepgreen">{selectedMatch.otherUser.occupation}</span>
                </div>
                <div className="p-3 border border-deepgreen bg-cream">
                  <span className="text-[10px] text-deepgreen/60 uppercase block">BUDGET RANGE</span>
                  <span className="font-bold text-deepgreen">
                    ₹{selectedMatch.otherUser.budgetMin.toLocaleString()} - ₹{selectedMatch.otherUser.budgetMax.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Full Bio */}
              <div className="p-4 bg-cream border border-deepgreen">
                <span className="font-mono text-[10px] uppercase font-bold text-deepgreen/70 block mb-1">
                  ROOMMATE LIVING EXPECTATION
                </span>
                <p className="font-serif italic text-sm text-deepgreen leading-relaxed">
                  “{selectedMatch.otherUser.bio}”
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <Link
                  href={`/quiz?target=${selectedMatch.otherUser.id}`}
                  className="px-4 py-2.5 bg-butter text-deepgreen hover:bg-yellow-300 font-mono text-xs font-bold uppercase border border-deepgreen shadow-[2px_2px_0px_#263F32]"
                >
                  Compare Dilemmas ↗
                </Link>

                <Link
                  href={`/chat?user=${selectedMatch.otherUser.id}`}
                  className="px-6 py-2.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase text-xs border border-deepgreen shadow-[3px_3px_0px_#263F32] flex items-center gap-1.5"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Initiate Chai Chat ↗</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* UNMATCH CONFIRMATION MODAL */}
        {actionType === 'unmatch' && actionTarget && (
          <div className="fixed inset-0 z-50 bg-deepgreen/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-cream border-4 border-deepgreen p-6 sm:p-8 shadow-[10px_10px_0px_#263F32] space-y-4 text-center animate-scale-up">
              <div className="w-12 h-12 rounded-full border-2 border-deepgreen bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <UserX className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-black uppercase text-deepgreen font-serif">
                Unmatch {actionTarget.otherUser.fullName}?
              </h3>
              <p className="font-serif text-xs text-deepgreen/80 leading-relaxed">
                This will dissolve your mutual match and remove the conversation from your active messages. You will no longer receive notifications from this user.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  disabled={isSubmittingAction}
                  onClick={handleUnmatch}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-serif font-bold uppercase text-xs border border-deepgreen shadow-[2px_2px_0px_#263F32]"
                >
                  {isSubmittingAction ? 'Unmatching...' : 'Confirm Unmatch'}
                </button>
                <button
                  onClick={() => setActionType(null)}
                  className="flex-1 py-3 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold uppercase"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REPORT & BLOCK MODAL */}
        {actionType === 'report_block' && actionTarget && (
          <div className="fixed inset-0 z-50 bg-deepgreen/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-cream border-4 border-deepgreen p-6 sm:p-8 shadow-[10px_10px_0px_#263F32] space-y-4 animate-scale-up">
              <div className="flex items-center gap-3 border-b-2 border-deepgreen pb-3">
                <ShieldAlert className="h-6 w-6 text-tomato shrink-0" />
                <h3 className="text-xl font-black uppercase text-deepgreen font-serif">
                  Report &amp; Block {actionTarget.otherUser.fullName}
                </h3>
              </div>
              <p className="font-serif text-xs text-deepgreen/80">
                Blocked users cannot view your profile, send messages, or appear in your discovery feed.
              </p>
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-deepgreen/70 mb-1">
                  REASON FOR REPORT
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full border-2 border-deepgreen bg-cream p-2 font-serif text-xs text-deepgreen focus:outline-none"
                >
                  <option value="Inappropriate conduct">Inappropriate conduct / Harassment</option>
                  <option value="Suspected scam or brokerage">Suspected broker / Brokerage scam</option>
                  <option value="Fake profile or photo">Fake profile / Identity fraud</option>
                  <option value="Unresponsive / spam">Spam / Commercial solicitation</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-deepgreen/70 mb-1">
                  ADDITIONAL DETAILS (OPTIONAL)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Describe what occurred..."
                  rows={3}
                  className="w-full border-2 border-deepgreen bg-cream p-2 font-serif text-xs text-deepgreen focus:outline-none placeholder:text-deepgreen/40"
                />
              </div>
              <div className="pt-2 flex items-center gap-3">
                <button
                  disabled={isSubmittingAction}
                  onClick={handleReportAndBlock}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-serif font-bold uppercase text-xs border border-deepgreen shadow-[2px_2px_0px_#263F32]"
                >
                  {isSubmittingAction ? 'Submitting...' : 'Report & Block User'}
                </button>
                <button
                  onClick={() => setActionType(null)}
                  className="flex-1 py-3 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold uppercase"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
