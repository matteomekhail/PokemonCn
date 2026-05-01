"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { COMPONENTS } from "@/lib/registry-meta"

const SECTIONS = [{ href: "/components", label: "Components" }] as const

export function DocsSidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  return (
    <aside
      className={cn(
        "sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-4",
        className,
      )}
    >
      <NavGroup label="Sections">
        {SECTIONS.map((s) => (
          <NavLink
            key={s.href}
            href={s.href}
            label={s.label}
            active={pathname === s.href}
          />
        ))}
      </NavGroup>

      <NavGroup label="Components" className="mt-8">
        {COMPONENTS.map((c) => (
          <NavLink
            key={c.slug}
            href={`/components/${c.slug}`}
            label={c.name}
            active={pathname === `/components/${c.slug}`}
          />
        ))}
      </NavGroup>
    </aside>
  )
}

function NavGroup({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/45">
        {label}
      </p>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  )
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active?: boolean
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "block rounded-md px-3 py-1.5 text-sm transition-colors",
          active
            ? "bg-foreground/[0.07] font-medium text-foreground"
            : "text-foreground/65 hover:bg-foreground/[0.04] hover:text-foreground",
        )}
      >
        {label}
      </Link>
    </li>
  )
}
