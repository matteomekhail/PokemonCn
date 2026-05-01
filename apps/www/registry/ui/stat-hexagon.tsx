import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * StatHexagon — the Gen 5 (B/W) summary-screen radar for the six base stats.
 *
 * Six axes from a centre point. HP sits at 12 o'clock; the rest go clockwise
 * — ATK (2), DEF (4), SPE (6), SPD (8), SPA (10). Four nested rings + six
 * spokes draw the lattice; a translucent gold polygon overlays the actual
 * values. Same arrangement and colour family as the B/W summary tab.
 *
 * Pure SVG, scales to any size, no asset deps. The label/value text inherits
 * `currentColor` so it picks up `text-foreground` (or any text utility) from
 * the wrapper. Override the polygon palette via `fill` / `stroke`.
 *
 *   <StatHexagon stats={{ hp: 162, atk: 90, def: 87, spa: 130, spd: 120, spe: 95 }} />
 *   <StatHexagon stats={charizard} max={150} showValues />
 */

type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe"
type StatValues = Record<StatKey, number>

// Vertex order around the hex, starting at HP (top) and going clockwise.
// `[key, angle, label]` so we keep the three pieces zipped — TS narrows each
// element to a fixed tuple, so indexed access stays defined.
const VERTICES = [
  ["hp",  -Math.PI / 2 + 0 * (Math.PI / 3), "HP"],
  ["atk", -Math.PI / 2 + 1 * (Math.PI / 3), "ATK"],
  ["def", -Math.PI / 2 + 2 * (Math.PI / 3), "DEF"],
  ["spe", -Math.PI / 2 + 3 * (Math.PI / 3), "SPE"],
  ["spd", -Math.PI / 2 + 4 * (Math.PI / 3), "SPD"],
  ["spa", -Math.PI / 2 + 5 * (Math.PI / 3), "SPA"],
] as const satisfies ReadonlyArray<readonly [StatKey, number, string]>

// In-game Gen 5 stat-radar palette — gold polygon over cool grid.
const DEFAULT_FILL = "#F0C040"
const DEFAULT_STROKE = "#FFD83A"

interface StatHexagonProps extends Omit<React.SVGAttributes<SVGSVGElement>, "fill" | "stroke"> {
  /** Six base stats. Each value is clamped to [0, max]. */
  stats: StatValues
  /** Normalisation ceiling. Default 255 — the in-game base-stat cap. */
  max?: number
  /** Square render size in px. Default 240. */
  size?: number
  /** Show axis labels (HP/ATK/DEF/…). Default true. */
  showLabels?: boolean
  /** Show numeric values stacked below each label. Default false. */
  showValues?: boolean
  /** Polygon fill colour. Any CSS colour. */
  fill?: string
  /** Polygon stroke + vertex-dot colour. */
  stroke?: string
}

function StatHexagon({
  className,
  stats,
  max = 255,
  size = 240,
  showLabels = true,
  showValues = false,
  fill = DEFAULT_FILL,
  stroke = DEFAULT_STROKE,
  ...props
}: StatHexagonProps) {
  // Reserve outer padding for labels (and a bit more if values are stacked).
  const pad = showLabels ? (showValues ? 36 : 26) : 8
  const cx = size / 2
  const cy = size / 2
  const r = (size - pad * 2) / 2

  const point = (angle: number, dist: number) =>
    [cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist] as const

  const ringPoints = (dist: number) =>
    VERTICES.map(([, a]) => point(a, dist).join(",")).join(" ")

  const fillPoints = VERTICES.map(([key, a]) => {
    const v = stats[key] ?? 0
    const ratio = Math.max(0, Math.min(1, max > 0 ? v / max : 0))
    return point(a, r * ratio)
  })

  return (
    <svg
      data-slot="stat-hexagon"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Stat hexagon"
      className={cn("inline-block text-foreground", className)}
      {...props}
    >
      {/* Grid rings — outer ring is more present than inner divisions. */}
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <polygon
          key={t}
          points={ringPoints(r * t)}
          fill="none"
          stroke="currentColor"
          strokeOpacity={t === 1 ? 0.55 : 0.18}
          strokeWidth={t === 1 ? 1.5 : 1}
        />
      ))}

      {/* Spokes from centre to each outer vertex. */}
      {VERTICES.map(([key, a]) => {
        const [x, y] = point(a, r)
        return (
          <line
            key={key}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="currentColor"
            strokeOpacity={0.18}
            strokeWidth={1}
          />
        )
      })}

      {/* Stat polygon — translucent fill, crisp stroke, dot at each vertex. */}
      <polygon
        points={fillPoints.map((p) => p.join(",")).join(" ")}
        fill={fill}
        fillOpacity={0.5}
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {fillPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill={stroke} />
      ))}

      {/* Axis labels — sit just outside the outer ring; values stack below. */}
      {showLabels &&
        VERTICES.map(([key, a, label]) => {
          const [lx, ly] = point(a, r + (showValues ? 18 : 14))
          return (
            <text
              key={key}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="currentColor"
              fontSize={10}
              fontWeight={600}
              letterSpacing="0.14em"
              style={{ fontFamily: "var(--font-mono, ui-monospace, monospace)" }}
            >
              <tspan opacity={0.7}>{label}</tspan>
              {showValues ? (
                <tspan x={lx} dy="1.1em" fontWeight={500} opacity={0.95}>
                  {stats[key] ?? 0}
                </tspan>
              ) : null}
            </text>
          )
        })}
    </svg>
  )
}

export { StatHexagon }
export type { StatHexagonProps, StatKey, StatValues }
