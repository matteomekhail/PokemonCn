import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * TypeBadge — the HG/SS move-type chip.
 *
 * Same pattern as `<AreaBanner>`: the frame is pixel-perfect, the label is
 * a regular React child. The chip silhouette is six SVG rectangles (top
 * highlight stripe, body fill, bottom shadow, plus 1px chamfered corners)
 * positioned exactly where they sit in the original 32×16 NCGR sprite.
 *
 * The three colours per type (`highlight`, `body`, `shadow`) are sampled
 * directly from `pret/pokeheartgold:files/a/0/0/8` member 0xDD..0xF1
 * rendered against the master battle palette (member 0x4A) — see
 * `public/refs/type-badge/*.png` for the source PNGs we sampled.
 *
 * The SVG is `pointer-events: none` and `aria-hidden`, so children render
 * unmodified on top: pick your own font, weight, colour. The label stays
 * selectable, copyable, and styleable. Pass nothing for a bare chip.
 */

const NATIVE_W = 32
const NATIVE_H = 16

// [highlight (top stripe + corner), body (main fill), shadow (bottom + corner)].
const THEMES = {
  normal:   ["#D8D8C0", "#A8A878", "#705848"],
  fighting: ["#F05030", "#903028", "#484038"],
  flying:   ["#C8C0F8", "#A890F0", "#705898"],
  poison:   ["#D880B8", "#A040A0", "#483850"],
  ground:   ["#F8F878", "#E0C068", "#886830"],
  rock:     ["#E0C068", "#B8A038", "#886830"],
  bug:      ["#D8E030", "#A8B820", "#789010"],
  ghost:    ["#A890F0", "#705898", "#483850"],
  steel:    ["#D8D8C0", "#B8B8D0", "#807870"],
  mystery:  ["#484038", "#705848", "#B8B8D0"],
  fire:     ["#F8D030", "#F05030", "#903028"],
  water:    ["#98D8D8", "#6890F0", "#807870"],
  grass:    ["#C0F860", "#78C850", "#588040"],
  electric: ["#F8F878", "#F8D030", "#B8A038"],
  psychic:  ["#F8C0B0", "#F85888", "#906060"],
  ice:      ["#D0F8E8", "#98D8D8", "#9090A0"],
  dragon:   ["#D0F8E8", "#6890F0", "#98D8D8"],
  dark:     ["#A8A878", "#705848", "#484038"],
} as const satisfies Record<string, readonly [string, string, string]>

type PokemonType = keyof typeof THEMES

interface TypeBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  type: PokemonType
  /** Display scale — 1× is the native 32×16 sprite. Default 2×. */
  scale?: number
}

function TypeBadge({
  className,
  type,
  scale = 2,
  children,
  style,
  ...props
}: TypeBadgeProps) {
  const [high, body, shadow] = THEMES[type]
  return (
    <span
      data-slot="type-badge"
      data-type={type}
      className={cn("relative inline-flex items-center justify-center align-middle leading-none", className)}
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
        {/* Top highlight stripe (y=1, x=1..30 — 1px chamfered ends). */}
        <rect x="1" y="1" width="30" height="1" fill={high} />
        {/* Body fill (y=2..12, full width). */}
        <rect x="0" y="2" width="32" height="11" fill={body} />
        {/* Top corners get the highlight (y=2, x=0/31). */}
        <rect x="0" y="2" width="1" height="1" fill={high} />
        <rect x="31" y="2" width="1" height="1" fill={high} />
        {/* Bottom row body (y=13, x=1..30). */}
        <rect x="1" y="13" width="30" height="1" fill={body} />
        {/* Bottom corners get the shadow (y=13, x=0/31). */}
        <rect x="0" y="13" width="1" height="1" fill={shadow} />
        <rect x="31" y="13" width="1" height="1" fill={shadow} />
        {/* Shadow stripe (y=14, x=1..30). */}
        <rect x="1" y="14" width="30" height="1" fill={shadow} />
      </svg>
      <span className="relative z-10 px-[8%]">{children}</span>
    </span>
  )
}

export { TypeBadge, THEMES }
export type { TypeBadgeProps, PokemonType }
