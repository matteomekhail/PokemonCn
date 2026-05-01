import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * DialogueBox — the HG/SS speech window.
 *
 * The 20 frame styles the player can choose under Options → Frame, sampled
 * directly from `pret/pokeheartgold:files/a/0/3/8` — NCGRs at members 2..21
 * paired with NCLRs at 26..45, decoded against the corresponding palette.
 * Each frame contributes three colours (background, border, accent) and the
 * component re-synthesizes the chassis as a single CSS box: 2px border, a
 * 1px accent stripe just inside it, body fill, slight pixel-rounded corners.
 *
 * Same pattern as `<AreaBanner>` and `<HpBar>` — the chrome is ours, the
 * children are yours: drop in any pixel-font text, link, list, anything.
 * The blinking ▼ continue cursor is opt-in via the `cursor` prop.
 */

// 20 frame styles. Each entry: [background, border, accent]. Indices match
// `Options_GetFrame()` so frame={0} is the default cream-and-grey speech box.
const FRAMES = [
  ["#F8F8F8", "#484040", "#606068"], // 0  — default cream / grey
  ["#F8F8F8", "#484040", "#606068"], // 1  — same, alt accent
  ["#F8F8F8", "#484040", "#F84868"], // 2  — pink accent
  ["#F8F8F8", "#484040", "#30C0F0"], // 3  — sky-blue accent
  ["#F8F8F8", "#484040", "#90E068"], // 4  — green accent
  ["#F8F8F8", "#484040", "#F89830"], // 5  — orange accent
  ["#F8F8F8", "#484040", "#B080D8"], // 6  — purple accent
  ["#F8B808", "#F8E860", "#F8C800"], // 7  — gold/yellow chassis
  ["#B8C8C8", "#E0E0E8", "#D0D8D8"], // 8  — pale stone
  ["#404050", "#282838", "#9898A8"], // 9  — dark slate
  ["#2088A0", "#282838", "#106070"], // 10 — deep teal
  ["#E84068", "#282838", "#B82848"], // 11 — crimson
  ["#388898", "#182858", "#F8F8F8"], // 12 — sea
  ["#C8C890", "#382820", "#C8C8E8"], // 13 — sand
  ["#F8F8F8", "#507880", "#C8F8F8"], // 14 — ice
  ["#F88000", "#484040", "#F8F8F8"], // 15 — orange chassis
  ["#F8F8F8", "#986880", "#C8B8F0"], // 16 — mauve
  ["#E0F8F8", "#2878B0", "#A8D8F0"], // 17 — pale sea
  ["#F8F8F8", "#602800", "#884010"], // 18 — wood
  ["#B0D8E8", "#70B8D8", "#281860"], // 19 — twilight
] as const

type FrameId =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19

interface DialogueBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which of the 20 in-game speech frames to render. Default 0 (cream). */
  frame?: FrameId
  /** Show the blinking ▼ "press A to continue" cursor in the bottom-right. */
  cursor?: boolean
}

/**
 * Relative luminance of a `#RRGGBB` colour, sRGB-ish. Used to pick an ink
 * colour that always reads against the frame's background — so children
 * inherit a sensible default without having to know which frame is in play.
 */
function isDarkBg(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  // Quick perceptual luminance — accurate enough to pick text colour.
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.55
}

function DialogueBox({
  className,
  frame = 0,
  cursor = false,
  children,
  style,
  ...props
}: DialogueBoxProps) {
  const [bg, border, accent] = FRAMES[frame]
  // Auto-contrast ink so default-styled children stay legible on light
  // *and* dark frames. Consumer can still override with an explicit text
  // colour on the children — `currentColor` propagates as usual.
  const ink = isDarkBg(bg) ? "#FFFFFF" : "#1F1B2E"
  return (
    <div
      data-slot="dialogue-box"
      data-frame={frame}
      className={cn(
        // Sprite-era chassis. Hard offset shadow + crisp corner radius keep
        // the box reading as pixel art even when the consumer scales the
        // type or plops it on a flat background.
        "relative inline-block max-w-full rounded-[4px] px-5 py-4",
        className,
      )}
      style={{
        background: bg,
        color: ink,
        border: `2px solid ${border}`,
        // 1px accent stripe just inside the border, then a 1px bg buffer to
        // the content. Mirrors the inner outline drawn by the game's
        // user-frame tiles (LoadUserFrameGfx2 + matching NCLR).
        boxShadow: `inset 0 0 0 1px ${accent}, 3px 3px 0 0 ${border}`,
        ...style,
      }}
      {...props}
    >
      {children}
      {cursor ? <ContinueCursor color={ink} /> : null}
    </div>
  )
}

/** Pixel-art ▼ that ticks at the canonical Pokémon dialog cadence. */
function ContinueCursor({ color }: { color: string }) {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill={color}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="pointer-events-none absolute bottom-2.5 right-3 [animation:var(--animate-dialog-blink,_dialog-blink_1.1s_step-end_infinite)]"
    >
      <rect x="0" y="0" width="10" height="2" />
      <rect x="2" y="2" width="6" height="2" />
      <rect x="4" y="4" width="2" height="2" />
    </svg>
  )
}

export { DialogueBox, FRAMES as DIALOGUE_FRAMES }
export type { DialogueBoxProps, FrameId }
