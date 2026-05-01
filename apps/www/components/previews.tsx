import * as React from "react"
import { AreaBanner } from "@/registry/ui/area-banner"
import { TypeBadge, type PokemonType } from "@/registry/ui/type-badge"
import { HpBar } from "@/registry/ui/hp-bar"
import { XpBar } from "@/registry/ui/xp-bar"
import { DialogueBox, type FrameId } from "@/registry/ui/dialogue-box"
import { StatusBadge, type StatusKind } from "@/registry/ui/status-badge"
import { PokeBall } from "@/registry/ui/poke-ball"
import type { BallVariant } from "@/registry/ui/poke-ball-data"
import { Apricorn } from "@/registry/ui/apricorn"
import type { ApricornVariant } from "@/registry/ui/apricorn-data"
import { StatHexagon, type StatValues } from "@/registry/ui/stat-hexagon"
import { GymBadge } from "@/registry/ui/gym-badge"
import type { GymBadgeVariant } from "@/registry/ui/gym-badge-data"
import { MenuListDemo } from "./menu-list-demo"

/**
 * Each preview is a focused, deliberate showcase of a single component —
 * NOT a kitchen sink. They render in /components and /components/[slug].
 */
export const PREVIEWS: Record<string, React.ReactNode> = {
  "area-banner": <AreaBannerDemo />,
  "type-badge": <TypeBadgeDemo />,
  "hp-bar": <HpBarDemo />,
  "xp-bar": <XpBarDemo />,
  "dialogue-box": <DialogueBoxDemo />,
  "menu-list": <MenuListDemo />,
  "status-badge": <StatusBadgeDemo />,
  "poke-ball": <PokeBallDemo />,
  "apricorn": <ApricornDemo />,
  "stat-hexagon": <StatHexagonDemo />,
  "gym-badge": <GymBadgeDemo />,
}

function DialogueBoxDemo() {
  const samples: Array<{ frame: FrameId; line: string }> = [
    { frame: 0,  line: "A wild PIKACHU appeared!" },
    { frame: 5,  line: "PROF. ELM: I have a Pokémon for you!" },
    { frame: 4,  line: "Surge surge surge — pulled out a leaf." },
    { frame: 3,  line: "Looker: I sense a strong presence here." },
    { frame: 11, line: "Team Rocket boss: We meet again." },
    { frame: 9,  line: "It's super effective! HP dropped sharply." },
  ]
  const frameIds: FrameId[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
  return (
    <div className="flex w-full flex-col items-start gap-8">
      <div className="flex w-full max-w-2xl flex-col gap-3">
        {samples.map(({ frame, line }) => (
          <DialogueBox key={frame} frame={frame} cursor className="w-full">
            <p className="font-pixel text-base leading-snug">{line}</p>
          </DialogueBox>
        ))}
      </div>
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {frameIds.map((id) => (
          <DialogueBox key={id} frame={id} className="w-full">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] opacity-75">
              frame={id}
            </p>
          </DialogueBox>
        ))}
      </div>
    </div>
  )
}

function HpBarDemo() {
  const rows: Array<{ label: string; value: number; max: number }> = [
    { label: "Full HP",       value: 80,  max: 100 },
    { label: "Half HP",       value: 50,  max: 100 },
    { label: "Warning band",  value: 28,  max: 100 },
    { label: "Critical",      value: 8,   max: 100 },
    { label: "Drained",       value: 0,   max: 100 },
  ]
  return (
    <div className="flex w-full flex-col items-start gap-5">
      {rows.map((r) => (
        <div key={r.label} className="flex w-full items-center gap-4">
          <span className="w-28 shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/55">
            {r.label}
          </span>
          <HpBar value={r.value} max={r.max} scale={3} />
          <span className="font-mono text-[12px] text-foreground/85">
            {r.value} / {r.max}
          </span>
        </div>
      ))}
      <div className="mt-2 flex w-full flex-wrap items-center gap-3">
        <HpBar value={62} max={100} scale={1} />
        <HpBar value={62} max={100} scale={2} />
        <HpBar value={62} max={100} scale={3} />
        <HpBar value={62} max={100} scale={4} />
      </div>
    </div>
  )
}

function XpBarDemo() {
  return (
    <div className="flex w-full flex-col items-start gap-5">
      {[
        { label: "Empty",          value: 0  },
        { label: "Mid level",      value: 45 },
        { label: "About to level", value: 94 },
      ].map((r) => (
        <div key={r.label} className="flex w-full items-center gap-4">
          <span className="w-28 shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/55">
            {r.label}
          </span>
          <XpBar value={r.value} max={100} scale={3} />
          <span className="font-mono text-[12px] text-foreground/85">
            {r.value} / 100
          </span>
        </div>
      ))}
      <div className="mt-2 flex w-full flex-wrap items-center gap-3">
        <XpBar value={62} max={100} scale={2} />
        <XpBar value={62} max={100} scale={3} />
        <XpBar value={62} max={100} scale={4} />
      </div>
    </div>
  )
}

function TypeBadgeDemo() {
  const types: Array<{ type: PokemonType; label: string; ink?: boolean }> = [
    { type: "normal",   label: "NORMAL",  ink: true },
    { type: "fighting", label: "FIGHT" },
    { type: "flying",   label: "FLYING",  ink: true },
    { type: "poison",   label: "POISON" },
    { type: "ground",   label: "GROUND",  ink: true },
    { type: "rock",     label: "ROCK",    ink: true },
    { type: "bug",      label: "BUG",     ink: true },
    { type: "ghost",    label: "GHOST" },
    { type: "steel",    label: "STEEL",   ink: true },
    { type: "mystery",  label: "???" },
    { type: "fire",     label: "FIRE" },
    { type: "water",    label: "WATER" },
    { type: "grass",    label: "GRASS" },
    { type: "electric", label: "ELECTR", ink: true },
    { type: "psychic",  label: "PSYCHC" },
    { type: "ice",      label: "ICE",     ink: true },
    { type: "dragon",   label: "DRAGON" },
    { type: "dark",     label: "DARK" },
  ]
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <div className="grid w-full grid-cols-3 gap-x-6 gap-y-4 sm:grid-cols-4 xl:grid-cols-6">
        {types.map(({ type, label, ink }) => (
          <figure key={type} className="flex flex-col items-center gap-2">
            <TypeBadge type={type} scale={3}>
              <span
                className="font-pixel text-[11px] font-bold uppercase tracking-wider"
                style={{
                  color: ink ? "#1F1B2E" : "#FFFFFF",
                  textShadow: ink
                    ? "0 1px 0 rgba(255,255,255,0.4)"
                    : "0 1px 0 rgba(0,0,0,0.55)",
                }}
              >
                {label}
              </span>
            </TypeBadge>
            <figcaption className="font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/45">
              {type}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

/**
 * Showcase grid for AreaBanner — every variant once, equal scale, the
 * representative HG/SS location it appears for in-game, and the variant
 * name surfaced as a usage hint underneath.
 */
function AreaBannerDemo() {
  const items: ReadonlyArray<{
    variant: React.ComponentProps<typeof AreaBanner>["variant"]
    label: string
    text: "ink" | "white"
  }> = [
    { variant: "town", label: "Cherrygrove City", text: "ink" },
    { variant: "wood", label: "New Bark Town", text: "ink" },
    { variant: "beach", label: "Olivine City", text: "ink" },
    { variant: "cave", label: "Union Cave", text: "white" },
    { variant: "forest", label: "Ilex Forest", text: "white" },
    { variant: "sea", label: "Whirl Islands", text: "white" },
    { variant: "pond", label: "Slowpoke Well", text: "white" },
    { variant: "ice", label: "Ice Path", text: "ink" },
    { variant: "city", label: "Goldenrod City", text: "ink" },
  ]
  return (
    <div className="grid w-full grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <figure key={item.variant} className="flex flex-col items-center gap-2.5">
          <AreaBanner variant={item.variant} scale={2}>
            <span
              className="font-pixel text-sm font-bold tracking-wide"
              style={{ color: item.text === "ink" ? "#1F1B2E" : "#FFFFFF" }}
            >
              {item.label}
            </span>
          </AreaBanner>
          <figcaption className="font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/45">
            variant=&quot;{item.variant}&quot;
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

function StatusBadgeDemo() {
  const all: ReadonlyArray<{ status: StatusKind; label: string }> = [
    { status: "par", label: "Paralysis" },
    { status: "frz", label: "Freeze" },
    { status: "slp", label: "Sleep" },
    { status: "psn", label: "Poison" },
    { status: "brn", label: "Burn" },
  ]
  return (
    <div className="flex w-full flex-col items-start gap-8">
      <div className="grid w-full grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 xl:grid-cols-5">
        {all.map(({ status, label }) => (
          <figure key={status} className="flex flex-col items-center gap-2">
            <StatusBadge status={status} scale={3} />
            <figcaption className="font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/45">
              {status} — {label}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="flex w-full flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/55">
          Scale 1 / 2 / 3 / 4 (PSN)
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {[1, 2, 3, 4].map((s) => (
            <StatusBadge key={s} status="psn" scale={s} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PokeBallDemo() {
  const standard: ReadonlyArray<BallVariant> = [
    "master", "ultra", "great", "poke",
    "safari", "net", "dive", "nest",
    "repeat", "timer", "luxury", "premier",
    "dusk", "heal", "quick", "cherish",
  ]
  const apricorn: ReadonlyArray<BallVariant> = [
    "fast", "level", "lure", "heavy", "love", "friend", "moon", "sport", "park",
  ]
  return (
    <div className="flex w-full flex-col items-start gap-8">
      <div className="flex w-full flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/55">
          Standard (Kanto/Hoenn/Sinnoh)
        </p>
        <div className="grid grid-cols-4 gap-x-5 gap-y-4 sm:grid-cols-6 xl:grid-cols-8">
          {standard.map((v) => (
            <figure key={v} className="flex flex-col items-center gap-1.5">
              <PokeBall variant={v} scale={3} />
              <figcaption className="font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/45">
                {v}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div className="flex w-full flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/55">
          Apricorn family (Johto signature) + Park
        </p>
        <div className="grid grid-cols-3 gap-x-5 gap-y-4 sm:grid-cols-5 xl:grid-cols-9">
          {apricorn.map((v) => (
            <figure key={v} className="flex flex-col items-center gap-1.5">
              <PokeBall variant={v} scale={3} />
              <figcaption className="font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/45">
                {v}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div className="flex w-full flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/55">
          Scale 1 / 2 / 4 / 6 (luxury)
        </p>
        <div className="flex flex-wrap items-end gap-4">
          {[1, 2, 4, 6].map((s) => (
            <PokeBall key={s} variant="luxury" scale={s} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ApricornDemo() {
  const all: ReadonlyArray<{ variant: ApricornVariant; pairs: string }> = [
    { variant: "red",    pairs: "→ Level" },
    { variant: "yellow", pairs: "→ Moon" },
    { variant: "blue",   pairs: "→ Lure" },
    { variant: "green",  pairs: "→ Friend" },
    { variant: "pink",   pairs: "→ Love" },
    { variant: "white",  pairs: "→ Fast" },
    { variant: "black",  pairs: "→ Heavy" },
  ]
  return (
    <div className="flex w-full flex-col items-start gap-8">
      <div className="grid w-full grid-cols-3 gap-x-5 gap-y-4 sm:grid-cols-4 xl:grid-cols-7">
        {all.map(({ variant, pairs }) => (
          <figure key={variant} className="flex flex-col items-center gap-1.5">
            <Apricorn variant={variant} scale={3} />
            <figcaption className="font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/45">
              {variant} <span className="text-foreground/30">{pairs}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="flex w-full flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/55">
          Scale 1 / 2 / 4 / 6 (red)
        </p>
        <div className="flex flex-wrap items-end gap-4">
          {[1, 2, 4, 6].map((s) => (
            <Apricorn key={s} variant="red" scale={s} />
          ))}
        </div>
      </div>
    </div>
  )
}

function GymBadgeDemo() {
  const johto: ReadonlyArray<{ variant: GymBadgeVariant; leader: string; town: string }> = [
    { variant: "zephyr",  leader: "Falkner",  town: "Violet"     },
    { variant: "hive",    leader: "Bugsy",    town: "Azalea"     },
    { variant: "plain",   leader: "Whitney",  town: "Goldenrod"  },
    { variant: "fog",     leader: "Morty",    town: "Ecruteak"   },
    { variant: "storm",   leader: "Chuck",    town: "Cianwood"   },
    { variant: "mineral", leader: "Jasmine",  town: "Olivine"    },
    { variant: "glacier", leader: "Pryce",    town: "Mahogany"   },
    { variant: "rising",  leader: "Clair",    town: "Blackthorn" },
  ]
  const kanto: ReadonlyArray<{ variant: GymBadgeVariant; leader: string; town: string }> = [
    { variant: "boulder", leader: "Brock",     town: "Pewter"    },
    { variant: "cascade", leader: "Misty",     town: "Cerulean"  },
    { variant: "thunder", leader: "Lt. Surge", town: "Vermilion" },
    { variant: "rainbow", leader: "Erika",     town: "Celadon"   },
    { variant: "soul",    leader: "Sabrina",   town: "Saffron"   },
    { variant: "marsh",   leader: "Janine",    town: "Fuchsia"   },
    { variant: "volcano", leader: "Blaine",    town: "Cinnabar"  },
    { variant: "earth",   leader: "Giovanni",  town: "Viridian"  },
  ]
  function League({
    label, badges,
  }: {
    label: string
    badges: ReadonlyArray<{ variant: GymBadgeVariant; leader: string; town: string }>
  }) {
    return (
      <div className="flex w-full flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/55">
          {label}
        </p>
        <div className="grid grid-cols-4 gap-x-5 gap-y-5 sm:grid-cols-8">
          {badges.map(({ variant, leader, town }) => (
            <figure key={variant} className="flex flex-col items-center gap-1.5">
              <span className="flex items-end gap-2">
                <GymBadge variant={variant} scale={3} />
                <GymBadge variant={variant} lit scale={3} />
              </span>
              <figcaption className="text-center font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/45">
                {variant}
                <span className="block text-foreground/30">{leader} · {town}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="flex w-full flex-col items-start gap-8">
      <League label="Johto — unlit / lit" badges={johto} />
      <League label="Kanto — unlit / lit" badges={kanto} />
      <div className="flex w-full flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/55">
          Scale 1 / 2 / 4 / 6 (rising, lit)
        </p>
        <div className="flex flex-wrap items-end gap-4">
          {[1, 2, 4, 6].map((s) => (
            <GymBadge key={s} variant="rising" lit scale={s} />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatHexagonDemo() {
  // Real base-stat lines so the silhouettes are visually distinct.
  const charizard: StatValues = { hp: 78,  atk: 84,  def: 78,  spa: 109, spd: 85,  spe: 100 }
  const sets: ReadonlyArray<{ label: string; stats: StatValues }> = [
    { label: "Charizard", stats: charizard },
    { label: "Snorlax",   stats: { hp: 160, atk: 110, def: 65,  spa: 65,  spd: 110, spe: 30  } },
    { label: "Alakazam",  stats: { hp: 55,  atk: 50,  def: 45,  spa: 135, spd: 95,  spe: 120 } },
    { label: "Steelix",   stats: { hp: 75,  atk: 85,  def: 200, spa: 55,  spd: 65,  spe: 30  } },
  ]
  return (
    <div className="flex w-full flex-col items-start gap-8">
      <div className="grid w-full grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
        {sets.map(({ label, stats }) => (
          <figure key={label} className="flex flex-col items-center gap-2">
            <StatHexagon stats={stats} max={200} showValues />
            <figcaption className="font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/45">
              {label}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="flex w-full flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/55">
          Sizes 160 / 200 / 280 (Charizard, labels off)
        </p>
        <div className="flex flex-wrap items-end gap-6">
          {[160, 200, 280].map((s) => (
            <StatHexagon
              key={s}
              size={s}
              stats={charizard}
              max={200}
              showLabels={false}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

