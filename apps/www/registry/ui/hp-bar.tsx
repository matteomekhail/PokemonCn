import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * HpBar — the HG/SS battle HP gauge.
 *
 * Same `<AreaBanner>` pattern: the bar silhouette is the pixel-perfect part,
 * children render unmodified on top so consumers can drop in any label they
 * want (HP, current/max, MP — anything goes) and keep it selectable.
 *
 * Colour tiers come straight from `pret/pokeheartgold:files/a/0/0/8`
 * member 0x47 (battle HP/EXP gauge palette):
 *   • full   — green   #18C020 / #009000  (ratio ≥ 0.5)
 *   • mid    — yellow  #F8B000 / #B06808  (0.2 ≤ ratio < 0.5)
 *   • critical — red   #F85828 / #A83038  (ratio < 0.2)
 *
 * The gauge is 64×8 px native, with 1px chamfered corners (matching how the
 * left/right caps are drawn from tile 0x00 and 0x1d in `battle_hp_bar_data.h`).
 * Pass `scale` to grow it; the SVG stays crisp at any zoom via `crispEdges`.
 */

const NATIVE_W = 64
const NATIVE_H = 8

// [light, dark] per tier — sampled from the master HP-bar palette.
const TIERS = {
  full:     ["#18C020", "#009000"],
  mid:      ["#F8B000", "#B06808"],
  critical: ["#F85828", "#A83038"],
} as const

const INK = "#484848"     // index 14 of f071 — gauge frame
const TRACK = "#707070"   // index 1 of f071 — empty track behind the fill

type Tier = keyof typeof TIERS

function tierFor(ratio: number): Tier {
  if (ratio >= 0.5) return "full"
  if (ratio >= 0.2) return "mid"
  return "critical"
}

interface HpBarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Current HP. Clamped to [0, max]. */
  value: number
  /** Maximum HP. Defaults to 100. */
  max?: number
  /** Display scale — 1× is the native 64×8 sprite. Default 4×. */
  scale?: number
  /** Force a tier instead of deriving it from value/max. */
  tier?: Tier
}

function HpBar({
  className,
  value,
  max = 100,
  scale = 4,
  tier: forcedTier,
  children,
  style,
  ...props
}: HpBarProps) {
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0))
  const tier = forcedTier ?? tierFor(ratio)
  const [light, dark] = TIERS[tier]
  // Track interior runs from x=2 to x=62 (60px wide), so 1px ink + 1px chamfer
  // on each side. Fill width snaps to integer pixels for a crisper edge.
  const fillW = Math.round(ratio * 60)

  return (
    <span
      data-slot="hp-bar"
      data-tier={tier}
      className={cn("relative inline-flex items-center align-middle leading-none", className)}
      style={{
        width: NATIVE_W * scale,
        height: NATIVE_H * scale,
        ...style,
      }}
      {...props}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${NATIVE_W} ${NATIVE_H}`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="pointer-events-none absolute inset-0 block h-full w-full"
      >
        {/* Frame — chamfered pill: 1px corner cuts on each end, ink border. */}
        <rect x="1" y="0" width={NATIVE_W - 2} height="1" fill={INK} />
        <rect x="1" y={NATIVE_H - 1} width={NATIVE_W - 2} height="1" fill={INK} />
        <rect x="0" y="1" width="1" height={NATIVE_H - 2} fill={INK} />
        <rect x={NATIVE_W - 1} y="1" width="1" height={NATIVE_H - 2} fill={INK} />

        {/* Empty track (behind the fill) — keeps a visible groove when the
            bar is partially or fully drained. */}
        <rect x="2" y="1" width={NATIVE_W - 4} height={NATIVE_H - 2} fill={TRACK} />

        {/* Fill — top half lighter, bottom half darker, segmented to integer
            pixels so the leading edge stays crisp. */}
        {fillW > 0 ? (
          <>
            <rect x="2" y="1" width={fillW} height={3} fill={light} />
            <rect x="2" y="4" width={fillW} height={3} fill={dark} />
          </>
        ) : null}
      </svg>

      {/* Label — sits above the gauge, fully selectable. */}
      <span className="relative z-10 flex h-full w-full items-center justify-center px-[8%]">
        {children}
      </span>
    </span>
  )
}

export { HpBar, TIERS as HP_TIERS }
export type { HpBarProps }
