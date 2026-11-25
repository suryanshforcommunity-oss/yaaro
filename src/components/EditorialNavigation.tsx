'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Users, Home, HelpCircle, MessageSquare, Receipt, User, LogOut, Bell, Compass } from 'lucide-react'
import { signOutUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import NotificationsDrawer from './NotificationsDrawer'
import { getUnreadNotificationCount } from '@/lib/notifications'

// Module-level cache to keep navigation snappy across route switches
let cachedProfile: { userName: string; city: string; unread: number } | null = null

export default function EditorialNavigation({
  user,
  city,
}: {
  user?: { name?: string; email?: string } | null
  city?: string
}) {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!user)
  const [userName, setUserName] = useState<string>(
    cachedProfile?.userName ||
      (user?.name && !user.name.includes('Rhea') ? user.name : 'My Dossier')
  )
  const [userCity, setUserCity] = useState<string>(cachedProfile?.city || city || 'Pune')
  const [unreadNotifications, setUnreadNotifications] = useState<number>(cachedProfile?.unread || 0)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false)
  const [isNavigating, setIsNavigating] = useState<boolean>(false)

  // Reset navigation indicator whenever pathname updates
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  useEffect(() => {
    async function loadUser() {
      try {
        if (cachedProfile) {
          return
        }
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          setIsAuthenticated(true)
          const { data: profile } = await (supabase.from('profiles') as any)
            .select('full_name, city')
            .eq('id', authUser.id)
            .maybeSingle()

          const resolvedName =
            (profile as any)?.full_name ||
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split('@')[0] ||
            'My Dossier'
          const resolvedCity = (profile as any)?.city || city || 'Pune'
          const unread = await getUnreadNotificationCount()

          cachedProfile = {
            userName: resolvedName,
            city: resolvedCity,
            unread,
          }

          setUserName(resolvedName)
          setUserCity(resolvedCity)
          setUnreadNotifications(unread)
        }
      } catch (err) {
        // Graceful fallback in guest mode
      }
    }
    loadUser()
  }, [city])

  const navItems = [
    { label: 'Landing', href: '/', icon: Compass },
    { label: 'Dashboard', href: '/dashboard', icon: Sparkles },
    { label: 'Discover', href: '/discover', icon: Users },
    { label: 'Matches', href: '/matches', icon: Sparkles },
    { label: 'Rooms', href: '/rooms', icon: Home },
    { label: 'Vibe Quiz', href: '/quiz', icon: HelpCircle },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'Split Ledger', href: '/expenses', icon: Receipt },
  ]

  const handleNavClick = (href: string) => {
    if (href !== pathname) {
      setIsNavigating(true)
    }
  }

  return (
    <>
      {/* Top Editorial Masthead */}
      <header className="border-b-2 border-deepgreen px-6 sm:px-10 py-2.5 sm:py-3 bg-cream sticky top-0 z-40 backdrop-blur-md relative">
        {/* Subtle instant navigation progress indicator */}
        {isNavigating && (
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-tomato animate-pulse z-50 shadow-[0_0_8px_#E95D43]" />
        )}

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 sm:gap-8">
          <div className="flex items-center">
            <Link
              href="/"
              prefetch={true}
              onClick={() => handleNavClick('/')}
              className="flex items-baseline gap-2 group"
              title="YAARO.live"
            >
              <span className="text-3xl sm:text-4xl font-black tracking-tighter uppercase font-serif text-deepgreen group-hover:text-tomato transition-colors">
                YAARO<span className="text-tomato font-serif italic text-2xl sm:text-3xl lowercase">.live</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links with instant SPA prefetching */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-9 font-sans font-bold text-xs uppercase tracking-wider">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => handleNavClick(item.href)}
                  className={`transition-colors py-1 ${
                    isActive
                      ? 'text-tomato font-black underline decoration-tomato decoration-2 underline-offset-8'
                      : 'text-deepgreen hover:text-tomato'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Member Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-1.5 sm:p-2 border-2 border-deepgreen bg-cream hover:bg-butter transition-colors text-deepgreen shadow-[2px_2px_0px_#263F32]"
              title="Notifications"
            >
              <Bell className="h-4 w-4 text-tomato" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-tomato text-cream text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border border-deepgreen">
                  {unreadNotifications}
                </span>
              )}
            </button>

            <Link
              href="/profile"
              prefetch={true}
              onClick={() => handleNavClick('/profile')}
              className="px-3 py-1.5 border-2 border-deepgreen bg-cream-light hover:bg-butter transition-colors font-sans text-xs font-bold text-deepgreen flex items-center gap-2 shadow-[2px_2px_0px_#263F32]"
            >
              <User className="h-3.5 w-3.5 text-tomato" />
              <span className="hidden sm:inline">{userName}</span>
            </Link>
            <button
              onClick={() => signOutUser()}
              className="p-1.5 border-2 border-deepgreen bg-cream hover:bg-tomato hover:text-cream transition-colors text-deepgreen shadow-[1px_1px_0px_#263F32]"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Slide-Over Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onUpdateCount={setUnreadNotifications}
      />

      {/* Mobile Editorial Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-cream border-t-2 border-deepgreen safe-bottom shadow-[0px_-4px_10px_rgba(38,63,50,0.06)] font-sans">
        <div className="grid grid-cols-8 py-2 px-1 text-center font-bold text-[8px]">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => handleNavClick(item.href)}
                className={`flex flex-col items-center justify-center py-1 transition-colors ${
                  isActive ? 'text-tomato font-black' : 'text-deepgreen/70 hover:text-deepgreen'
                }`}
              >
                <div
                  className={`p-1 rounded-sm mb-0.5 ${
                    isActive ? 'bg-tomato text-cream shadow-[1px_1px_0px_#263F32]' : ''
                  }`}
                >
                  <Icon className="h-3 w-3" />
                </div>
                <span className="truncate max-w-[48px]">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
