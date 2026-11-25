'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Send,
  Coffee,
  ShieldCheck,
  FileText,
  CheckCheck,
  Check,
  Paperclip,
  Sparkles,
  PhoneCall,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  RefreshCw,
  Search,
  Home,
  UserCheck,
  UserX,
  ShieldAlert,
  MoreVertical,
  X,
} from 'lucide-react'
import EditorialNavigation from '@/components/EditorialNavigation'
import { getCurrentUserSessionData, CurrentUserSessionData } from '@/lib/user-profile'
import { getDiscoveryFeed, type CandidateWithMatch } from '../discover/actions'
import {
  getUserConversations,
  getConversationMessages,
  sendChatMessage,
  getOrCreateConversation,
  markConversationAsRead,
  shareRoomListingAction,
  shareProfileCardAction,
  shareCompatibilityAction,
  generateFlatAgreementAction,
  type ChatThreadItem,
  type ChatMessageItem,
} from './actions'
import { unmatchUser, reportUser } from '../matches/actions'
import { createClient } from '@/lib/supabase/client'

function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetUserParam = searchParams.get('user') || searchParams.get('id')

  const [currentUserData, setCurrentUserData] = useState<CurrentUserSessionData | null>(null)
  const [threads, setThreads] = useState<ChatThreadItem[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [agreementGenerated, setAgreementGenerated] = useState(false)
  const [agreementText, setAgreementText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [discoveryFallback, setDiscoveryFallback] = useState<CandidateWithMatch[]>([])
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [actionTarget, setActionTarget] = useState<ChatThreadItem | null>(null)
  const [actionModal, setActionModal] = useState<'unmatch' | 'report' | null>(null)
  const [reportReason, setReportReason] = useState('Inappropriate conduct')
  const [reportDetails, setReportDetails] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load user session & conversation threads
  const refreshThreads = async () => {
    try {
      const userThreads = await getUserConversations()
      setThreads(userThreads)
      return userThreads
    } catch {
      return []
    }
  }

  useEffect(() => {
    async function initChat() {
      try {
        setIsLoading(true)
        const sessionData = await getCurrentUserSessionData()
        setCurrentUserData(sessionData)

        let userThreads = await refreshThreads()

        // If URL has ?user=UUID, ensure conversation is active
        if (targetUserParam && targetUserParam !== sessionData?.user?.id) {
          const res = await getOrCreateConversation(targetUserParam)
          if (res.conversationId) {
            userThreads = await refreshThreads()
            setActiveThreadId(res.conversationId)
          }
        }

        if (userThreads.length > 0) {
          setActiveThreadId((prev) => prev || userThreads[0].id)
        } else {
          // If 0 threads, get discovery candidates to initiate
          const candidates = await getDiscoveryFeed()
          setDiscoveryFallback(candidates)

          if (candidates.length > 0 && !targetUserParam) {
            const top = candidates[0]
            const res = await getOrCreateConversation(top.id)
            if (res.conversationId) {
              const fresh = await refreshThreads()
              setActiveThreadId(res.conversationId)
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize real chat:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initChat()
  }, [targetUserParam])

  // Load messages & subscribe to Supabase Realtime for active conversation
  useEffect(() => {
    if (!activeThreadId) return

    let isMounted = true

    async function loadMessages() {
      try {
        const msgs = await getConversationMessages(activeThreadId)
        if (isMounted) {
          setMessages(msgs)
          // Mark conversation as read
          await markConversationAsRead(activeThreadId)
        }
      } catch (err) {
        console.error('Error loading messages for thread:', err)
      }
    }

    loadMessages()

    // 1. Supabase Realtime channel subscription
    const supabase = createClient()
    const channel = supabase
      .channel(`chat_${activeThreadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeThreadId}`,
        },
        async () => {
          if (isMounted) {
            const freshMsgs = await getConversationMessages(activeThreadId)
            setMessages(freshMsgs)
            await markConversationAsRead(activeThreadId)
            refreshThreads()
          }
        }
      )
      .subscribe()

    // 2. High-reliability fallback polling interval (3s)
    const interval = setInterval(() => {
      loadMessages()
    }, 3000)

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [activeThreadId])

  const currentThread = threads.find((t) => t.id === activeThreadId) || threads[0]

  const myDisplayName =
    currentUserData?.profile?.full_name || currentUserData?.displayName || 'You'
  const myAvatarUrl = currentUserData?.profile?.avatar_url || null
  const myInitials =
    myDisplayName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'ME'

  // Send plain text message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim() || !activeThreadId || isSending) return

    const messageText = inputText.trim()
    setInputText('')
    setIsSending(true)

    const optimisticMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      conversationId: activeThreadId,
      senderId: currentUserData?.user?.id || 'me',
      isMe: true,
      senderName: myDisplayName,
      senderAvatarUrl: myAvatarUrl,
      content: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      messageType: 'text',
      isRead: false,
    }

    setMessages((prev) => [...prev, optimisticMsg])

    try {
      const res = await sendChatMessage(activeThreadId, messageText)
      if (res.success && res.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? res.message! : m))
        )
        refreshThreads()
      } else if (res.error) {
        setStatusMessage(res.error)
        setTimeout(() => setStatusMessage(null), 3500)
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setIsSending(false)
    }
  }

  // Quick Share Actions
  const handleShareRoom = async () => {
    if (!activeThreadId) return
    setShowShareMenu(false)
    const roomPayload = {
      id: 'room-hinjewadi-1',
      title: 'Private Master Room in 3BHK Gated Society',
      locality: currentThread?.locality || 'Hinjewadi Phase 1',
      city: currentThread?.city || 'Pune',
      rentMonthly: currentThread?.budgetMin || 14000,
      imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    }
    await shareRoomListingAction(activeThreadId, roomPayload)
    const fresh = await getConversationMessages(activeThreadId)
    setMessages(fresh)
  }

  const handleShareProfile = async () => {
    if (!activeThreadId || !currentUserData) return
    setShowShareMenu(false)
    const profilePayload = {
      id: currentUserData.user?.id || 'me',
      fullName: myDisplayName,
      occupation: currentUserData.profile?.occupation || 'Co-Living Member',
      locality: currentUserData.profile?.locality || 'Hinjewadi',
      city: currentUserData.profile?.city || 'Pune',
      harmonyScore: 94,
      avatarUrl: myAvatarUrl,
    }
    await shareProfileCardAction(activeThreadId, profilePayload)
    const fresh = await getConversationMessages(activeThreadId)
    setMessages(fresh)
  }

  const handleShareCompatibility = async () => {
    if (!activeThreadId) return
    setShowShareMenu(false)
    await shareCompatibilityAction(
      activeThreadId,
      currentThread?.harmonyScore || 92,
      'The Mindful Co-Livers',
      'Both members share synchronized quiet hours (11 PM) and respect kitchen cleanliness.'
    )
    const fresh = await getConversationMessages(activeThreadId)
    setMessages(fresh)
  }

  const handleGenerateAgreement = async () => {
    if (!activeThreadId) return
    setAgreementGenerated(true)
    const res = await generateFlatAgreementAction(activeThreadId)
    if (res.success) {
      setAgreementText(res.agreementText)
      const fresh = await getConversationMessages(activeThreadId)
      setMessages(fresh)
    }
  }

  const handleUnmatch = async () => {
    if (!currentThread) return
    const res = await unmatchUser(currentThread.otherUserId)
    setActionModal(null)
    if (res.success) {
      setStatusMessage('Unmatched flatmate.')
      setTimeout(() => setStatusMessage(null), 3000)
      const fresh = await refreshThreads()
      if (fresh.length > 0) setActiveThreadId(fresh[0].id)
      else setActiveThreadId('')
    }
  }

  const handleReportAndBlock = async () => {
    if (!currentThread) return
    const res = await reportUser(currentThread.otherUserId, reportReason, reportDetails, true)
    setActionModal(null)
    if (res.success) {
      setStatusMessage('User reported and blocked.')
      setTimeout(() => setStatusMessage(null), 3000)
      const fresh = await refreshThreads()
      if (fresh.length > 0) setActiveThreadId(fresh[0].id)
      else setActiveThreadId('')
    }
  }

  // Filter conversation list by search query
  const filteredThreads = threads.filter((t) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return t.name.toLowerCase().includes(q) || t.locality.toLowerCase().includes(q)
  })

  // Render Rich Message Cards
  const renderMessageContent = (m: ChatMessageItem) => {
    const isMe = m.isMe

    // 1. Digital Agreement
    if (m.messageType === 'agreement_proposal') {
      return (
        <div className="p-4 bg-butter/60 border-2 border-deepgreen shadow-[3px_3px_0px_#263F32] my-1">
          <div className="flex items-center gap-2 mb-2 text-tomato font-bold font-mono text-xs uppercase">
            <FileText className="h-4 w-4" />
            <span>Digital Co-Living Agreement Proposed</span>
          </div>
          <p className="font-serif text-xs text-deepgreen/90 whitespace-pre-line leading-relaxed mb-3">
            {m.content}
          </p>
          <div className="flex items-center justify-between font-mono text-[10px] text-deepgreen/60 border-t border-deepgreen/20 pt-2">
            <span>Verified by YAARO Escrow</span>
            <span className="text-emerald-800 font-bold">✓ Ready for Digital Signature</span>
          </div>
        </div>
      )
    }

    // Try parsing JSON payloads for Rich Card Shares
    if (m.content.startsWith('{') && m.content.endsWith('}')) {
      try {
        const parsed = JSON.parse(m.content)

        // Room Listing Share Card
        if (parsed.type === 'room_share' && parsed.listing) {
          const l = parsed.listing
          return (
            <div className="border-2 border-deepgreen bg-cream overflow-hidden shadow-[3px_3px_0px_#263F32] my-1 max-w-sm">
              <div className="h-32 bg-sand relative overflow-hidden border-b border-deepgreen">
                {l.imageUrl ? (
                  <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-sand text-deepgreen">
                    <Home className="h-8 w-8" />
                  </div>
                )}
                <span className="absolute bottom-2 left-2 bg-deepgreen text-cream px-2 py-0.5 font-mono text-[10px] font-bold">
                  ₹{Number(l.rentMonthly).toLocaleString()}/mo
                </span>
              </div>
              <div className="p-3 space-y-1.5 text-left">
                <span className="font-mono text-[9px] uppercase tracking-wider text-tomato font-bold block">
                  SHARED ROOM LISTING
                </span>
                <h5 className="font-serif font-black text-sm text-deepgreen leading-tight">
                  {l.title}
                </h5>
                <p className="font-mono text-[11px] text-deepgreen/70">
                  📍 {l.locality}, {l.city}
                </p>
                <div className="pt-2">
                  <Link
                    href="/rooms"
                    className="inline-block px-3 py-1.5 bg-tomato hover:bg-tomato-dark text-cream font-serif font-bold uppercase text-[10px] border border-deepgreen shadow-[1px_1px_0px_#263F32]"
                  >
                    Inspect Room Listing ↗
                  </Link>
                </div>
              </div>
            </div>
          )
        }

        // Roommate Profile Share Card
        if (parsed.type === 'profile_share' && parsed.profile) {
          const p = parsed.profile
          return (
            <div className="border-2 border-deepgreen bg-cream p-4 shadow-[3px_3px_0px_#263F32] my-1 max-w-sm text-left space-y-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-tomato font-bold block">
                SHARED ROOMMATE PROFILE
              </span>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border border-deepgreen bg-sand overflow-hidden shrink-0 shadow-[1px_1px_0px_#263F32]">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-butter flex items-center justify-center font-bold text-sm">
                      {p.fullName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="font-serif font-black text-sm text-deepgreen leading-tight">
                    {p.fullName}
                  </h5>
                  <p className="font-mono text-[11px] text-deepgreen/70">
                    {p.occupation} • 📍 {p.locality}
                  </p>
                  <span className="font-mono text-[10px] text-tomato font-bold">
                    ⚡ {p.harmonyScore}% Harmony Rating
                  </span>
                </div>
              </div>
              <div className="pt-1">
                <Link
                  href={`/discover`}
                  className="inline-block px-3 py-1 bg-deepgreen text-cream font-serif font-bold uppercase text-[10px] shadow-[1px_1px_0px_#E95D43]"
                >
                  View in Discovery ↗
                </Link>
              </div>
            </div>
          )
        }

        // Compatibility Share Card
        if (parsed.type === 'compatibility_share') {
          return (
            <div className="border-2 border-deepgreen bg-deepgreen text-cream p-4 shadow-[3px_3px_0px_#E95D43] my-1 max-w-sm text-left space-y-2">
              <div className="flex items-center justify-between border-b border-cream/20 pb-2">
                <span className="font-mono text-[10px] uppercase text-butter font-bold">
                  MUTUAL CHEMISTRY BREAKDOWN
                </span>
                <span className="font-serif font-black text-xl text-butter">
                  {parsed.harmonyScore}%
                </span>
              </div>
              <p className="font-serif font-bold text-xs text-cream">
                Archetype: {parsed.archetype}
              </p>
              <p className="font-serif italic text-xs text-cream-light leading-relaxed">
                “{parsed.explanation}”
              </p>
            </div>
          )
        }
      } catch {
        // Fall back to normal text
      }
    }

    // Default Plain Text Bubble
    return <p className="font-serif">{m.content}</p>
  }

  return (
    <div className="min-h-screen bg-cream text-deepgreen font-serif antialiased selection:bg-tomato selection:text-white pb-24 lg:pb-12">
      <EditorialNavigation user={{ name: myDisplayName, email: currentUserData?.user?.email }} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Header */}
        <div className="border-b-2 border-deepgreen pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-tomato font-bold">
              <span>VOL. 04 // DOMESTIC DIALOGUES</span>
              <span>•</span>
              <span className="text-deepgreen/70">Encrypted Real-Time Messaging &amp; Compacts</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-deepgreen mt-0.5">
              CONVERSATIONS &amp; AGREEMENTS
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/matches"
              className="px-3.5 py-1.5 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold text-deepgreen uppercase transition-colors shadow-[2px_2px_0px_#263F32] flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-tomato" />
              <span>Match Archive ↗</span>
            </Link>

            {/* Current User Identity Indicator */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-cream border-2 border-deepgreen shadow-[2px_2px_0px_#263F32]">
              <div className="w-7 h-7 border border-deepgreen bg-tomato text-cream flex items-center justify-center font-serif text-xs font-black shrink-0 overflow-hidden">
                {myAvatarUrl ? (
                  <img src={myAvatarUrl} alt={myDisplayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{myInitials}</span>
                )}
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <span className="font-mono text-[8px] uppercase tracking-wider text-deepgreen/60 block font-bold">
                  SIGNED IN AS
                </span>
                <span className="font-serif font-black text-xs text-deepgreen">
                  {myDisplayName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="p-3 bg-tomato text-cream font-mono text-xs font-bold flex items-center justify-between border-2 border-deepgreen shadow-[3px_3px_0px_#263F32] animate-fade-in">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-cream font-black">✕</button>
          </div>
        )}

        {/* Main Chat Grid */}
        <div className="border-2 border-deepgreen bg-cream-light shadow-[8px_8px_0px_#263F32] grid grid-cols-1 md:grid-cols-12 min-h-[640px]">
          {/* Threads Column (4 Cols) */}
          <div className={`md:col-span-4 border-b-2 md:border-b-0 md:border-r-2 border-deepgreen bg-cream p-4 space-y-3 flex flex-col justify-between ${activeThreadId ? 'hidden md:flex' : 'flex'}`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-deepgreen/60 font-bold block">
                  CONVERSATIONS ({threads.length})
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  Supabase Realtime
                </span>
              </div>

              {/* Search Threads */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-deepgreen/40" />
                <input
                  type="text"
                  placeholder="Search flatmates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border-2 border-deepgreen bg-cream text-xs font-serif text-deepgreen placeholder:text-deepgreen/40 focus:outline-none"
                />
              </div>

              {isLoading && (
                <div className="p-6 text-center font-mono text-xs text-deepgreen/60 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-tomato" />
                  <span>Loading authentic threads...</span>
                </div>
              )}

              {/* Threads List */}
              <div className="space-y-2 overflow-y-auto max-h-[460px]">
                {!isLoading && filteredThreads.length === 0 && (
                  <div className="p-4 bg-cream border border-deepgreen text-center space-y-2">
                    <p className="font-serif italic text-xs text-deepgreen/70">
                      No matching conversations found.
                    </p>
                  </div>
                )}

                {!isLoading &&
                  filteredThreads.map((t) => {
                    const isActive = activeThreadId === t.id
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setActiveThreadId(t.id)
                          setAgreementGenerated(false)
                        }}
                        className={`p-3 border-2 transition-all cursor-pointer relative ${
                          isActive
                            ? 'border-deepgreen bg-cream-light shadow-[3px_3px_0px_#E95D43]'
                            : 'border-deepgreen/30 bg-cream hover:border-deepgreen'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Avatar */}
                          <div className="w-10 h-10 border border-deepgreen bg-sand overflow-hidden shrink-0 mt-0.5 shadow-[1px_1px_0px_#263F32]">
                            {t.avatarUrl ? (
                              <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-butter flex items-center justify-center font-serif font-black text-sm text-deepgreen">
                                {t.name[0]}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                              <h4 className="font-serif font-bold text-sm text-deepgreen truncate">
                                {t.name}
                              </h4>
                              {t.unread > 0 ? (
                                <span className="bg-tomato text-cream font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                                  {t.unread}
                                </span>
                              ) : (
                                <span className="font-mono text-[9px] text-tomato font-bold shrink-0 ml-1">
                                  {t.match}
                                </span>
                              )}
                            </div>
                            <p className="font-mono text-[10px] text-deepgreen/60 mb-0.5 truncate">
                              {t.role} • 📍 {t.locality}
                            </p>
                            <p className="font-serif italic text-xs text-deepgreen/80 truncate">
                              {t.snippet}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Quick Match Archive Link */}
            <div className="pt-2 border-t border-deepgreen/20">
              <Link
                href="/matches"
                className="w-full py-2 bg-butter hover:bg-yellow-300 border border-deepgreen text-deepgreen font-mono text-xs font-bold uppercase text-center block transition-colors shadow-[2px_2px_0px_#263F32]"
              >
                View Confirmed Matches ({threads.length}) →
              </Link>
            </div>
          </div>

          {/* Active Conversation Stage (8 Cols) */}
          <div className={`md:col-span-8 flex-col justify-between p-3 sm:p-6 bg-cream-light ${activeThreadId ? 'flex' : 'hidden md:flex'}`}>
            {/* Conversation Header */}
            {currentThread ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-deepgreen pb-4 gap-3">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button to Thread List */}
                  <button
                    onClick={() => setActiveThreadId('')}
                    className="md:hidden p-1.5 border-2 border-deepgreen bg-cream hover:bg-butter text-deepgreen font-mono text-xs font-bold shrink-0 shadow-[1px_1px_0px_#263F32]"
                    title="Back to Conversations"
                  >
                    ← All
                  </button>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-deepgreen bg-sand overflow-hidden shrink-0 shadow-[2px_2px_0px_#263F32]">
                    {currentThread.avatarUrl ? (
                      <img
                        src={currentThread.avatarUrl}
                        alt={currentThread.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-butter flex items-center justify-center font-serif font-black text-base text-deepgreen">
                        {currentThread.name[0]}
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-black uppercase text-deepgreen">
                        {currentThread.name} {currentThread.age > 0 ? `, ${currentThread.age}` : ''}
                      </h3>
                      <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 font-bold">
                        {currentThread.verificationTier}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-deepgreen/70">
                      {currentThread.role} • 📍 {currentThread.locality}, {currentThread.city}
                      {currentThread.harmonyScore > 0 && ` • ${currentThread.harmonyScore}% Harmony`}
                    </p>
                  </div>
                </div>

                {/* Header Controls */}
                <div className="flex items-center gap-2 self-start sm:self-auto relative">
                  <Link
                    href={`/quiz?target=${currentThread.otherUserId || currentThread.id}`}
                    className="px-3 py-1.5 bg-cream hover:bg-butter border border-deepgreen font-mono text-[11px] font-bold text-deepgreen flex items-center gap-1 shadow-[2px_2px_0px_#263F32]"
                  >
                    <span>Vibes ↗</span>
                  </Link>

                  <button
                    onClick={handleGenerateAgreement}
                    className="px-3 py-1.5 bg-butter hover:bg-yellow-300 border border-deepgreen font-mono text-[11px] font-bold text-deepgreen flex items-center gap-1.5 shadow-[2px_2px_0px_#263F32]"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Flat Compact</span>
                  </button>

                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="p-1.5 border border-deepgreen bg-cream hover:bg-butter text-deepgreen shadow-[2px_2px_0px_#263F32]"
                    title="More actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {/* Options Dropdown */}
                  {showMoreMenu && (
                    <div className="absolute right-0 top-10 w-44 bg-cream border-2 border-deepgreen shadow-[4px_4px_0px_#263F32] z-30 font-mono text-xs py-1">
                      <button
                        onClick={() => {
                          setShowMoreMenu(false)
                          setActionModal('unmatch')
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-700 flex items-center gap-2"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        <span>Unmatch Flatmate</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowMoreMenu(false)
                          setActionModal('report')
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-700 flex items-center gap-2 border-t border-deepgreen/20"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Report &amp; Block</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-b-2 border-deepgreen pb-4 font-mono text-xs text-deepgreen/60">
                Select a conversation thread to start messaging.
              </div>
            )}

            {/* Flat Rules Agreement Alert */}
            {agreementGenerated && currentThread && (
              <div className="my-3 p-4 bg-butter/40 border-2 border-deepgreen shadow-[3px_3px_0px_#263F32] animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div className="space-y-1">
                    <h5 className="font-serif font-black text-sm text-deepgreen uppercase">
                      ✓ Digital Co-Living Compact: {myDisplayName} &amp; {currentThread.name}
                    </h5>
                    <p className="font-serif text-xs text-deepgreen/80 leading-relaxed whitespace-pre-line">
                      {agreementText ||
                        `Location: ${currentThread.locality}, ${currentThread.city} • Est. Rent: ₹${currentThread.budgetMin.toLocaleString()}/mo • 2-month deposit escrow • Quiet hours 11:00 PM - 7:00 AM • Automated 50/50 utility ledger splits.`}
                    </p>
                  </div>
                  <button
                    onClick={() => setAgreementGenerated(false)}
                    className="font-mono text-xs text-tomato font-bold underline shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto py-6 space-y-4 max-h-[420px] min-h-[300px]">
              {messages.length === 0 && (
                <div className="text-center py-16 font-mono text-xs text-deepgreen/50 space-y-2">
                  <p className="font-serif italic text-sm text-deepgreen/70">
                    No messages in this thread yet.
                  </p>
                  <p>Send an authentic greeting or share a room below to initiate contact!</p>
                </div>
              )}

              {messages.map((m) => {
                const isMe = m.isMe

                return (
                  <div
                    key={m.id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <div className="w-7 h-7 border border-deepgreen bg-sand overflow-hidden shrink-0 mb-1 shadow-[1px_1px_0px_#263F32]">
                        {m.senderAvatarUrl || currentThread?.avatarUrl ? (
                          <img
                            src={m.senderAvatarUrl || currentThread?.avatarUrl || ''}
                            alt={m.senderName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-butter flex items-center justify-center font-bold text-xs text-deepgreen">
                            {m.senderName[0]}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`max-w-md p-3.5 border-2 text-sm leading-relaxed ${
                        isMe
                          ? 'border-deepgreen bg-tomato text-cream shadow-[3px_3px_0px_#263F32]'
                          : 'border-deepgreen bg-cream text-deepgreen shadow-[3px_3px_0px_#263F32]'
                      }`}
                    >
                      <div className="font-mono text-[9px] uppercase tracking-wider mb-1 opacity-75 font-bold">
                        {isMe ? `${myDisplayName} (You)` : m.senderName}
                      </div>

                      {renderMessageContent(m)}

                      {/* Timestamps & Read Receipt */}
                      <div
                        className={`flex items-center justify-end gap-1 font-mono text-[9px] mt-1.5 ${
                          isMe ? 'text-cream/80' : 'text-deepgreen/50'
                        }`}
                      >
                        <span>{m.time}</span>
                        {isMe && (
                          <span title={m.isRead ? 'Read' : 'Delivered'}>
                            {m.isRead ? (
                              <CheckCheck className="h-3 w-3 text-butter inline" />
                            ) : (
                              <Check className="h-3 w-3 text-cream/70 inline" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {isMe && (
                      <div className="w-7 h-7 border border-deepgreen bg-tomato text-cream overflow-hidden shrink-0 mb-1 shadow-[1px_1px_0px_#263F32]">
                        {myAvatarUrl ? (
                          <img src={myAvatarUrl} alt={myDisplayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-[10px]">
                            {myInitials}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Icebreakers & Share Menu Drawer */}
            <div className="border-t border-deepgreen/20 pt-2 pb-2 space-y-2">
              {showShareMenu && (
                <div className="p-3 bg-cream border-2 border-deepgreen shadow-[3px_3px_0px_#263F32] flex flex-wrap gap-2 animate-fade-in font-mono text-xs">
                  <span className="w-full text-[10px] uppercase font-bold text-deepgreen/60">
                    SHARE ATTACHMENT CARD TO CHAT:
                  </span>
                  <button
                    onClick={handleShareRoom}
                    className="px-3 py-1.5 bg-butter hover:bg-yellow-300 border border-deepgreen text-deepgreen flex items-center gap-1.5 font-bold shadow-[1px_1px_0px_#263F32]"
                  >
                    <Home className="h-3.5 w-3.5 text-tomato" />
                    <span>Share Verified Room</span>
                  </button>
                  <button
                    onClick={handleShareProfile}
                    className="px-3 py-1.5 bg-cream hover:bg-butter border border-deepgreen text-deepgreen flex items-center gap-1.5 font-bold shadow-[1px_1px_0px_#263F32]"
                  >
                    <User className="h-3.5 w-3.5 text-tomato" />
                    <span>Share My Dossier</span>
                  </button>
                  <button
                    onClick={handleShareCompatibility}
                    className="px-3 py-1.5 bg-deepgreen text-cream hover:bg-tomato border border-deepgreen flex items-center gap-1.5 font-bold shadow-[1px_1px_0px_#263F32]"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-butter" />
                    <span>Share Chemistry Score</span>
                  </button>
                </div>
              )}

              {currentThread && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="font-mono text-[10px] bg-sand hover:bg-butter border border-deepgreen px-2.5 py-1 text-deepgreen font-bold flex items-center gap-1 transition-colors"
                  >
                    <Paperclip className="h-3 w-3 text-tomato" />
                    <span>{showShareMenu ? 'Hide Share Cards' : '+ Share Cards'}</span>
                  </button>

                  {[
                    `Propose Sunday chai walkthrough in ${currentThread.locality}`,
                    `What are your quiet hours and WFH schedule?`,
                    `How do we split weekend groceries & maid expense?`,
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setInputText(prompt)}
                      className="font-mono text-[10px] bg-cream hover:bg-butter border border-deepgreen px-2 py-0.5 text-deepgreen transition-colors hidden sm:inline-block"
                    >
                      + {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send Input Box */}
            <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  currentThread
                    ? `Type your message to ${currentThread.name}...`
                    : 'Type your message...'
                }
                className="flex-1 border-2 border-deepgreen bg-cream px-4 py-2.5 font-serif text-sm text-deepgreen focus:outline-none focus:border-tomato placeholder:text-deepgreen/40"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-3 bg-deepgreen hover:bg-tomato disabled:opacity-50 text-cream border-2 border-deepgreen transition-colors shadow-[2px_2px_0px_#E95D43]"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* UNMATCH CONFIRMATION MODAL */}
        {actionModal === 'unmatch' && currentThread && (
          <div className="fixed inset-0 z-50 bg-deepgreen/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-cream border-4 border-deepgreen p-6 sm:p-8 shadow-[10px_10px_0px_#263F32] space-y-4 text-center animate-scale-up">
              <div className="w-12 h-12 rounded-full border-2 border-deepgreen bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <UserX className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-black uppercase text-deepgreen font-serif">
                Unmatch {currentThread.name}?
              </h3>
              <p className="font-serif text-xs text-deepgreen/80 leading-relaxed">
                This will dissolve your match and conversation with {currentThread.name}. You will no longer be connected.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleUnmatch}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-serif font-bold uppercase text-xs border border-deepgreen shadow-[2px_2px_0px_#263F32]"
                >
                  Confirm Unmatch
                </button>
                <button
                  onClick={() => setActionModal(null)}
                  className="flex-1 py-3 border-2 border-deepgreen bg-cream hover:bg-butter font-mono text-xs font-bold uppercase"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REPORT & BLOCK MODAL */}
        {actionModal === 'report' && currentThread && (
          <div className="fixed inset-0 z-50 bg-deepgreen/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-cream border-4 border-deepgreen p-6 sm:p-8 shadow-[10px_10px_0px_#263F32] space-y-4 animate-scale-up">
              <div className="flex items-center gap-3 border-b-2 border-deepgreen pb-3">
                <ShieldAlert className="h-6 w-6 text-tomato shrink-0" />
                <h3 className="text-xl font-black uppercase text-deepgreen font-serif">
                  Report &amp; Block {currentThread.name}
                </h3>
              </div>
              <p className="font-serif text-xs text-deepgreen/80">
                Blocked users cannot send messages or view your profile.
              </p>
              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-deepgreen/70 mb-1">
                  REASON
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
                  DETAILS (OPTIONAL)
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
                  onClick={handleReportAndBlock}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-serif font-bold uppercase text-xs border border-deepgreen shadow-[2px_2px_0px_#263F32]"
                >
                  Report &amp; Block User
                </button>
                <button
                  onClick={() => setActionModal(null)}
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

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream text-deepgreen font-serif p-12 text-center">
          Loading YAARO Encrypted Messaging...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  )
}
