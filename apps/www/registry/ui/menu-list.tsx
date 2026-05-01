"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * MenuList — sprite-era selection list (start menu, battle menu, etc.).
 *
 * The pattern is the one every Game Boy / DS Pokémon game ships: a stack of
 * items, a single ▶ pixel cursor pinned to the left of whichever row is
 * "active". Hover, focus, and keyboard navigation all share the same
 * `activeIndex` so the cursor never disagrees with the page state.
 *
 * Compose like a shadcn primitive:
 *   <MenuList aria-label="Start menu">
 *     <MenuItem onSelect={openPokedex}>POKéDEX</MenuItem>
 *     <MenuItem onSelect={openParty}>POKéMON</MenuItem>
 *     <MenuItem onSelect={openBag}>PACK</MenuItem>
 *     <MenuItem onSelect={save}>SAVE</MenuItem>
 *     <MenuItem disabled>OPTIONS</MenuItem>
 *   </MenuList>
 *
 * Keyboard: ↑/↓ moves the cursor, Home/End jumps to ends, Enter/Space
 * fires the active item's `onSelect`. Disabled items are skipped.
 */

type MenuContext = {
  activeIndex: number
  setActiveIndex: (i: number) => void
  setItemRef: (i: number, el: HTMLLIElement | null) => void
  getItem: (i: number) => HTMLLIElement | null
  getItemCount: () => number
}
const MenuCtx = React.createContext<MenuContext | null>(null)

interface MenuListProps extends Omit<React.HTMLAttributes<HTMLUListElement>, "children"> {
  children: React.ReactNode
  /** Controlled active row. Uncontrolled if omitted. */
  value?: number
  /** Default active row when uncontrolled. */
  defaultValue?: number
  onValueChange?: (i: number) => void
}

function MenuList({
  className,
  children,
  value,
  defaultValue = 0,
  onValueChange,
  ...props
}: MenuListProps) {
  const [internal, setInternal] = React.useState(defaultValue)
  const isControlled = value !== undefined
  const activeIndex = isControlled ? value! : internal

  const itemRefs = React.useRef<Array<HTMLLIElement | null>>([])
  const itemCount = React.Children.count(children)

  const setActiveIndex = React.useCallback(
    (i: number) => {
      if (!isControlled) setInternal(i)
      onValueChange?.(i)
    },
    [isControlled, onValueChange],
  )

  const setItemRef = React.useCallback((i: number, el: HTMLLIElement | null) => {
    itemRefs.current[i] = el
  }, [])

  const getItem = React.useCallback((i: number) => {
    return itemRefs.current[i] ?? null
  }, [])

  const getItemCount = React.useCallback(() => {
    return itemCount
  }, [itemCount])

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const count = getItemCount()
    if (count === 0) return
    const isDisabled = (i: number) =>
      getItem(i)?.getAttribute("aria-disabled") === "true"
    const step = (dir: 1 | -1) => {
      let next = activeIndex
      for (let n = 0; n < count; n++) {
        next = (next + dir + count) % count
        if (getItem(next) && !isDisabled(next)) break
      }
      setActiveIndex(next)
      getItem(next)?.focus()
    }
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); step(1); break
      case "ArrowUp":   e.preventDefault(); step(-1); break
      case "Home":      e.preventDefault(); setActiveIndex(0); getItem(0)?.focus(); break
      case "End":       e.preventDefault(); {
        const last = count - 1
        setActiveIndex(last); getItem(last)?.focus()
        break
      }
      case "Enter":
      case " ": {
        e.preventDefault()
        getItem(activeIndex)?.click()
        break
      }
    }
  }

  const indexedChildren = React.Children.map(children, (child, index) => {
    if (!React.isValidElement<MenuItemPrivateProps>(child) || child.type !== MenuItem) {
      return child
    }
    return React.cloneElement(child, { __index: index })
  })

  const contextValue = React.useMemo(
    () => ({ activeIndex, setActiveIndex, setItemRef, getItem, getItemCount }),
    [activeIndex, getItem, getItemCount, setActiveIndex, setItemRef],
  )

  return (
    <MenuCtx.Provider value={contextValue}>
      <ul
        role="menu"
        data-slot="menu-list"
        onKeyDown={onKeyDown}
        className={cn(
          // Sprite-era panel: cream chassis, ink border, hard offset shadow.
          "relative inline-block min-w-[180px] rounded-[4px] border-2 border-foreground bg-card",
          "shadow-[3px_3px_0_0_var(--color-foreground)]",
          // Inner stripe + tight padding so items butt up against the frame.
          "py-2",
          className,
        )}
        {...props}
      >
        {indexedChildren}
      </ul>
    </MenuCtx.Provider>
  )
}

interface MenuItemProps
  extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "onSelect"> {
  /** Fires on click and on Enter/Space when this row is active. */
  onSelect?: () => void
  /** Greyed-out, skipped by keyboard nav. */
  disabled?: boolean
}

type MenuItemPrivateProps = MenuItemProps & {
  __index?: number
}

function MenuItem({
  className,
  onSelect,
  disabled = false,
  children,
  onMouseEnter,
  onClick,
  onFocus,
  __index = -1,
  ...props
}: MenuItemPrivateProps) {
  const ctx = React.useContext(MenuCtx)
  if (!ctx) throw new Error("<MenuItem> must be rendered inside <MenuList>")

  const idx = __index
  const isActive = ctx.activeIndex === idx

  const setRef = React.useCallback(
    (el: HTMLLIElement | null) => {
      ctx.setItemRef(idx, el)
    },
    [ctx, idx],
  )

  const handleClick = (e: React.MouseEvent<HTMLLIElement>) => {
    onClick?.(e)
    if (disabled) return
    ctx.setActiveIndex(idx)
    onSelect?.()
  }

  return (
    <li
      ref={setRef}
      role="menuitem"
      data-slot="menu-item"
      data-active={isActive ? "true" : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={isActive ? 0 : -1}
      onMouseEnter={(e) => {
        onMouseEnter?.(e)
        if (!disabled) ctx.setActiveIndex(idx)
      }}
      onFocus={(e) => {
        onFocus?.(e)
        if (!disabled) ctx.setActiveIndex(idx)
      }}
      onClick={handleClick}
      className={cn(
        "relative flex items-center gap-2 px-4 py-1.5 pl-7",
        "font-pixel text-sm font-bold uppercase tracking-[0.06em] text-foreground",
        "outline-none cursor-pointer select-none",
        "transition-colors duration-75",
        // Active-row styling: faint warm wash matching B/W menu hover.
        "data-[active=true]:bg-foreground/[0.06]",
        // Disabled — ink at half opacity, no cursor.
        "aria-disabled:cursor-not-allowed aria-disabled:text-foreground/40",
        className,
      )}
      {...props}
    >
      {/* Cursor — only painted on the active row. Sized to the pixel font. */}
      {isActive && !disabled ? (
        <PixelCursor className="absolute left-2 top-1/2 -translate-y-1/2 [animation:var(--animate-dialog-blink,_dialog-blink_1.1s_step-end_infinite)]" />
      ) : null}
      {children}
    </li>
  )
}

/**
 * Pixel-art ▶ cursor — five rows of chunky 2-unit pixels rendered with
 * `crispEdges` so it stays sharp at any zoom. Inherits `currentColor`.
 */
function PixelCursor({ className }: { className?: string }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      <rect x="0" y="0" width="2" height="2" />
      <rect x="0" y="2" width="4" height="2" />
      <rect x="0" y="4" width="6" height="2" />
      <rect x="0" y="6" width="4" height="2" />
      <rect x="0" y="8" width="2" height="2" />
    </svg>
  )
}

export { MenuList, MenuItem }
export type { MenuListProps, MenuItemProps }
