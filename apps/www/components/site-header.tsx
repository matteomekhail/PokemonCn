"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Github, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Pokeball } from "@/components/pokeball"

const NAV = [{ href: "/components", label: "Components" }] as const

export function SiteHeader({ className }: { className?: string }) {
  const pathname = usePathname()
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-foreground/10 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/65",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-6 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Pokeball className="h-5 w-5 text-primary" topFill="var(--color-primary)" />
          <span className="font-display text-lg tracking-tight">
            Pokémon<span className="italic text-primary">Cn</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm md:flex">
          {NAV.map((item) => {
            const active =
              pathname === item.href || (pathname?.startsWith(item.href + "/") ?? false)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors",
                  active ? "text-foreground" : "text-foreground/60 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" />
            <input
              type="search"
              placeholder="Search components..."
              className={cn(
                "h-8 w-56 rounded-md border border-foreground/15 bg-foreground/[0.03] pl-8 pr-3 text-xs",
                "placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            />
          </div>
          <Link
            href="https://github.com/matteomekhail/PokemonCn"
            aria-label="GitHub"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/65 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <Github className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}
