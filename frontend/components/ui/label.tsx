"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "block text-sm font-medium text-gray-700 mb-1.5",
        className
      )}
      {...props}
    />
  )
}

export { Label }
