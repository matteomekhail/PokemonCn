# PokemonCn

Pokémon-themed component registry built in the spirit of [shadcn/ui](https://ui.shadcn.com).
Components are served as JSON at `https://pokemoncn.dev/r/<name>.json` and consumed by the
**standard** `shadcn` CLI — no fork required.

```bash
pnpm dlx shadcn@latest add https://pokemoncn.dev/r/area-banner.json
pnpm dlx shadcn@latest add https://pokemoncn.dev/r/poke-ball.json
```

There is also an optional convenience wrapper:

```bash
pnpm dlx pokemoncn add area-banner poke-ball
```

The page at `/` previews every registered component. The JSON consumed by the `shadcn` CLI is
served from `/r/<name>.json` with permissive CORS.

## Adding a new component

1. Drop a TSX file in `apps/www/registry/ui/` (or a helper in `apps/www/registry/lib/`).
2. Register it in `apps/www/registry.json` with its `dependencies` and `registryDependencies`.
3. `pnpm registry:build` to regenerate `public/r/*.json`.
4. Add a preview in `apps/www/app/page.tsx`.

## License

MIT for the registry tooling. Pokémon and Pokémon character names are trademarks of Nintendo, The Pokemon Company & Gamefreak
