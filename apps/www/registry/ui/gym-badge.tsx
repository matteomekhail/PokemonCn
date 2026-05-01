import * as React from "react"

import { cn } from "@/lib/utils"
import { GYM_BADGES, type GymBadgeVariant } from "./gym-badge-data"

/**
 * GymBadge — every Johto + Kanto gym badge as HG/SS draws them on the trainer
 * card, pixel-perfect.
 *
 * Decoded directly from `pret/pokeheartgold` `files/a/0/4/9` (the Trainer Card
 * NARC, NARC ID 0x31). The OBJ resource table at `ov51_021E7FC4` in
 * `asm/overlay_trainer_card_main.s` selects file 0x2E=46 as the badge tile
 * bank and 0x1C=28 as the palette source — frame 0 of each badge against
 * sub-palette 2 gives the silver-cream embossed plate the trainer card itself
 * paints. We greedy-RLE the pixels into rectangles, drop palette-0
 * (NDS transparent), and render as inline `<rect>`s with crispEdges so it
 * stays sharp at any scale.
 *
 * 16 variants total — Johto (zephyr, hive, plain, fog, storm, mineral,
 * glacier, rising) plus Kanto (boulder, cascade, thunder, rainbow, soul,
 * marsh, volcano, earth). Same files the game ships with, so
 * `<GymBadge variant="rising" />` is exactly what your trainer card would
 * draw once Clair hands it over.
 */

interface GymBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Which gym badge. Defaults to `"zephyr"` — Falkner's, the first you earn. */
  variant?: GymBadgeVariant
  /**
   * Earned-state toggle. Default `false` paints the silver-cream embossed
   * silhouette HG/SS shows in empty trainer-card slots. `true` lights the
   * badge up in its canonical hue.
   */
  lit?: boolean
  /** Pixel scale multiplier — 1 = native ~22px, 2 = 44px, 3 = 66px… */
  scale?: number
}

function GymBadge({
  variant = "zephyr",
  lit = false,
  scale = 2,
  className,
  style,
  ...rest
}: GymBadgeProps) {
  const data = GYM_BADGES[variant]
  const palette = lit ? data.litPalette : data.palette
  const w = data.w * scale
  const h = data.h * scale
  return (
    <span
      {...rest}
      data-badge={variant}
      data-lit={lit ? "" : undefined}
      className={cn("inline-block", className)}
      style={{
        width: w,
        height: h,
        lineHeight: 0,
        ...style,
      }}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${data.w} ${data.h}`}
        shapeRendering="crispEdges"
        aria-hidden
        focusable={false}
        style={{ display: "block" }}
      >
        {data.rects.map(([x, y, rw, rh, p], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width={rw}
            height={rh}
            fill={palette[p - 1]}
          />
        ))}
      </svg>
    </span>
  )
}

export { GymBadge, GYM_BADGES }
export type { GymBadgeProps, GymBadgeVariant }
