import React from 'react'
import Link from 'next/link'
import ScatteredMaterialsBackdrop from '@/components/layout/ScatteredMaterialsBackdrop'

interface AuthCardLayoutProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export default function AuthCardLayout({ title, subtitle, children }: AuthCardLayoutProps) {
  return (
    <main className="liquid-mesh-bg liquid-workspace relative flex min-h-dvh flex-col items-center justify-center px-4 py-12 overflow-hidden bg-[#05070e]">
      {/* Exact city night photography bokeh background from the dashboard */}
      <ScatteredMaterialsBackdrop />

      {/* Top-Left Floating Navigation Pill */}
      <div className="fixed top-5 left-5 z-20 sm:top-7 sm:left-8">
        <Link
          href="/welcome"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-2xl transition-all hover:border-cyan-400/40 hover:bg-white/10 hover:text-white"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] transition-transform group-hover:-translate-x-0.5">
            ←
          </span>
          <span>Back to Landing Page</span>
        </Link>
      </div>

      {/* Main Dark Frosted Glass Auth Card (Matches Dashboard Aesthetic) */}
      <div className="relative z-10 w-full max-w-md rounded-[32px] border border-white/10 bg-[#121624]/90 p-8 sm:p-9 shadow-[0_32px_90px_rgba(0,0,0,0.75)] backdrop-blur-3xl text-white">
        {/* Top Specular Liquid Glint */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
        />

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 p-2.5 shadow-lg border border-cyan-400/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/constructms-sculpture.png"
              alt="ConstructMS — Construction Management"
              className="h-full w-full object-contain"
            />
          </div>
          <span className="inline-block rounded-full bg-cyan-500/20 border border-cyan-400/30 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-300">
            ConstructMS Workspace
          </span>
          <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-400">{subtitle}</p>
        </div>

        {children}

        {/* Bottom Return Link */}
        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <Link
            href="/welcome"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition hover:text-cyan-300"
          >
            <span>←</span>
            <span>Return to ConstructMS Overview</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
