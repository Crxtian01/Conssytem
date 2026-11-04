import React from 'react'

interface AuthCardLayoutProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export default function AuthCardLayout({ title, subtitle, children }: AuthCardLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-amber-100 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500 text-3xl shadow-sm">
            🏗️
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  )
}

