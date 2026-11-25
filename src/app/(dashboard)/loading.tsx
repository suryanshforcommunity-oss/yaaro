export default function DashboardLoading() {
  return (
    <div className="min-h-[70vh] bg-cream flex flex-col items-center justify-center p-6 text-deepgreen font-serif animate-in fade-in duration-150">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-black tracking-tighter uppercase text-deepgreen">
            YAARO
          </span>
          <span className="text-tomato italic text-xl sm:text-2xl lowercase">.live</span>
        </div>
        <div className="w-32 h-1 bg-deepgreen/20 overflow-hidden relative border border-deepgreen/40">
          <div className="h-full bg-tomato animate-pulse" style={{ width: '70%' }} />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-deepgreen/60">
          Syncing Records...
        </span>
      </div>
    </div>
  )
}
