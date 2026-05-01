import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  showPercentage?: boolean
}

function Progress({
  className,
  value = 0,
  showPercentage = false,
  ...props
}: ProgressProps) {
  const numericValue = value ?? 0
  const textColor = numericValue >= 50 ? "text-background" : "text-foreground"

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-md bg-muted",
        className,
      )}
      value={numericValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - numericValue}%)` }}
      />
      {showPercentage ? (
        <span
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium",
            textColor,
          )}
        >
          {Math.round(numericValue)}%
        </span>
      ) : null}
    </ProgressPrimitive.Root>
  )
}

export { Progress }
