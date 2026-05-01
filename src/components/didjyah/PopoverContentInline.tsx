import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

type PopoverContentInlineProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Content
>

const PopoverContentInline = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentInlineProps
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "bg-popover text-popover-foreground animate-in z-50 w-72 rounded-md border p-4 shadow-md outline-none",
      className,
    )}
    {...props}
  />
))
PopoverContentInline.displayName = "PopoverContentInline"

export default PopoverContentInline
