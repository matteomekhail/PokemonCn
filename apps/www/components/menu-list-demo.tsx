"use client"

import * as React from "react"

import { MenuList, MenuItem } from "@/registry/ui/menu-list"

/**
 * Stand-alone client island for the MenuList preview — kept here so the rest
 * of `previews.tsx` can stay server-renderable.
 */
export function MenuListDemo() {
  const [pickedStart, setPickedStart] = React.useState<string | null>(null)
  const [pickedBattle, setPickedBattle] = React.useState<string | null>(null)
  return (
    <div className="flex w-full flex-col items-start gap-8 sm:flex-row sm:gap-10">
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/55">
          Start menu
        </p>
        <MenuList aria-label="Start menu" defaultValue={1}>
          <MenuItem onSelect={() => setPickedStart("Pokédex")}>POKéDEX</MenuItem>
          <MenuItem onSelect={() => setPickedStart("Pokémon")}>POKéMON</MenuItem>
          <MenuItem onSelect={() => setPickedStart("Pack")}>PACK</MenuItem>
          <MenuItem onSelect={() => setPickedStart("Trainer Card")}>
            TRAINER CARD
          </MenuItem>
          <MenuItem onSelect={() => setPickedStart("Save")}>SAVE</MenuItem>
          <MenuItem disabled>OPTIONS</MenuItem>
        </MenuList>
        <p className="font-mono text-[11px] text-foreground/55">
          Picked: <span className="text-foreground/80">{pickedStart ?? "—"}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/55">
          Battle menu
        </p>
        <MenuList aria-label="Battle menu" className="min-w-[140px]">
          <MenuItem onSelect={() => setPickedBattle("Fight")}>FIGHT</MenuItem>
          <MenuItem onSelect={() => setPickedBattle("Pokémon")}>PKMN</MenuItem>
          <MenuItem onSelect={() => setPickedBattle("Pack")}>PACK</MenuItem>
          <MenuItem onSelect={() => setPickedBattle("Run")}>RUN</MenuItem>
        </MenuList>
        <p className="font-mono text-[11px] text-foreground/55">
          Picked: <span className="text-foreground/80">{pickedBattle ?? "—"}</span>
        </p>
      </div>
    </div>
  )
}
