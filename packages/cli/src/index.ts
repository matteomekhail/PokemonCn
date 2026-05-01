/**
 * `pokemoncn` — convenience wrapper around `shadcn` that defaults the registry URL
 * to https://pokemoncn.com. Users who'd rather use the upstream CLI can simply run
 *
 *   pnpm dlx shadcn@latest add https://pokemoncn.com/r/<name>.json
 *
 * — this binary just spares the typing.
 */
import { execa } from "execa"

const REGISTRY = process.env.POKEMONCN_REGISTRY ?? "https://pokemoncn.com"

async function main() {
  const [command, ...rest] = process.argv.slice(2)

  if (!command || command === "--help" || command === "-h") {
    printHelp()
    return
  }

  if (command === "add") {
    if (rest.length === 0) {
      console.error("error: `pokemoncn add` needs at least one component name")
      process.exit(1)
    }
    const urls = rest.map((name) =>
      name.startsWith("http") ? name : `${REGISTRY}/r/${name}.json`,
    )
    await passthrough(["add", ...urls])
    return
  }

  // Anything else (init, diff, etc.) is delegated verbatim to shadcn.
  await passthrough([command, ...rest])
}

async function passthrough(args: string[]) {
  await execa("pnpm", ["dlx", "shadcn@latest", ...args], { stdio: "inherit" })
}

function printHelp() {
  console.log(`pokemoncn — Pokémon-themed components, powered by shadcn

Usage:
  pokemoncn add <name>...        Add one or more components from ${REGISTRY}
  pokemoncn add <url>            Add by full registry URL
  pokemoncn init                 Delegated to \`shadcn init\`
  pokemoncn <other>              Delegated to \`shadcn <other>\`

Env:
  POKEMONCN_REGISTRY             Override the registry origin (default: ${REGISTRY})
`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
