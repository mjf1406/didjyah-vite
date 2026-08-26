import { Skeleton } from "@/components/ui/skeleton"

export default function ActiveStopwatchBarSkeleton() {
  return (
    <div
      className="fixed right-0 bottom-16 left-0 z-40 border-t border-red-500/30 bg-background/95 px-4 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm supports-backdrop-filter:bg-background/85 md:bottom-0"
      role="status"
      aria-live="polite"
      aria-label="Loading active stopwatch sessions"
    >
      <div className="mx-auto w-full max-w-4xl">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Loading active sessions…
        </p>
        <div
          className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background px-3 py-2"
          aria-hidden="true"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
        </div>
      </div>
    </div>
  )
}
