"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

interface CopyableCommandProps extends React.HTMLAttributes<HTMLDivElement> {
  command: string
  /** Glyph rendered before the command text. Defaults to `$`. */
  prefix?: string
  /** Visual size — `lg` is for the hero, `sm` fits exhibit cards. */
  size?: "sm" | "lg"
}

export function CopyableCommand({
  command,
  prefix = "$",
  size = "lg",
  className,
  ...props
}: CopyableCommandProps) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const onCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard might be blocked — fall back silently.
    }
  }, [command])

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between gap-3",
        "rounded-md border border-foreground/15 bg-foreground/[0.03]",
        "font-mono",
        size === "lg" ? "px-4 py-3 text-[13px]" : "px-3 py-2 text-xs",
        "hover:bg-foreground/[0.05] transition-colors",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        <span className="select-none text-primary">{prefix}</span>
        <code className="whitespace-nowrap text-foreground/85">{command}</code>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? "Copied" : "Copy command"}
        className={cn(
          "shrink-0 rounded-sm p-1.5 transition-colors",
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
  )
}
