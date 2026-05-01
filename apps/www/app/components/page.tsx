import type { Metadata } from "next"
import Link from "next/link"

import { COMPONENTS } from "@/lib/registry-meta"

export const metadata: Metadata = {
  title: "Components",
  description:
    "Catalogue of PokemonCn components — shadcn-compatible registry items, themed by Pokémon type.",
}

export default function ComponentsIndexPage() {
  return (
    <>
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Components</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-foreground/70">
          Standard <code className="font-mono text-[0.92em]">registry-item.json</code>. Drop the
          URL into <code className="font-mono text-[0.92em]">shadcn add</code>. Click any name to
          read the install + usage.
        </p>
      </header>

      <ul className="mt-12 grid grid-cols-1 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {COMPONENTS.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/components/${c.slug}`}
              className="block py-1.5 text-foreground/85 transition-colors hover:text-primary"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
