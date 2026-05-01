import * as React from "react"

import { cn } from "@/lib/utils"

interface PokeballProps extends React.SVGAttributes<SVGSVGElement> {
  /** Inks the upper hemisphere with the given fill instead of currentColor at 8% opacity. */
  topFill?: string
  /** Stroke width — defaults to 1.5. */
  strokeWidth?: number
}

/**
 * A geometric pokéball mark, rendered as ink lines on parchment.
 * Used as a brand decoration, never as a UI control.
 */
export function Pokeball({
  className,
  topFill,
  strokeWidth = 1.5,
  ...props
}: PokeballProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
      className={cn("text-foreground", className)}
      {...props}
    >
      {/* Outer circle */}
      <circle cx="100" cy="100" r="98" />
      {/* Equator extensions left + right */}
      <line x1="2" y1="100" x2="48" y2="100" />
      <line x1="152" y1="100" x2="198" y2="100" />
      {/* Tinted upper hemisphere */}
      <path
        d="M 2 100 A 98 98 0 0 1 198 100 L 152 100 A 52 52 0 0 0 48 100 Z"
        fill={topFill ?? "currentColor"}
        fillOpacity={topFill ? 1 : 0.06}
        stroke="none"
      />
      {/* Center button */}
      <circle cx="100" cy="100" r="22" />
      <circle cx="100" cy="100" r="9" fill="currentColor" stroke="none" />
      <circle cx="100" cy="100" r="9" />
    </svg>
  )
}
