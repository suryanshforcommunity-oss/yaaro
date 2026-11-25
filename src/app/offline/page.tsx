'use client'

import Link from 'next/link'
import { WifiOff, RefreshCw, Home, Compass } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-cream text-deepgreen flex flex-col justify-between font-serif selection:bg-tomato selection:text-white p-6 sm:p-12">
      {/* Top Editorial Masthead */}
      <header className="border-b-2 border-deepgreen pb-4 max-w-4xl mx-auto w-full flex items-center justify-between">
        <div>
          <span className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">
            YAARO<span className="text-tomato italic text-xl">.live</span>
          </span>
          <p className="text-[10px] font-mono uppercase tracking-widest text-deepgreen/70 mt-0.5">
            Vol. 1 • The Contemporary Flatmate Review
          </p>
        </div>
        <div className="flex items-center gap-2 bg-tomato/10 text-tomato px-3 py-1 border border-tomato/40 text-xs font-mono uppercase tracking-wider">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Offline Dispatch</span>
        </div>
      </header>

      {/* Main Offline Editorial Content */}
      <main className="max-w-xl mx-auto w-full my-auto text-center py-12">
        <div className="inline-block p-4 bg-butter/30 border-2 border-deepgreen mb-6 shadow-[3px_3px_0px_#263F32]">
          <WifiOff className="w-10 h-10 text-tomato mx-auto" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-tight mb-4">
          You are currently <br />
          <span className="italic font-normal text-tomato lowercase font-serif">off the grid.</span>
        </h1>

        <p className="text-base sm:text-lg text-deepgreen/80 font-sans leading-relaxed mb-8 max-w-md mx-auto">
          YAARO relies on live encrypted connections for roommate chemistry calculations, instant chat, and verified listings. Reconnect to WiFi or mobile data to continue.
        </p>

        {/* Offline Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-tomato hover:bg-tomato-dark text-cream-light font-bold text-xs uppercase tracking-wider font-mono shadow-[3px_3px_0px_#263F32] transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-cream-light hover:bg-butter/50 border border-deepgreen text-deepgreen font-bold text-xs uppercase tracking-wider font-mono shadow-[3px_3px_0px_#263F32] transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to Landing</span>
          </Link>
        </div>

        {/* Domestic Flatmate Tip */}
        <div className="mt-12 p-4 bg-cream-light border border-deepgreen/40 text-left font-mono text-xs">
          <span className="text-[10px] text-tomato font-bold uppercase tracking-widest block mb-1">
            Offline Etiquette Tip #14
          </span>
          <p className="text-deepgreen/80 font-sans text-sm">
            “When the WiFi goes down, check the router before blaming your flatmates. The morning chai kettle is also best enjoyed without screens.”
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-deepgreen/30 pt-4 max-w-4xl mx-auto w-full text-center text-xs font-mono text-deepgreen/60">
        YAARO PWA Shell • Offline Storage Safe • Encrypted Private Data Not Cached
      </footer>
    </div>
  )
}
