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
    <main className="liquid-mesh-bg liquid-workspace relative flex min-h-dvh flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Warm visionOS studio glow behind the auth card */}
      <ScatteredMaterialsBackdrop />

      {/* Top-Left Floating visionOS Navigation Pill */}
      <div className="fixed top-5 left-5 z-20 sm:top-7 sm:left-8">
        <Link
          href="/welcome"
          className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-amber-50/90 shadow-lg backdrop-blur-xl transition-all hover:border-white/35 hover:bg-white/18 hover:text-white"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[11px] transition-transform group-hover:-translate-x-0.5">
            ←
          </span>
          <span>Back to Landing Page</span>
        </Link>
      </div>

      {/* Main visionOS Warm Frosted Auth Card */}
      <div className="liquid-glass-card relative z-10 w-full max-w-md rounded-[32px] p-8 sm:p-9 shadow-[0_32px_80px_-16px_rgba(12,6,4,0.65)]">
        {/* Top Specular Liquid Glint */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
        />

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d96543] to-[#9e381b] p-2.5 shadow-md ring-2 ring-white/80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/constructms-sculpture.png"
              alt="ConstructMS — Construction Management"
              className="h-full w-full object-contain"
            />
          </div>
          <span className="inline-block rounded-full bg-[#ede3da] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8c422b]">
            ConstructMS Workspace
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1e1512]">
            {title}
          </h1>
          <p className="mt-1 text-xs font-medium text-[#6e5a52]">{subtitle}</p>
        </div>

        {children}

        {/* Subtle Bottom Return Link Inside Card for Mobile Ergonomics */}
        <div className="mt-6 border-t border-black/8 pt-4 text-center">
          <Link
            href="/welcome"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6e5a52] transition hover:text-[#c85a38]"
          >
            <span>←</span>
            <span>Return to ConstructMS Overview</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
