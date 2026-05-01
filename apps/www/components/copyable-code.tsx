"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

interface CopyableCodeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The code to render and copy. */
  code: string
  /** Filename pill shown in the header. */
  filename?: string
  /** Hide the body and only show the filename pill until expanded. */
  collapsed?: boolean
  /** Cap visible height in pixels (auto-scrolls vertically). Default 480. */
  maxHeight?: number
}

export function CopyableCode({
  code,
  filename,
  collapsed = false,
  maxHeight = 480,
  className,
  ...props
}: CopyableCodeProps) {
  const [copied, setCopied] = React.useState(false)
  const [open, setOpen] = React.useState(!collapsed)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const onCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard might be blocked — fall back silently.
    }
  }, [code])

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const lineCount = React.useMemo(() => code.split("\n").length, [code])
  const sizeKb = React.useMemo(() => (code.length / 1024).toFixed(1), [code])

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-foreground/15 bg-foreground/[0.03]",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-3 border-b border-foreground/10 bg-foreground/[0.02] px-4 py-2">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          {filename ? (
            <code className="font-mono text-[11px] text-foreground/75">
              {filename}
            </code>
          ) : null}
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/40">
            {lineCount} lines · {sizeKb} KB
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {collapsed ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-sm px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-foreground/55 hover:bg-foreground/10 hover:text-foreground"
            >
              {open ? "Hide" : "Show"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCopy}
            aria-label={copied ? "Copied" : "Copy source"}
            className={cn(
              "rounded-sm p-1.5 transition-colors",
              "text-foreground/50 hover:text-foreground hover:bg-foreground/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
      {open ? (
        <pre
          className="overflow-auto p-4 font-mono text-[12px] leading-[1.55] text-foreground/85"
          style={{ maxHeight }}
        >
          <code>{code}</code>
        </pre>
      ) : null}
    </div>
  )
}
