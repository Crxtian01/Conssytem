import ScatteredMaterialsBackdrop from '@/components/layout/ScatteredMaterialsBackdrop'

export default function ModuleLoadingSkeleton({
  title = 'Loading module…',
}: {
  title?: string
}) {
  return (
    <div className="liquid-mesh-bg relative min-h-screen flex flex-col md:flex-row overflow-hidden text-slate-900">
      <ScatteredMaterialsBackdrop />

      {/* Top animated progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/40 backdrop-blur-md overflow-hidden">
        <div className="h-full w-1/2 animate-pulse bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />
      </div>

      {/* Persistent Liquid Glass Sidebar Skeleton */}
      <aside className="liquid-glass-sidebar relative z-20 hidden w-64 md:m-3 md:flex md:flex-col md:rounded-3xl md:shrink-0">
        <div className="flex items-center gap-3 border-b border-white/60 px-5 py-4">
          <span className="liquid-droplet-pill flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/constructms-sculpture.png"
              alt="ConstructMS Logo"
              className="h-full w-full object-contain"
            />
          </span>
          <div>
            <p className="font-extrabold text-gray-900 leading-tight">ConstructMS</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-gray-500">
              Construction Management
            </p>
          </div>
        </div>

        <div className="border-b border-white/60 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/70 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-white/80 animate-pulse" />
              <div className="h-2.5 w-36 rounded bg-white/60 animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-full rounded-xl bg-white/65 animate-pulse" />
        </div>

        <div className="flex-1 space-y-2 p-3">
          <div className="h-3 w-24 rounded bg-white/70 mx-2 mb-2 animate-pulse" />
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 rounded-2xl px-2.5 py-2"
            >
              <div className="h-7 w-7 rounded-xl bg-white/65 animate-pulse" />
              <div className="h-3.5 flex-1 rounded bg-white/65 animate-pulse" />
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area Liquid Glass Skeleton */}
      <main className="relative z-10 flex-1 p-4 pb-24 md:p-7 md:pb-8 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="liquid-glass-card rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/90 bg-white/70 shadow-2xs">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">{title}</p>
                <p className="text-xs text-gray-600">
                  Refracting ConstructMS Liquid Glass workspace…
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/75 px-3 py-1 text-xs font-semibold text-amber-900 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              Loading
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="liquid-glass-card rounded-2xl p-5 space-y-3"
              >
                <div className="h-3 w-24 rounded bg-white/80 animate-pulse" />
                <div className="h-7 w-20 rounded bg-white/80 animate-pulse" />
                <div className="h-2.5 w-32 rounded bg-white/60 animate-pulse" />
              </div>
            ))}
          </div>

          <div className="liquid-glass-card rounded-3xl p-6 space-y-4">
            <div className="h-5 w-48 rounded bg-white/80 animate-pulse" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/80 bg-white/45 p-4 space-y-3"
                >
                  <div className="h-4 w-3/4 rounded bg-white/80 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-white/65 animate-pulse" />
                  <div className="h-16 w-full rounded-xl bg-white/55 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
