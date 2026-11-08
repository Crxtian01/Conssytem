'use client'

export default function ScatteredMaterialsBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="construction-blueprint-grid pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Cursor-following warm sandstone refraction spotlight */}
      <div
        className="fixed inset-0 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(620px circle at var(--lx, 50%) var(--ly, 30%), rgba(255, 236, 222, 0.16), rgba(204, 92, 59, 0.10) 45%, transparent 75%)',
        }}
      />

      {/* Warm Terracotta & Sandstone Ambient Studio Glow Orbs (Code XR visionOS Backdrop) */}
      <div
        className="liquid-orb absolute -top-28 -left-24 h-[32rem] w-[32rem] rounded-full opacity-55 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(204, 92, 59, 0.48) 0%, rgba(154, 52, 18, 0.18) 58%, transparent 78%)',
        }}
      />
      <div
        className="liquid-orb absolute top-[8%] right-[-8%] h-[34rem] w-[34rem] rounded-full opacity-50 blur-3xl"
        style={{
          animationDelay: '-5s',
          background:
            'radial-gradient(circle, rgba(235, 198, 172, 0.36) 0%, rgba(180, 83, 50, 0.18) 58%, transparent 78%)',
        }}
      />
      <div
        className="liquid-orb absolute bottom-[-14%] left-[26%] h-[32rem] w-[32rem] rounded-full opacity-50 blur-3xl"
        style={{
          animationDelay: '-10s',
          background:
            'radial-gradient(circle, rgba(194, 78, 46, 0.42) 0%, rgba(120, 62, 44, 0.20) 58%, transparent 78%)',
        }}
      />
    </div>
  )
}
