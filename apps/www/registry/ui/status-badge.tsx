import * as React from "react"

import { cn } from "@/lib/utils"
import { STATUS_CHIPS, type StatusKind } from "./status-badge-data"

/**
 * StatusBadge — the HG/SS battle status condition chip.
 *
 * Same `<AreaBanner>` / `<TypeBadge>` pattern: the SVG is a letterless
 * chip silhouette decoded from `pret/pokeheartgold`
 * `src/battle/battle_hp_bar_data.h` tiles 0x29..0x37 (palette
 * `files/a/0/0/8` member 71). The 3-letter label is a regular DOM text
 * node positioned on top — copyable, selectable, translatable, with the
 * exact in-game glyph colour applied.
 *
 * Five conditions: `par` (yellow), `frz` (blue), `slp` (gray),
 * `psn` (magenta), `brn` (orange). `none` returns null — the natural
 * absence form for "this Pokémon has no status".
 */

const NATIVE_W = 24
const NATIVE_H = 8

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Which status. `"none"` returns null. */
  status: StatusKind | "none"
  /** Pixel scale multiplier — 1 = native 24×8, 2 = 48×16, etc. Default 2. */
  scale?: number
  /**
   * Override the label. Defaults to `status.toUpperCase()` (PAR, FRZ…).
   * Useful for localisation or for the toxic poison `TOX` rendering trick.
   */
  children?: React.ReactNode
}

function StatusBadge({
  status,
  scale = 2,
  className,
  style,
  children,
  ...rest
}: StatusBadgeProps) {
  if (status === "none") return null
  const data = STATUS_CHIPS[status]
  const w = data.w * scale
  const h = data.h * scale
  const label = children ?? status.toUpperCase()
  return (
    <span
      {...rest}
      data-status={status}
      role="img"
      aria-label={`Status condition: ${typeof label === "string" ? label : status.toUpperCase()}`}
      className={cn("inline-block select-text align-middle", className)}
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
      <span
        className="font-pixel font-bold uppercase"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: data.glyph,
          fontSize: 6 * scale,
          letterSpacing: 0.5 * scale,
          lineHeight: 1,
          // a hair above optical centre — matches the in-game glyph baseline,
          // which sits one pixel above the chip midline
          paddingBottom: scale,
        }}
      >
        {label}
      </span>
    </span>
  )
}

export { StatusBadge, STATUS_CHIPS, NATIVE_W, NATIVE_H }
export type { StatusBadgeProps, StatusKind }
