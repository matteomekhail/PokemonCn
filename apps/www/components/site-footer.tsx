import { cn } from "@/lib/utils"

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "relative z-10 mx-auto max-w-5xl border-t border-foreground/10 px-6 py-8 md:px-10",
        className,
      )}
    >
      <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-foreground/40">
        Pokémon and Pokémon character names are trademarks of Nintendo / Game Freak / The Pokémon
        Company. PokemonCn is independent open source — no affiliation, no endorsement.
      </p>
    </footer>
  )
}
