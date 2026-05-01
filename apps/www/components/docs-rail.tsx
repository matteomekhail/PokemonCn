import Link from "next/link"

import { cn } from "@/lib/utils"

interface DocsRailProps {
  className?: string
}

/**
 * Right-hand rail. Shows a small homage card to upstream shadcn — useful
 * context for visitors trying to understand how PokemonCn relates.
 */
export function DocsRail({ className }: DocsRailProps) {
  return (
    <aside className={cn("sticky top-14 max-h-[calc(100vh-3.5rem)] py-8 pl-4", className)}>
      <div className="rounded-lg border border-foreground/15 bg-foreground/[0.03] p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/50">
          Built on shadcn
        </p>
        <h3 className="mt-3 text-[15px] font-medium leading-tight">
          PokemonCn is a registry, not a fork.
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-foreground/65">
          Components ship through the standard <code>shadcn add</code> pipeline. If you already
          know shadcn, you already know how to install these.
        </p>
        <Link
          href="https://ui.shadcn.com"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          ui.shadcn.com
          <span aria-hidden>↗</span>
        </Link>
      </div>
    </aside>
  )
}
