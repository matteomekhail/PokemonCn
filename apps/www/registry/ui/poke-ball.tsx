import * as React from "react"

import { cn } from "@/lib/utils"
import { BALLS, type BallVariant } from "./poke-ball-data"

/**
 * PokeBall — every Poké Ball icon from HG/SS, pixel-perfect.
 *
 * Decoded directly from `pret/pokeheartgold` `files/itemtool/itemdata/item_icon`
 * — each variant pairs a 4bpp NCGR (32×32 native, ~18×18 once cropped) with its
 * own 16-colour BGR555 NCLR. We greedy-RLE the pixels into rectangles, drop
 * palette-0 (NDS transparent), and render as inline `<rect>`s with crispEdges
 * so it stays sharp at any scale.
 *
 * 25 variants total — the standard 16 plus the Apricorn balls and Park Ball
 * that Johto specifically reintroduces. Same files the game ships with, so
 * `<PokeBall variant="lure" />` is exactly what your save file would draw.
 *
 * The icon itself is `aria-hidden`. Children render as a positioned overlay
 * (`position: relative; z-index: 10`), useful for a quantity counter,
 * checkmark, or any badge you want to slap on top.
 */

interface PokeBallProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Which Poké Ball. Defaults to the basic `"poke"` ball. */
  variant?: BallVariant
  /** Pixel scale multiplier — 1 = native ~18px, 2 = 36px, 3 = 54px… */
  scale?: number
  /** Optional adornment rendered on top (e.g. a quantity counter). */
  children?: React.ReactNode
}

function PokeBall({
  variant = "poke",
  scale = 2,
  className,
  style,
  children,
  ...rest
}: PokeBallProps) {
  const data = BALLS[variant]
  const w = data.w * scale
  const h = data.h * scale
  return (
    <span
      {...rest}
      data-ball={variant}
      className={cn("inline-block", className)}
      style={{
        width: w,
        height: h,
        position: "relative",
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
        style={{ display: "block", pointerEvents: "none" }}
      >
        {data.rects.map(([x, y, rw, rh, p], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width={rw}
            height={rh}
            fill={data.palette[p - 1]}
          />
        ))}
      </svg>
      {children != null ? (
        <span
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            pointerEvents: "auto",
          }}
        >
          {children}
        </span>
      ) : null}
    </span>
  )
}

export { PokeBall, BALLS }
export type { PokeBallProps, BallVariant }
