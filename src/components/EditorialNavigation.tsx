'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sparkles,
  Users,
  Home,
  HelpCircle,
  MessageSquare,
  Receipt,
  User,
  LogOut,
  Bell,
  Compass,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
  const [isNavigating, setIsNavigating] = useState<boolean>(false)

  // Reset navigation indicator and close mobile menu whenever pathname updates
  useEffect(() => {
    setIsNavigating(false)
    setIsMobileMenuOpen(false)
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

  const primaryNavItems = [
    { label: 'Landing', href: '/', icon: Compass },
    { label: 'Dashboard', href: '/dashboard', icon: Sparkles },
    { label: 'Discover', href: '/discover', icon: Users },
    { label: 'Matches', href: '/matches', icon: Sparkles },
    { label: 'Rooms', href: '/rooms', icon: Home },
    { label: 'Vibe Quiz', href: '/quiz', icon: HelpCircle },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'Split Ledger', href: '/expenses', icon: Receipt },
  ]

  // 5 primary tabs for mobile bottom bar
  const mobileBottomTabs = [
    { label: 'Dashboard', href: '/dashboard', icon: Sparkles },
    { label: 'Discover', href: '/discover', icon: Users },
    { label: 'Matches', href: '/matches', icon: Sparkles },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
  ]

  const handleNavClick = (href: string) => {
    if (href !== pathname) {
      setIsNavigating(true)
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Top Editorial Masthead */}
      <header className="border-b-2 border-deepgreen px-4 sm:px-8 md:px-10 py-2 sm:py-2.5 bg-cream sticky top-0 z-40 backdrop-blur-md relative">
        {/* Subtle instant navigation progress indicator */}
        {isNavigating && (
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-tomato animate-pulse z-50 shadow-[0_0_8px_#E95D43]" />
        )}

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          <div className="flex items-center">
            <Link
              href="/"
              prefetch={true}
              onClick={() => handleNavClick('/')}
              className="flex items-baseline gap-1.5 group"
              title="YAARO.live"
            >
              <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase font-serif text-deepgreen group-hover:text-tomato transition-colors">
                YAARO<span className="text-tomato font-serif italic text-xl sm:text-2xl md:text-3xl lowercase">.live</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links with instant SPA prefetching */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 font-sans font-bold text-xs uppercase tracking-wider">
            {primaryNavItems.map((item) => {
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
          <div className="flex items-center gap-2 sm:gap-3">
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
              className="px-2.5 sm:px-3 py-1.5 border-2 border-deepgreen bg-cream-light hover:bg-butter transition-colors font-sans text-xs font-bold text-deepgreen flex items-center gap-1.5 sm:gap-2 shadow-[2px_2px_0px_#263F32]"
            >
              <User className="h-3.5 w-3.5 text-tomato" />
              <span className="hidden md:inline">{userName}</span>
            </Link>

            <button
              onClick={() => signOutUser()}
              className="hidden sm:inline-flex p-1.5 border-2 border-deepgreen bg-cream hover:bg-tomato hover:text-cream transition-colors text-deepgreen shadow-[1px_1px_0px_#263F32]"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 border-2 border-deepgreen bg-cream hover:bg-butter text-deepgreen shadow-[2px_2px_0px_#263F32] flex items-center justify-center"
              title="Menu"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4 text-tomato" /> : <Menu className="h-4 w-4" />}
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

      {/* Mobile Slide-Up / Dropdown Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-deepgreen/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="absolute top-0 right-0 left-0 bg-cream border-b-2 border-deepgreen p-5 shadow-[0_8px_20px_rgba(38,63,50,0.15)] font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-deepgreen/20 pb-3">
              <span className="font-serif font-black uppercase text-sm tracking-wider text-deepgreen">
                YAARO Directory Menu
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 border border-deepgreen bg-cream hover:bg-tomato hover:text-cream text-deepgreen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {primaryNavItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => handleNavClick(item.href)}
                    className={`p-3 border-2 font-bold text-xs uppercase flex items-center justify-between transition-all ${
                      isActive
                        ? 'border-tomato bg-tomato/10 text-tomato shadow-[2px_2px_0px_#E95D43]'
                        : 'border-deepgreen/30 bg-cream-light text-deepgreen hover:border-deepgreen'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-tomato" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="h-3 w-3 text-deepgreen/40" />
                  </Link>
                )
              })}
            </div>

            <div className="pt-2 border-t border-deepgreen/20 flex items-center justify-between font-mono text-xs">
              <Link
                href="/profile"
                prefetch={true}
                onClick={() => handleNavClick('/profile')}
                className="text-deepgreen hover:text-tomato underline font-bold"
              >
                My Dossier ({userName})
              </Link>
              <button
                onClick={() => signOutUser()}
                className="text-tomato hover:underline font-bold flex items-center gap-1"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Editorial Bottom Tab Bar (5 High-Frequency Touch-Friendly Buttons) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-cream border-t-2 border-deepgreen safe-bottom shadow-[0px_-4px_10px_rgba(38,63,50,0.06)] font-sans">
        <div className="grid grid-cols-5 py-1.5 px-2 text-center font-bold text-[9px]">
          {mobileBottomTabs.map((item) => {
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
                  className={`p-1.5 rounded-sm mb-0.5 ${
                    isActive ? 'bg-tomato text-cream shadow-[1px_1px_0px_#263F32]' : ''
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="truncate max-w-[56px]">{item.label}</span>
              </Link>
            )
          })}

          {/* More Drawer Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 text-deepgreen/70 hover:text-deepgreen transition-colors"
          >
            <div className="p-1.5 rounded-sm mb-0.5 border border-deepgreen/20 bg-cream-light">
              <Menu className="h-3.5 w-3.5 text-deepgreen" />
            </div>
            <span className="truncate max-w-[56px]">More</span>
          </button>
        </div>
      </div>
    </>
  )
}
