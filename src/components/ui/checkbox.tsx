"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer size-4 shrink-0 rounded-md border border-olive-200 ring-offset-background transition-[color,box-shadow,border]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-500 focus-visible:ring-offset-2",
      "data-[state=checked]:border-olive-500 data-[state=checked]:bg-olive-500",
      "data-[state=indeterminate]:border-olive-500 data-[state=indeterminate]:bg-olive-500",
      "disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
      <Check className="size-3" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
