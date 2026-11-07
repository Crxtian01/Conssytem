'use client'

type MaterialKind =
  | 'brick'
  | 'cinder_block'
  | 'cement_bag'
  | 'steel_beam'
  | 'timber_plank'
  | 'rebar'
  | 'hard_hat'
  | 'safety_cone'
  | 'hex_nut'
  | 'pvc_pipe'
  | 'spirit_level'
  | 'tile'

interface ScatteredItem {
  kind: MaterialKind
  top: string
  left: string
  size: number
  rotate: number
  duration: number
  delay: number
  opacity?: number
}

const SCATTERED_ITEMS: ScatteredItem[] = [
  // Top row scatter
  { kind: 'brick', top: '5%', left: '19%', size: 46, rotate: -16, duration: 9, delay: 0 },
  { kind: 'hard_hat', top: '7%', left: '38%', size: 48, rotate: 12, duration: 11, delay: 1.5 },
  { kind: 'steel_beam', top: '4%', left: '58%', size: 54, rotate: -22, duration: 10, delay: 0.8 },
  { kind: 'cement_bag', top: '8%', left: '78%', size: 50, rotate: 14, duration: 12, delay: 2.1 },
  { kind: 'hex_nut', top: '6%', left: '93%', size: 34, rotate: 28, duration: 8, delay: 0.4 },

  // Upper-mid row scatter
  { kind: 'cinder_block', top: '22%', left: '24%', size: 50, rotate: 18, duration: 11, delay: 1.2 },
  { kind: 'timber_plank', top: '19%', left: '48%', size: 56, rotate: -14, duration: 10, delay: 2.6 },
  { kind: 'safety_cone', top: '24%', left: '68%', size: 44, rotate: -10, duration: 9, delay: 0.7 },
  { kind: 'rebar', top: '21%', left: '88%', size: 52, rotate: 32, duration: 12, delay: 1.9 },
  { kind: 'hex_nut', top: '28%', left: '12%', size: 32, rotate: -25, duration: 8, delay: 2.3 },

  // Center row scatter
  { kind: 'cement_bag', top: '40%', left: '18%', size: 48, rotate: -12, duration: 10, delay: 0.9 },
  { kind: 'brick', top: '38%', left: '35%', size: 44, rotate: 24, duration: 9, delay: 1.7 },
  { kind: 'pvc_pipe', top: '42%', left: '55%', size: 50, rotate: -28, duration: 11, delay: 0.3 },
  { kind: 'cinder_block', top: '39%', left: '75%', size: 48, rotate: -15, duration: 10, delay: 2.4 },
  { kind: 'spirit_level', top: '45%', left: '92%', size: 52, rotate: 19, duration: 9, delay: 1.1 },

  // Lower-mid row scatter
  { kind: 'steel_beam', top: '60%', left: '22%', size: 52, rotate: 20, duration: 11, delay: 1.4 },
  { kind: 'tile', top: '58%', left: '43%', size: 44, rotate: -18, duration: 9, delay: 0.5 },
  { kind: 'hard_hat', top: '62%', left: '64%', size: 46, rotate: -12, duration: 10, delay: 2.2 },
  { kind: 'brick', top: '59%', left: '83%', size: 46, rotate: 15, duration: 8, delay: 1.0 },
  { kind: 'timber_plank', top: '68%', left: '10%', size: 50, rotate: 26, duration: 12, delay: 0.2 },

  // Bottom row scatter
  { kind: 'safety_cone', top: '80%', left: '20%', size: 44, rotate: 14, duration: 9, delay: 1.8 },
  { kind: 'rebar', top: '83%', left: '39%', size: 52, rotate: -24, duration: 11, delay: 0.6 },
  { kind: 'cement_bag', top: '78%', left: '59%', size: 50, rotate: 16, duration: 10, delay: 2.0 },
  { kind: 'cinder_block', top: '84%', left: '77%', size: 48, rotate: -19, duration: 12, delay: 1.3 },
  { kind: 'spirit_level', top: '82%', left: '91%', size: 48, rotate: -14, duration: 9, delay: 0.4 },
]

function MaterialSvg({ kind }: { kind: MaterialKind }) {
  switch (kind) {
    case 'brick':
      return (
        <svg viewBox="0 0 64 44" className="h-full w-full drop-shadow-sm">
          {/* 3D Clay Brick */}
          <polygon points="8,16 44,6 58,14 22,24" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
          <polygon points="8,16 22,24 22,38 8,30" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
          <polygon points="22,24 58,14 58,28 22,38" fill="#b91c1c" stroke="#991b1b" strokeWidth="1.5" />
          {/* 3 core holes on top */}
          <ellipse cx="22" cy="16" rx="3.2" ry="1.8" fill="#7f1d1d" />
          <ellipse cx="33" cy="13" rx="3.2" ry="1.8" fill="#7f1d1d" />
          <ellipse cx="44" cy="10" rx="3.2" ry="1.8" fill="#7f1d1d" />
        </svg>
      )

    case 'cinder_block':
      return (
        <svg viewBox="0 0 64 46" className="h-full w-full drop-shadow-sm">
          {/* Concrete Hollow Block (CHB) */}
          <polygon points="6,16 42,6 58,15 22,25" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
          <polygon points="6,16 22,25 22,41 6,32" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
          <polygon points="22,25 58,15 58,31 22,41" fill="#64748b" stroke="#475569" strokeWidth="1.5" />
          {/* Hollow cells */}
          <polygon points="15,15 26,12 32,15 21,18" fill="#334155" />
          <polygon points="31,11 42,8 48,11 37,14" fill="#334155" />
        </svg>
      )

    case 'cement_bag':
      return (
        <svg viewBox="0 0 56 64" className="h-full w-full drop-shadow-sm">
          {/* 40kg Portland Cement Bag */}
          <rect x="10" y="8" width="36" height="48" rx="5" fill="#d6d3d1" stroke="#57534e" strokeWidth="1.6" />
          <rect x="10" y="22" width="36" height="18" fill="#f59e0b" />
          <line x1="14" y1="12" x2="42" y2="12" stroke="#78716c" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="14" y1="52" x2="42" y2="52" stroke="#78716c" strokeWidth="1.5" strokeDasharray="3 2" />
          <text x="28" y="34" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#78350f">
            40KG
          </text>
        </svg>
      )

    case 'steel_beam':
      return (
        <svg viewBox="0 0 68 44" className="h-full w-full drop-shadow-sm">
          {/* Structural Steel I-Beam */}
          <polygon points="6,12 46,4 62,10 22,18" fill="#60a5fa" stroke="#1e3a8a" strokeWidth="1.5" />
          <polygon points="20,17 48,11 48,27 20,33" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.5" />
          <polygon points="6,28 46,20 62,26 22,34" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1.5" />
          <polygon points="6,12 22,18 22,21 16,20 16,29 22,31 22,34 6,28 6,25 12,26 12,17 6,15" fill="#93c5fd" stroke="#1e3a8a" strokeWidth="1.4" />
        </svg>
      )

    case 'timber_plank':
      return (
        <svg viewBox="0 0 68 36" className="h-full w-full drop-shadow-sm">
          {/* Wood / Timber Lumber Board */}
          <polygon points="4,16 50,6 64,12 18,22" fill="#f59e0b" stroke="#92400e" strokeWidth="1.5" />
          <polygon points="4,16 18,22 18,30 4,24" fill="#d97706" stroke="#92400e" strokeWidth="1.5" />
          <polygon points="18,22 64,12 64,20 18,30" fill="#b45309" stroke="#92400e" strokeWidth="1.5" />
          <line x1="16" y1="15" x2="48" y2="8" stroke="#92400e" strokeWidth="1" strokeOpacity="0.6" />
          <line x1="22" y1="18" x2="54" y2="11" stroke="#92400e" strokeWidth="1" strokeOpacity="0.6" />
        </svg>
      )

    case 'rebar':
      return (
        <svg viewBox="0 0 64 40" className="h-full w-full drop-shadow-sm">
          {/* Deformed Steel Rebar Bundle */}
          <line x1="6" y1="28" x2="56" y2="10" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
          <line x1="10" y1="34" x2="60" y2="16" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
          <line x1="6" y1="20" x2="54" y2="4" stroke="#334155" strokeWidth="4.5" strokeLinecap="round" />
          {/* Rib marks */}
          <line x1="18" y1="22" x2="20" y2="27" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="28" y1="18" x2="30" y2="23" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="38" y1="14" x2="40" y2="19" stroke="#cbd5e1" strokeWidth="1.5" />
        </svg>
      )

    case 'hard_hat':
      return (
        <svg viewBox="0 0 60 44" className="h-full w-full drop-shadow-sm">
          {/* Engineer Safety Hard Hat */}
          <path d="M10 28 C10 13, 50 13, 50 28 Z" fill="#facc15" stroke="#a16207" strokeWidth="1.6" />
          <path d="M25 14 L35 14 L37 28 L23 28 Z" fill="#eab308" stroke="#a16207" strokeWidth="1.2" />
          <path d="M5 28 Q30 33 55 28 L52 32 Q30 36 8 32 Z" fill="#f59e0b" stroke="#a16207" strokeWidth="1.5" />
        </svg>
      )

    case 'safety_cone':
      return (
        <svg viewBox="0 0 52 56" className="h-full w-full drop-shadow-sm">
          {/* Orange Traffic / Site Safety Cone */}
          <polygon points="8,46 44,46 48,50 4,50" fill="#ea580c" stroke="#9a3412" strokeWidth="1.5" />
          <polygon points="26,8 40,46 12,46" fill="#f97316" stroke="#9a3412" strokeWidth="1.5" />
          <polygon points="21,21 31,21 33,27 19,27" fill="#ffffff" />
          <polygon points="17,33 35,33 37,39 15,39" fill="#ffffff" />
        </svg>
      )

    case 'hex_nut':
      return (
        <svg viewBox="0 0 48 48" className="h-full w-full drop-shadow-sm">
          {/* Steel Hex Nut & Washer */}
          <polygon
            points="24,4 42,14 42,34 24,44 6,34 6,14"
            fill="#94a3b8"
            stroke="#334155"
            strokeWidth="1.8"
          />
          <circle cx="24" cy="24" r="9" fill="#e2e8f0" stroke="#334155" strokeWidth="1.8" />
        </svg>
      )

    case 'pvc_pipe':
      return (
        <svg viewBox="0 0 64 40" className="h-full w-full drop-shadow-sm">
          {/* Blue Water / Conduit PVC Pipe */}
          <path
            d="M10 22 L48 10 A6 9 0 0 1 52 26 L14 38 Z"
            fill="#38bdf8"
            stroke="#0369a1"
            strokeWidth="1.5"
          />
          <ellipse cx="12" cy="30" rx="4.5" ry="8" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
          <ellipse cx="12" cy="30" rx="2.5" ry="5" fill="#0c4a6e" />
        </svg>
      )

    case 'spirit_level':
      return (
        <svg viewBox="0 0 68 32" className="h-full w-full drop-shadow-sm">
          {/* Carpenter Spirit Level */}
          <rect
            x="4"
            y="8"
            width="60"
            height="16"
            rx="3"
            fill="#fbbf24"
            stroke="#92400e"
            strokeWidth="1.5"
          />
          <rect x="27" y="10" width="14" height="12" rx="2" fill="#d9f99d" stroke="#4d7c0f" strokeWidth="1.2" />
          <circle cx="34" cy="16" r="2.5" fill="#84cc16" />
          <rect x="10" y="12" width="10" height="8" rx="1.5" fill="#fef3c7" stroke="#92400e" strokeWidth="1" />
          <rect x="48" y="12" width="10" height="8" rx="1.5" fill="#fef3c7" stroke="#92400e" strokeWidth="1" />
        </svg>
      )

    case 'tile':
      return (
        <svg viewBox="0 0 56 44" className="h-full w-full drop-shadow-sm">
          {/* Stacked Ceramic Tiles */}
          <polygon points="28,12 52,24 28,36 4,24" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
          <polygon points="28,6 52,18 28,30 4,18" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
          <line x1="16" y1="12" x2="40" y2="24" stroke="#94a3b8" strokeWidth="1" />
          <line x1="40" y1="12" x2="16" y2="24" stroke="#94a3b8" strokeWidth="1" />
        </svg>
      )
  }
}

export default function ScatteredMaterialsBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="construction-blueprint-grid pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Cursor-following liquid refraction spotlight */}
      <div
        className="fixed inset-0 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(560px circle at var(--lx, 50%) var(--ly, 30%), rgba(255,255,255,0.28), rgba(217,119,6,0.14) 45%, transparent 75%)',
        }}
      />

      {/* Soft ambient color glow orbs */}
      <div
        className="liquid-orb absolute -top-24 -left-20 h-[28rem] w-[28rem] rounded-full opacity-45 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(217,119,6,0.38) 0%, rgba(180,83,9,0.16) 55%, transparent 75%)',
        }}
      />
      <div
        className="liquid-orb absolute top-[12%] right-[-6%] h-[30rem] w-[30rem] rounded-full opacity-45 blur-3xl"
        style={{
          animationDelay: '-5s',
          background:
            'radial-gradient(circle, rgba(14,116,144,0.35) 0%, rgba(79,70,229,0.18) 55%, transparent 75%)',
        }}
      />
      <div
        className="liquid-orb absolute bottom-[-12%] left-[28%] h-[30rem] w-[30rem] rounded-full opacity-45 blur-3xl"
        style={{
          animationDelay: '-10s',
          background:
            'radial-gradient(circle, rgba(194,65,12,0.32) 0%, rgba(15,118,110,0.18) 55%, transparent 75%)',
        }}
      />

      {/* Scattered Small Construction Materials Floating in the Background */}
      {SCATTERED_ITEMS.map((item, idx) => (
        <div
          key={idx}
          className="cms-float absolute select-none"
          style={{
            top: item.top,
            left: item.left,
            width: item.size,
            height: item.size,
            opacity: item.opacity ?? 0.62,
            animationDuration: `${item.duration}s`,
            animationDelay: `-${item.delay}s`,
          }}
        >
          <div
            className="h-full w-full"
            style={{
              transform: `rotate(${item.rotate}deg)`,
            }}
          >
            <MaterialSvg kind={item.kind} />
          </div>
        </div>
      ))}
    </div>
  )
}

