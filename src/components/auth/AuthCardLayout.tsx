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
    <main className="liquid-mesh-bg liquid-workspace relative flex min-h-screen flex-col items-center justify-center px-4 py-10 overflow-hidden">
      {/* Scattered floating construction materials & liquid orbs behind the glass auth card */}
      <ScatteredMaterialsBackdrop />

      <div className="relative z-10 mb-4 w-full max-w-md">
        <Link
          href="/welcome"
          className="liquid-droplet-pill inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-white/80 transition"
        >
          <span>←</span>
          <span>Back to ConstructMS Landing Page</span>
        </Link>
      </div>

      <div className="liquid-glass-card relative z-10 w-full max-w-md rounded-3xl p-8">
        {/* Top Specular Liquid Glint */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
        />

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-3xl text-white shadow-[0_8px_20px_rgba(217,119,6,0.4),inset_0_2px_2px_rgba(255,255,255,0.8)]">
            🏗️
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">{subtitle}</p>
        </div>

        {children}
      </div>
    </main>
  )
}
