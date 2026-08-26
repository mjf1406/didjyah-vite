import { Skeleton } from "@/components/ui/skeleton"

interface DidjyahCardSkeletonProps {
  viewMode?: "list" | "grid"
}

export default function DidjyahCardSkeleton({
  viewMode = "list",
}: DidjyahCardSkeletonProps) {
  const isGrid = viewMode === "grid"

  return (
    <div
      className={`relative flex overflow-hidden rounded-lg border shadow-sm ${
        isGrid
          ? "w-full flex-col"
          : "w-full max-w-[450px] flex-row"
      }`}
      aria-hidden
    >
      <Skeleton
        className={
          isGrid
            ? "h-12 w-full rounded-none lg:h-16"
            : "h-auto w-12 shrink-0 rounded-none md:w-20"
        }
      />
      <div
        className={`flex w-full flex-col ${
          isGrid ? "gap-1 p-1.5 lg:p-2" : "gap-2 p-2 md:p-4"
        }`}
      >
        <Skeleton className={isGrid ? "h-3 w-3/4" : "h-4 w-2/3"} />
        <Skeleton className={isGrid ? "h-2.5 w-1/2" : "h-3 w-1/3"} />
        {!isGrid ? <Skeleton className="h-3 w-full" /> : null}
      </div>
    </div>
  )
}
