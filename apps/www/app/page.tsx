import Link from "next/link"
import { CopyableCommand } from "@/components/copyable-command"
import { Pokeball } from "@/components/pokeball"
import { SiteFooter } from "@/components/site-footer"

const INSTALL = "pnpm dlx shadcn@latest add https://pokemoncn.dev/r/area-banner.json"

export default function Page() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Pokeball
        aria-hidden
        strokeWidth={0.8}
        className="pointer-events-none absolute -right-40 top-10 h-[560px] w-[560px] text-foreground opacity-[0.14] [animation:var(--animate-pokeball-spin)] md:-right-24 md:top-20"
      />

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-10 md:px-10 md:pb-32 md:pt-16">
        <h1 className="max-w-3xl font-display text-[clamp(3rem,8.5vw,7rem)] leading-[0.92] tracking-[-0.025em] [animation:var(--animate-rise)] [animation-delay:80ms]">
          A shadcn registry,
          <br />
          <span className="italic text-primary">catalogued</span> by type.
        </h1>

        <div className="mt-10 [animation:var(--animate-rise)] [animation-delay:280ms]">
          <CopyableCommand command={INSTALL} className="max-w-2xl" />
        </div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/45 [animation:var(--animate-rise)] [animation-delay:360ms]">
          MIT ·{" "}
          <Link href="https://github.com/matteomekhail/PokemonCn" className="hover:text-foreground">
            github ↗
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}
