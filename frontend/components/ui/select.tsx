"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
  /** Renders the row indented — used for child categories. */
  indent?: boolean
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  /** Shown when `value` is empty. Also the permanent trigger label for "+ Add…" pickers. */
  placeholder?: string
  disabled?: boolean
  className?: string
}

/** Height the panel is allowed to take (max-h-64) — used to decide which way to open. */
const PANEL_MAX_HEIGHT = 256

/**
 * Admin editors live inside a modal with `overflow-y: auto`, which clips an
 * absolutely-positioned panel. Measure the nearest clipping ancestor (falling
 * back to the viewport) and flip upwards when there is more room above.
 * Shared by `Select` and `MultiSelect`.
 */
export function useDropDirection(optionCount: number) {
  const [dropUp, setDropUp] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const decide = React.useCallback(() => {
    const btn = triggerRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    let bound = { top: 0, bottom: window.innerHeight }
    let el = btn.parentElement
    while (el && el !== document.body) {
      const overflowY = getComputedStyle(el).overflowY
      if (overflowY === "auto" || overflowY === "scroll" || overflowY === "hidden") {
        const box = el.getBoundingClientRect()
        bound = { top: Math.max(0, box.top), bottom: Math.min(window.innerHeight, box.bottom) }
        break
      }
      el = el.parentElement
    }
    const needed = Math.min(PANEL_MAX_HEIGHT, optionCount * 38 + 8)
    const spaceBelow = bound.bottom - rect.bottom
    const spaceAbove = rect.top - bound.top
    setDropUp(spaceBelow < needed && spaceAbove > spaceBelow)
  }, [optionCount])

  return { dropUp, triggerRef, decide }
}

function Select({ value, onChange, options, placeholder = "Оберіть…", disabled, className }: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const { dropUp, triggerRef, decide: decideDirection } = useDropDirection(options.length)

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  const selected = options.find((o) => o.value === value)

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (!open) decideDirection()
          setOpen((o) => !o)
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          selected ? "text-gray-900" : "text-gray-400",
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute z-30 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl",
            dropUp ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          {options.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400">Немає варіантів</p>
          )}
          {options.map((o) => {
            const isSelected = o.value === value
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50",
                  isSelected ? "font-medium text-blue-700" : "text-gray-700",
                  o.indent && "pl-7",
                )}
              >
                <span className="flex-1 truncate">{o.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { Select }
