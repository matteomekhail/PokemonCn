import * as React from "react"

import { cn } from "@/lib/utils"

import { BANNERS, type AreaVariant } from "./area-banner-data"

/**
 * AreaBanner — the HG/SS area-name placard, as a web component.
 *
 * Pixel data lifted from `pret/pokeheartgold:files/data/gs_areawindow` and
 * composed the way `src/field/draw_map_name.c` does it (17×4 tiles, 136×32
 * px), with the NDS palette index 0 treated as transparent so the banner
 * silhouette is the actual sign shape — wooden plank for towns, leafy
 * cornice for forests, stone for caves, etc.
 *
 * The frame is rendered as inline SVG with `crispEdges`, so it stays sharp
 * at any `scale`. Children sit on top of the inner panel; the SVG is
 * `pointer-events: none` so the label stays selectable.
 */

const NATIVE_W = 136
const NATIVE_H = 32

interface AreaBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AreaVariant
  /** Display scale — 1× is the native 136×32 px sprite. Default 4×. */
  scale?: number
}

function AreaBanner({
  className,
  variant = "town",
  scale = 4,
  children,
  style,
  ...props
}: AreaBannerProps) {
  const { pal, border, panel } = BANNERS[variant]
  return (
    <div
      data-slot="area-banner"
      className={cn("relative inline-flex items-center justify-center", className)}
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
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        {/* Inner panel first so the decorative border sits on top of it. */}
        {panel.map((r, i) => (
          <rect
            key={`p${i}`}
            x={r[0]}
            y={r[1]}
            width={r[2]}
            height={r[3]}
            fill={pal[r[4]]}
          />
        ))}
        {border.map((r, i) => (
          <rect
            key={`b${i}`}
            x={r[0]}
            y={r[1]}
            width={r[2]}
            height={r[3]}
            fill={pal[r[4]]}
          />
        ))}
      </svg>
      <span className="relative z-10 px-[8%]">{children}</span>
    </div>
  )
}

export { AreaBanner }
export type { AreaBannerProps, AreaVariant }
