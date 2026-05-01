import { DocsSidebar } from "@/components/docs-sidebar"
import { DocsRail } from "@/components/docs-rail"

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        <DocsSidebar className="hidden md:block" />
        <main className="min-w-0 py-10 md:py-12">{children}</main>
        <DocsRail className="hidden lg:block" />
      </div>
    </div>
  )
}
