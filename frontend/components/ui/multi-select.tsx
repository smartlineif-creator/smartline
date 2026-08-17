"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useDropDirection } from "./select"

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  values: string[]
  onChange: (values: string[]) => void
  options: MultiSelectOption[]
  /** Trigger label when nothing is picked — an empty selection means "no filter". */
  placeholder?: string
  className?: string
}

function MultiSelect({ values, onChange, options, placeholder = "Усі", className }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const { dropUp, triggerRef, decide } = useDropDirection(options.length)

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value])
  }

  const selectedLabels = options.filter((o) => values.includes(o.value)).map((o) => o.label)

  return (
    <div
      className={cn("relative", className)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (!open) decide()
          setOpen((o) => !o)
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          values.length > 0 ? "border-blue-200 text-gray-900" : "border-gray-200 text-gray-500",
        )}
      >
        <span className="truncate">{selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          {values.length > 1 && (
            <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700">
              {values.length}
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable
          className={cn(
            "absolute z-30 max-h-64 w-full min-w-[220px] overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl",
            dropUp ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          {options.map((o) => {
            const checked = values.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => toggle(o.value)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-blue-50"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    checked ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white",
                  )}
                >
                  {checked && <Check className="h-3 w-3" />}
                </span>
                <span className="flex-1 truncate">{o.label}</span>
              </button>
            )
          })}

          {values.length > 0 && (
            <>
              <div className="my-1 h-px bg-gray-100" />
              <button
                type="button"
                onClick={() => onChange([])}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                <X className="h-3.5 w-3.5" />
                Скинути
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export { MultiSelect }
