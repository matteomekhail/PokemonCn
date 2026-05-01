import * as React from "react"

import { cn } from "@/lib/utils"
import { APRICORNS, type ApricornVariant } from "./apricorn-data"

/**
 * Apricorn — the seven HG/SS Apricorn fruit icons.
 *
 * The Johto-only ingredient Kurt at Azalea Town turns into Apricorn balls.
 * Each variant is decoded from its own NCGR + NCLR pair under
 * `pret/pokeheartgold` `files/itemtool/itemdata/item_icon` (item IDs
 * 485–491). Inline SVG, RLE-compressed rects, no asset deps — same pipeline
 * as `<PokeBall>`.
 *
 * Pair `red` → Level Ball, `blue` → Lure Ball, `yellow` → Moon Ball,
 * `green` → Friend Ball, `pink` → Love Ball, `white` → Fast Ball,
 * `black` → Heavy Ball. (Sport Ball + Park Ball don't take Apricorns.)
 */

interface ApricornProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Which Apricorn. Defaults to `"red"`. */
  variant?: ApricornVariant
  /** Pixel scale multiplier — 1 = native ~18px, 2 = 36px… Default 2. */
  scale?: number
  /** Optional adornment rendered on top (e.g. quantity counter). */
  children?: React.ReactNode
}

function Apricorn({
  variant = "red",
  scale = 2,
  className,
  style,
  children,
  ...rest
}: ApricornProps) {
  const data = APRICORNS[variant]
  const w = data.w * scale
  const h = data.h * scale
  return (
    <span
      {...rest}
      data-apricorn={variant}
      className={cn("inline-block", className)}
      style={{ width: w, height: h, position: "relative", lineHeight: 0, ...style }}
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

export { Apricorn, APRICORNS }
export type { ApricornProps, ApricornVariant }
