'use client'

/**
 * ScatteredMaterialsBackdrop
 * Recreates the exact dark city night photography bokeh background from the reference design.
 * Features vivid, high-luma spherical camera bokeh discs (cyan, royal indigo, violet, amber)
 * with lens rings, soft ambient street glow, and subtle atmospheric drift.
 */
export default function ScatteredMaterialsBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* 1. Deep Night Cinematic Base (#05070e to #0b1120) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 45% 30%, #0d1527 0%, #080c18 50%, #03050a 100%)',
        }}
      />

      {/* 2. Soft City Night Ambient Lighting Gradients */}
      <div
        className="absolute -top-32 -left-20 h-[520px] w-[520px] rounded-full opacity-60 blur-[90px]"
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.45) 0%, rgba(59, 130, 246, 0.2) 60%, transparent 80%)',
        }}
      />
      <div
        className="absolute top-1/3 -right-24 h-[580px] w-[580px] rounded-full opacity-55 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(99, 102, 241, 0.2) 60%, transparent 80%)',
        }}
      />
      <div
        className="absolute -bottom-28 left-1/4 h-[480px] w-[480px] rounded-full opacity-45 blur-[85px]"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(30, 58, 138, 0.2) 60%, transparent 80%)',
        }}
      />

      {/* 3. REALISTIC CAMERA BOKEH DISCS (High Opacity, Crisp Spherical Lenses) */}

      {/* Big Cyan-Blue Bokeh Orb (Top-Left, glowing outside the sidebar) */}
      <div
        className="absolute -top-6 left-2 sm:left-6 h-64 w-64 rounded-full blur-[26px] opacity-90"
        style={{
          background:
            'radial-gradient(circle, rgba(34, 211, 238, 0.95) 0%, rgba(6, 182, 212, 0.75) 45%, rgba(14, 165, 233, 0.35) 70%, transparent 85%)',
          boxShadow: '0 0 50px rgba(6, 182, 212, 0.6)',
          animation: 'bokeh-pulse 9s ease-in-out infinite',
        }}
      />

      {/* Second Cyan Bokeh Orb (Slightly smaller, top edge) */}
      <div
        className="absolute top-4 left-72 sm:left-80 h-44 w-44 rounded-full blur-[22px] opacity-80"
        style={{
          background:
            'radial-gradient(circle, rgba(56, 189, 248, 0.9) 0%, rgba(6, 182, 212, 0.5) 50%, transparent 80%)',
          animation: 'bokeh-drift 12s ease-in-out infinite',
        }}
      />

      {/* Royal Indigo & Blue Bokeh Disc (Mid-Left, behind/beside navigation) */}
      <div
        className="absolute top-[36%] -left-10 h-72 w-72 rounded-full blur-[30px] opacity-85"
        style={{
          background:
            'radial-gradient(circle, rgba(99, 102, 241, 0.9) 0%, rgba(79, 70, 229, 0.6) 50%, rgba(59, 130, 246, 0.25) 75%, transparent 85%)',
          boxShadow: '0 0 60px rgba(99, 102, 241, 0.5)',
          animation: 'bokeh-drift 14s ease-in-out infinite 1.5s',
        }}
      />

      {/* Radiant Magenta / Violet Bokeh Disc (Lower-Left) */}
      <div
        className="absolute top-[60%] -left-8 h-64 w-64 rounded-full blur-[28px] opacity-80"
        style={{
          background:
            'radial-gradient(circle, rgba(192, 38, 211, 0.9) 0%, rgba(168, 85, 247, 0.55) 50%, transparent 80%)',
          animation: 'bokeh-pulse 11s ease-in-out infinite 2s',
        }}
      />

      {/* Warm Golden-Amber Bokeh Light (Bottom-Left, warm city street light) */}
      <div
        className="absolute -bottom-10 left-8 h-56 w-56 rounded-full blur-[26px] opacity-85"
        style={{
          background:
            'radial-gradient(circle, rgba(245, 158, 11, 0.9) 0%, rgba(217, 119, 6, 0.5) 45%, rgba(180, 83, 9, 0.2) 70%, transparent 80%)',
          boxShadow: '0 0 45px rgba(245, 158, 11, 0.45)',
          animation: 'bokeh-drift 13s ease-in-out infinite',
        }}
      />

      {/* Electric Violet Bokeh Disc (Top-Right, visible outside canvas) */}
      <div
        className="absolute -top-10 right-20 sm:right-32 h-68 w-68 rounded-full blur-[28px] opacity-85"
        style={{
          background:
            'radial-gradient(circle, rgba(168, 85, 247, 0.9) 0%, rgba(139, 92, 246, 0.55) 45%, transparent 80%)',
          boxShadow: '0 0 55px rgba(168, 85, 247, 0.5)',
          animation: 'bokeh-pulse 10s ease-in-out infinite 1s',
        }}
      />

      {/* Large Vibrant Purple Bokeh Disc (Mid-Right, directly outside the Line Chart) */}
      <div
        className="absolute top-[32%] -right-12 h-88 w-88 rounded-full blur-[34px] opacity-90"
        style={{
          background:
            'radial-gradient(circle, rgba(147, 51, 234, 0.92) 0%, rgba(126, 34, 206, 0.6) 45%, rgba(99, 102, 241, 0.3) 70%, transparent 85%)',
          boxShadow: '0 0 70px rgba(147, 51, 234, 0.6)',
          animation: 'bokeh-drift 15s ease-in-out infinite 2.5s',
        }}
      />

      {/* Glowing Turquoise / Cyan Bokeh Orb (Bottom-Right, outside donut widget) */}
      <div
        className="absolute -bottom-8 -right-6 h-72 w-72 rounded-full blur-[28px] opacity-85"
        style={{
          background:
            'radial-gradient(circle, rgba(6, 182, 212, 0.9) 0%, rgba(14, 165, 233, 0.55) 50%, transparent 80%)',
          boxShadow: '0 0 60px rgba(6, 182, 212, 0.5)',
          animation: 'bokeh-pulse 12s ease-in-out infinite 0.5s',
        }}
      />

      {/* 4. Fine Spherical Lens Bokeh Discs in Mid-Screen (Softly visible between cards) */}
      <div
        className="absolute top-[22%] left-[26%] h-28 w-28 rounded-full blur-[14px] opacity-75"
        style={{
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.85) 0%, rgba(6, 182, 212, 0.4) 60%, transparent 80%)',
        }}
      />
      <div
        className="absolute top-[52%] left-[30%] h-36 w-36 rounded-full blur-[18px] opacity-70"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.85) 0%, rgba(147, 51, 234, 0.35) 60%, transparent 80%)',
        }}
      />
      <div
        className="absolute bottom-[28%] right-[32%] h-32 w-32 rounded-full blur-[16px] opacity-70"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.85) 0%, rgba(37, 99, 235, 0.4) 60%, transparent 80%)',
        }}
      />

      {/* 5. Subtle Lens Flare Vignette Ring */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(3, 5, 10, 0.6) 100%)',
        }}
      />
    </div>
  )
}
