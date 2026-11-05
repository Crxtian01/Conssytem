'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Interactive 3D Isometric Architectural Sculpture for the ConstructMS Landing Page.
 * Replaces the previous cloth ribbon with the signature ConstructMS 3D Isometric
 * Charcoal & Brushed-Brass Structural Frame, Graduated Brass T-Square Ruler,
 * and Multi-Depth Floating Spheres with live pointer-driven 3D tilt & specular sheen.
 */
export default function FabricSculpture({ className = '' }: { className?: string }) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
    const stage = stageRef.current
    if (!stage) return

    const target = { x: 0, y: 0 }
    const smooth = { x: 0, y: 0 }
    let raf = 0

    function onPointerMove(e: PointerEvent) {
      target.x = (e.clientX / window.innerWidth) * 2 - 1
      target.y = (e.clientY / window.innerHeight) * 2 - 1
    }

    function tick() {
      raf = requestAnimationFrame(tick)
      smooth.x += (target.x - smooth.x) * 0.06
      smooth.y += (target.y - smooth.y) * 0.06
      if (stage) {
        stage.style.setProperty('--rx', `${(-smooth.y * 9).toFixed(2)}deg`)
        stage.style.setProperty('--ry', `${(smooth.x * 12).toFixed(2)}deg`)
        stage.style.setProperty('--sx', `${(smooth.x * 22).toFixed(1)}px`)
        stage.style.setProperty('--sy', `${(smooth.y * 18).toFixed(1)}px`)
        stage.style.setProperty('--glint', `${50 + smooth.x * 35}%`)
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [])

  return (
    <div
      ref={stageRef}
      aria-hidden="true"
      className={`${className} relative flex items-center justify-center select-none transition-[opacity,transform] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        ready ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{
        perspective: '1200px',
      }}
    >
      {/* Warm studio ambient halo behind the isometric structure */}
      <div
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full blur-3xl lg:h-[560px] lg:w-[560px]"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(234, 158, 52, 0.24) 0%, rgba(212, 175, 112, 0.16) 42%, rgba(243, 239, 232, 0) 74%)',
          transform: 'translate3d(calc(var(--sx, 0px) * -0.5), calc(var(--sy, 0px) * -0.5), 0)',
        }}
      />

      {/* Subtle architectural isometric drafting rings & axes */}
      <svg
        viewBox="0 0 600 600"
        className="pointer-events-none absolute h-[460px] w-[460px] opacity-30 lg:h-[620px] lg:w-[620px]"
        style={{
          transform:
            'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translate3d(calc(var(--sx, 0px) * -0.35), calc(var(--sy, 0px) * -0.35), -40px)',
        }}
      >
        <defs>
          <linearGradient id="iso-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b89150" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#1f2124" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <ellipse
          cx="300"
          cy="320"
          rx="245"
          ry="142"
          fill="none"
          stroke="url(#iso-ring-grad)"
          strokeWidth="1"
          strokeDasharray="6 8"
        />
        <ellipse
          cx="300"
          cy="320"
          rx="185"
          ry="106"
          fill="none"
          stroke="url(#iso-ring-grad)"
          strokeWidth="0.8"
        />
        {/* 30-degree isometric construction axes */}
        <line
          x1="70"
          y1="188"
          x2="530"
          y2="452"
          stroke="#b89150"
          strokeWidth="0.75"
          strokeOpacity="0.4"
          strokeDasharray="4 6"
        />
        <line
          x1="530"
          y1="188"
          x2="70"
          y2="452"
          stroke="#1f2124"
          strokeWidth="0.75"
          strokeOpacity="0.28"
          strokeDasharray="4 6"
        />
      </svg>

      {/* Main 3D Tilt & Floating Container */}
      <div
        className="cms-float relative flex items-center justify-center"
        style={{
          animationDuration: '9s',
          transformStyle: 'preserve-3d',
          transform:
            'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translate3d(var(--sx, 0px), var(--sy, 0px), 0)',
          transition: 'transform 0.12s ease-out',
        }}
      >
        {/* Dynamic Ground Contact Shadow */}
        <div
          className="pointer-events-none absolute -bottom-8 left-1/2 h-16 w-[72%] -translate-x-1/2 rounded-full blur-2xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(28, 22, 14, 0.28) 0%, rgba(28, 22, 14, 0.10) 52%, transparent 80%)',
            transform:
              'translate3d(calc(var(--sx, 0px) * -0.45), calc(var(--sy, 0px) * -0.25), -60px)',
          }}
        />

        {/* Signature 3D Isometric Architectural Frame, Brass T-Square & Spheres */}
        <div className="relative w-[330px] sm:w-[430px] lg:w-[540px] xl:w-[600px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/constructms-sculpture.png"
            alt="ConstructMS 3D Isometric Architectural Frame and T-Square Sculpture"
            className="h-auto w-full object-contain drop-shadow-[0_28px_42px_rgba(32,24,14,0.22)]"
            draggable={false}
          />

          {/* Interactive Specular Brushed-Gold Light Glint overlay synced to cursor */}
          <div
            className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-70"
            style={{
              background:
                'radial-gradient(circle at var(--glint, 50%) 42%, rgba(255, 248, 220, 0.85) 0%, rgba(245, 180, 75, 0.25) 35%, transparent 68%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
