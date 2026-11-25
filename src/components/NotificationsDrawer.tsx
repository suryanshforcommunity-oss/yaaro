'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  X,
  Sparkles,
  Heart,
  MessageSquare,
  HelpCircle,
  Home,
  CheckCheck,
  ExternalLink,
  Sliders,
  RefreshCw,
} from 'lucide-react'
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type AppNotification,
} from '@/lib/notifications'

interface NotificationsDrawerProps {
  isOpen: boolean
  onClose: () => void
  onUpdateCount?: (count: number) => void
}

export default function NotificationsDrawer({
  isOpen,
  onClose,
  onUpdateCount,
}: NotificationsDrawerProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const data = await getUserNotifications()
      setNotifications(data)
      const unreadCount = data.filter((n) => !n.isRead).length
      if (onUpdateCount) onUpdateCount(unreadCount)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    if (onUpdateCount) onUpdateCount(0)
  }

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      )
      const remainingUnread = notifications.filter((n) => !n.isRead && n.id !== notif.id).length
      if (onUpdateCount) onUpdateCount(remainingUnread)
    }

    onClose()
    if (notif.actionUrl) {
      router.push(notif.actionUrl)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_match':
        return <Sparkles className="h-4 w-4 text-tomato" />
      case 'new_like':
        return <Heart className="h-4 w-4 text-tomato fill-tomato" />
      case 'new_message':
        return <MessageSquare className="h-4 w-4 text-deepgreen" />
      case 'game_challenge':
        return <HelpCircle className="h-4 w-4 text-deepgreen" />
      case 'room_activity':
        return <Home className="h-4 w-4 text-deepgreen" />
      default:
        return <Bell className="h-4 w-4 text-tomato" />
    }
  }

  if (!isOpen) return null

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-deepgreen/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-cream border-l-4 border-deepgreen shadow-2xl flex flex-col justify-between animate-slide-left">
          {/* Header */}
          <div className="p-5 border-b-2 border-deepgreen bg-cream-light flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 border border-deepgreen bg-butter text-deepgreen shadow-[2px_2px_0px_#263F32]">
                <Bell className="h-4 w-4 text-tomato" />
              </div>
              <div>
                <h3 className="font-serif font-black text-lg text-deepgreen uppercase leading-none">
                  NOTIFICATIONS
                </h3>
                <span className="font-mono text-[10px] text-deepgreen/60 uppercase">
                  {unreadCount} Unread Pings
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="px-2.5 py-1 border border-deepgreen bg-cream hover:bg-butter font-mono text-[10px] font-bold text-deepgreen uppercase transition-colors"
                  title="Mark all as read"
                >
                  Mark All Read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 border border-deepgreen bg-cream hover:bg-tomato hover:text-cream text-deepgreen transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading && (
              <div className="py-16 text-center font-mono text-xs text-deepgreen/60 flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-tomato" />
                <span>Loading notifications...</span>
              </div>
            )}

            {!isLoading && notifications.length === 0 && (
              <div className="py-20 text-center space-y-3 p-6 bg-cream border border-deepgreen">
                <div className="w-12 h-12 rounded-full border-2 border-deepgreen bg-butter flex items-center justify-center mx-auto text-deepgreen">
                  <CheckCheck className="h-6 w-6 text-deepgreen" />
                </div>
                <h4 className="font-serif font-bold text-sm text-deepgreen uppercase">
                  YOU'RE ALL CAUGHT UP!
                </h4>
                <p className="font-serif italic text-xs text-deepgreen/70">
                  New likes, mutual YAARO matches, messages, and chemistry challenges will arrive here.
                </p>
              </div>
            )}

            {!isLoading &&
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 border-2 transition-all cursor-pointer ${
                    n.isRead
                      ? 'border-deepgreen/30 bg-cream-light hover:border-deepgreen text-deepgreen/80'
                      : 'border-deepgreen bg-butter/40 hover:bg-butter shadow-[3px_3px_0px_#263F32] text-deepgreen font-bold'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 border border-deepgreen bg-cream shrink-0 mt-0.5 shadow-[1px_1px_0px_#263F32]">
                      {getIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <h4 className="font-serif font-black text-xs uppercase truncate">
                          {n.title}
                        </h4>
                        <span className="font-mono text-[9px] text-deepgreen/50 shrink-0 font-normal">
                          {n.timeAgo}
                        </span>
                      </div>
                      <p className="font-serif text-xs text-deepgreen/90 leading-relaxed">
                        {n.body}
                      </p>
                      {n.actionUrl && (
                        <div className="mt-2 flex items-center gap-1 font-mono text-[10px] text-tomato font-bold uppercase">
                          <span>View Detail ↗</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t-2 border-deepgreen bg-cream-light flex items-center justify-between font-mono text-xs">
            <Link
              href="/profile/preferences"
              onClick={onClose}
              className="text-deepgreen hover:text-tomato underline flex items-center gap-1.5 font-bold"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Notification Preferences</span>
            </Link>

            <span className="text-[10px] text-deepgreen/50 uppercase">YAARO Dispatch v1.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
