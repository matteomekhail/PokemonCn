/**
 * Source of truth for everything UI surfaces need about a registry component:
 * the install URL, the canonical usage snippet, and the editorial metadata.
 *
 * The list order is the order shown in the catalogue — keep it deliberate.
 */

export type ComponentMeta = {
  slug: string
  name: string
  ex: string
  spec: "registry:ui" | "registry:lib"
  install: string
  usage: string
}

const REGISTRY_ORIGIN = "https://pokemoncn.dev/r"

export const COMPONENTS: ComponentMeta[] = [
  {
    slug: "area-banner",
    name: "Area Banner",
    ex: "EX·001",
    spec: "registry:ui",
    install: `${REGISTRY_ORIGIN}/area-banner.json`,
    usage: `<AreaBanner variant="wood">New Bark Town</AreaBanner>
<AreaBanner variant="forest">Ilex Forest</AreaBanner>
<AreaBanner variant="sea">Whirl Islands</AreaBanner>`,
  },
  {
    slug: "type-badge",
    name: "Type Badge",
    ex: "EX·002",
    spec: "registry:ui",
    install: `${REGISTRY_ORIGIN}/type-badge.json`,
    usage: `<TypeBadge type="fire" />
<TypeBadge type="water" scale={3} />
<TypeBadge type="electric" />`,
  },
  {
    slug: "hp-bar",
    name: "HP Bar",
    ex: "EX·003",
    spec: "registry:ui",
    install: `${REGISTRY_ORIGIN}/hp-bar.json`,
    usage: `<HpBar value={75} max={100} />
<HpBar value={28} max={100}>
  <span className="font-pixel text-[11px] text-white">28 / 100</span>
</HpBar>`,
  },
  {
    slug: "xp-bar",
    name: "XP Bar",
    ex: "EX·004",
    spec: "registry:ui",
    install: `${REGISTRY_ORIGIN}/xp-bar.json`,
    usage: `<XpBar value={45} max={100} />
<XpBar value={910} max={1000} scale={5} />`,
  },
  {
    slug: "dialogue-box",
    name: "Dialogue Box",
    ex: "EX·005",
    spec: "registry:ui",
    install: `${REGISTRY_ORIGIN}/dialogue-box.json`,
    usage: `<DialogueBox frame={0} cursor>
  <p className="font-pixel text-base text-foreground">
    A wild PIKACHU appeared!
  </p>
</DialogueBox>`,
  },
  {
    slug: "menu-list",
    name: "Menu List",
    ex: "EX·006",
    spec: "registry:ui",
    install: `${REGISTRY_ORIGIN}/menu-list.json`,
    usage: `<MenuList aria-label="Start menu">
  <MenuItem onSelect={openPokedex}>POKéDEX</MenuItem>
  <MenuItem onSelect={openParty}>POKéMON</MenuItem>
  <MenuItem onSelect={openBag}>PACK</MenuItem>
  <MenuItem disabled>SAVE</MenuItem>
</MenuList>`,
  },
  {
    slug: "status-badge",
    name: "Status Badge",
    ex: "EX·007",
    spec: "registry:ui",
    install: `${REGISTRY_ORIGIN}/status-badge.json`,
    usage: `<StatusBadge status="par" />
<StatusBadge status="frz" scale={3} />
<StatusBadge status="psn" />`,
  },
  {
    slug: "poke-ball",
    name: "Poké Ball",
    ex: "EX·008",
    spec: "registry:ui",
    install: `${REGISTRY_ORIGIN}/poke-ball.json`,
    usage: `<PokeBall variant="poke" />
<PokeBall variant="master" scale={4} />
<PokeBall variant="lure" />`,
  },
  {
    slug: "apricorn",
    name: "Apricorn",
    ex: "EX·009",
    spec: "registry:ui",
    install: `${REGISTRY_ORIGIN}/apricorn.json`,
    usage: `<Apricorn variant="red" />
<Apricorn variant="black" scale={4} />
<Apricorn variant="white" />`,
  },
  {
    slug: "stat-hexagon",
    name: "Stat Hexagon",
    ex: "EX·010",
    spec: "registry:ui",
    install: `${REGISTRY_ORIGIN}/stat-hexagon.json`,
    usage: `<StatHexagon
  stats={{ hp: 162, atk: 90, def: 87, spa: 130, spd: 120, spe: 95 }}
  showValues
/>
<StatHexagon stats={charizard} max={150} />`,
  },
  {
    slug: "gym-badge",
    name: "Gym Badge",
    ex: "EX·011",
    spec: "registry:ui",
    install: `${REGISTRY_ORIGIN}/gym-badge.json`,
    usage: `<GymBadge variant="zephyr" />
<GymBadge variant="rising" lit scale={4} />
<GymBadge variant="cascade" lit />`,
  },
]

export function getComponent(slug: string): ComponentMeta | undefined {
  return COMPONENTS.find((c) => c.slug === slug)
}

export function getNeighbours(slug: string) {
  const i = COMPONENTS.findIndex((c) => c.slug === slug)
  return {
    prev: i > 0 ? COMPONENTS[i - 1] : undefined,
    next: i >= 0 && i < COMPONENTS.length - 1 ? COMPONENTS[i + 1] : undefined,
  }
}
