import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * XpBar — the HG/SS experience bar.
 *
 * Same anatomy as `<HpBar>` but a single colour tier — the iconic XP blue —
 * and a thinner gauge by default since the experience strip in HG/SS sits
 * below the HP bar at half the height.
 *
 * Colours sampled from the same `pret/pokeheartgold:files/a/0/0/8` member
 * 0x47 palette — index 12 (#4890F8) for the lighter top stripe and index 11
 * (#3060D8) for the darker bottom stripe.
 */

const NATIVE_W = 64
const NATIVE_H = 4

const INK = "#484848"
const TRACK = "#707070"
const XP_LIGHT = "#4890F8"
const XP_DARK = "#3060D8"

interface XpBarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Current XP within the level. Clamped to [0, max]. */
  value: number
  /** XP needed for the next level. Defaults to 100. */
  max?: number
  /** Display scale — 1× is the native 64×4 sprite. Default 4×. */
  scale?: number
}

function XpBar({
  className,
  value,
  max = 100,
  scale = 4,
  children,
  style,
  ...props
}: XpBarProps) {
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0))
  const fillW = Math.round(ratio * (NATIVE_W - 4))

  return (
    <span
      data-slot="xp-bar"
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
        {/* Frame — same chamfer trick as HpBar but at half the height. */}
        <rect x="1" y="0" width={NATIVE_W - 2} height="1" fill={INK} />
        <rect x="1" y={NATIVE_H - 1} width={NATIVE_W - 2} height="1" fill={INK} />
        <rect x="0" y="1" width="1" height={NATIVE_H - 2} fill={INK} />
        <rect x={NATIVE_W - 1} y="1" width="1" height={NATIVE_H - 2} fill={INK} />
        {/* Empty groove. */}
        <rect x="2" y="1" width={NATIVE_W - 4} height={NATIVE_H - 2} fill={TRACK} />
        {/* Fill — 1px lighter, 1px darker for the embossed feel. */}
        {fillW > 0 ? (
          <>
            <rect x="2" y="1" width={fillW} height="1" fill={XP_LIGHT} />
            <rect x="2" y="2" width={fillW} height="1" fill={XP_DARK} />
          </>
        ) : null}
      </svg>

      <span className="relative z-10 flex h-full w-full items-center justify-center px-[8%]">
        {children}
      </span>
    </span>
  )
}

export { XpBar }
export type { XpBarProps }
