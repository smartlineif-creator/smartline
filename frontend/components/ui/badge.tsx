import * as React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-blue-600 text-white",
        variant === "secondary" && "bg-gray-100 text-gray-800",
        variant === "destructive" && "bg-red-100 text-red-700",
        variant === "outline" && "border border-gray-200 text-gray-700",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
