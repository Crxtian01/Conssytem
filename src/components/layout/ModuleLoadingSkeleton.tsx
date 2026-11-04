export default function ModuleLoadingSkeleton({
  title = 'Loading module…',
}: {
  title?: string
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Top animated progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-amber-100 overflow-hidden">
        <div className="h-full w-1/2 animate-pulse bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />
      </div>

      {/* Persistent Sidebar Skeleton so the layout never jumps */}
      <aside className="hidden w-64 border-r border-gray-200 bg-white md:flex md:flex-col">
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-xl shadow-sm">
            🏗️
          </span>
          <div>
            <p className="font-bold text-gray-900 leading-tight">ConstructMS</p>
            <p className="text-xs text-gray-500">Site &amp; Project System</p>
          </div>
        </div>

        <div className="border-b border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-gray-200 animate-pulse" />
              <div className="h-2.5 w-36 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-full rounded-lg bg-gray-100 animate-pulse" />
        </div>

        <div className="flex-1 space-y-2 p-3">
          <div className="h-3 w-24 rounded bg-gray-200 mx-2 mb-2 animate-pulse" />
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2"
            >
              <div className="h-7 w-7 rounded-md bg-gray-100 animate-pulse" />
              <div className="h-3.5 flex-1 rounded bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area Loading Card + Shimmer Skeleton */}
      <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Branded Loading Header Pill */}
          <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500">
                  Syncing ConstructMS workspace &amp; role permissions…
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              Loading
            </span>
          </div>

          {/* KPI Skeleton Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-3"
              >
                <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
                <div className="h-7 w-20 rounded bg-gray-200 animate-pulse" />
                <div className="h-2.5 w-32 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Content Table/Cards Skeleton */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="h-5 w-48 rounded bg-gray-200 animate-pulse" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-3"
                >
                  <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
                  <div className="h-16 w-full rounded-lg bg-gray-100 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
