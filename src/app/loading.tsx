export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-deepgreen font-serif animate-in fade-in duration-150">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-black tracking-tighter uppercase text-deepgreen">
            YAARO
          </span>
          <span className="text-tomato italic text-2xl sm:text-3xl lowercase">.live</span>
        </div>
        <div className="w-36 h-1 bg-deepgreen/20 overflow-hidden relative border border-deepgreen/40">
          <div className="h-full bg-tomato animate-[shimmer_1.2s_infinite_linear]" style={{ width: '60%' }} />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-deepgreen/60">
          Loading Collective...
        </span>
      </div>
    </div>
  )
}
