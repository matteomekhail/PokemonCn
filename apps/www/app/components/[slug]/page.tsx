import fs from "node:fs"
import path from "node:path"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { COMPONENTS, getComponent, getNeighbours } from "@/lib/registry-meta"
import { PREVIEWS } from "@/components/previews"
import { CopyableCommand } from "@/components/copyable-command"
import { CopyableCode } from "@/components/copyable-code"

type RegistryItem = {
  name: string
  files?: Array<{ path: string; type: string; target?: string }>
}

function loadComponentSources(slug: string): Array<{ filename: string; code: string }> {
  try {
    const registryPath = path.join(process.cwd(), "registry.json")
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf8")) as {
      items: RegistryItem[]
    }
    const item = registry.items.find((i) => i.name === slug)
    if (!item?.files) return []
    return item.files.map((f) => {
      const abs = path.join(process.cwd(), f.path)
      const code = fs.readFileSync(abs, "utf8")
      return { filename: f.path.replace(/^registry\//, ""), code }
    })
  } catch {
    return []
  }
}

type Params = Promise<{ slug: string }>

export function generateStaticParams() {
  return COMPONENTS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const meta = getComponent(slug)
  if (!meta) return {}
  return {
    title: meta.name,
  }
}

export default async function ComponentDetailPage({ params }: { params: Params }) {
  const { slug } = await params
  const meta = getComponent(slug)
  if (!meta) notFound()

  const { prev, next } = getNeighbours(slug)
  const preview = PREVIEWS[slug]
  const sources = loadComponentSources(slug)

  return (
    <article>
      <header>
        <h1 className="text-4xl font-bold tracking-tight">{meta.name}</h1>
      </header>

      <Section title="Preview">
        <div className="rounded-lg border border-foreground/15 bg-foreground/[0.015] p-8 md:p-12">
          {preview}
        </div>
      </Section>

      <Section title="Installation">
        <CopyableCommand command={`pnpm dlx shadcn@latest add ${meta.install}`} />
      </Section>

      <Section title="Usage">
        <pre className="overflow-x-auto rounded-md border border-foreground/15 bg-foreground/[0.04] p-5 font-mono text-[12px] leading-relaxed text-foreground/85">
          <code>{meta.usage}</code>
        </pre>
      </Section>

      {sources.length > 0 ? (
        <Section title="Component code">
          <p className="mb-4 text-xs leading-relaxed text-foreground/55">
            Same source `shadcn add` drops into your project. Multi-file components
            ship every file separately — auto-generated data files are collapsed by
            default.
          </p>
          <div className="flex flex-col gap-3">
            {sources.map((s) => {
              const isData = /-data\.tsx?$/.test(s.filename)
              return (
                <CopyableCode
                  key={s.filename}
                  filename={s.filename}
                  code={s.code}
                  collapsed={isData}
                  maxHeight={isData ? 360 : 640}
                />
              )
            })}
          </div>
        </Section>
      ) : null}

      <nav className="mt-16 flex items-center justify-between gap-6 border-t border-foreground/10 pt-8">
        {prev ? (
          <Link
            href={`/components/${prev.slug}`}
            className="group flex flex-col items-start gap-1"
          >
            <span className="text-xs text-foreground/50">Previous</span>
            <span className="text-base font-medium transition-colors group-hover:text-primary">
              ← {prev.name}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/components/${next.slug}`}
            className="group flex flex-col items-end gap-1"
          >
            <span className="text-xs text-foreground/50">Next</span>
            <span className="text-base font-medium transition-colors group-hover:text-primary">
              {next.name} →
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}
