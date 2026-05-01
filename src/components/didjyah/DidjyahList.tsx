import React from "react"
import { db } from "@/lib/db"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CircleX } from "lucide-react"
import DidjyahCard from "@/components/didjyah/DidjyahCard"
import { Skeleton } from "@/components/ui/skeleton"
import NoDidjyahsCard from "@/components/didjyah/NoDidjyahsCard"
import { useViewMode } from "@/components/didjyah/useViewMode"
import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"

type DidjyahWithRecords = InstaQLEntity<
  AppSchema,
  "didjyahs",
  { owner: {}; records: {} }
>

const DidjyahList: React.FC = () => {
  const user = db.useUser()
  const [viewMode] = useViewMode()
  const { data, isLoading, error } = db.useQuery({
    didjyahs: {
      $: { where: { "owner.id": user.id } },
      records: {},
    },
  })

  if (isLoading) {
    return (
      <div className="m-auto flex w-full max-w-4xl items-center justify-center lg:min-w-3xl">
        <Skeleton className="h-8 w-32" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="m-auto flex h-auto w-full items-center justify-center">
        <div className="max-w-5xl px-4">
          <Alert
            variant="destructive"
            className="flex w-full items-center gap-4"
          >
            <CircleX
              className="shrink-0"
              style={{ width: "36px", height: "36px" }}
            />
            <div className="w-full">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "An error occurred"}
              </AlertDescription>
            </div>
          </Alert>
        </div>
      </div>
    )
  }

  const didjyahs = (data?.didjyahs || []) as DidjyahWithRecords[]

  if (didjyahs.length === 0) {
    return (
      <div className="m-auto flex h-auto w-full items-center justify-center">
        <div className="max-w-5xl px-4">
          <NoDidjyahsCard />
        </div>
      </div>
    )
  }

  const isGridView = viewMode === "grid"

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2">
      {isGridView ? (
        <div className="w-full px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground">
            Double tap a card to do it • Tap and hold to open the action menu
          </p>
        </div>
      ) : null}
      <div
        className={`w-full ${
          isGridView
            ? "grid grid-cols-4 gap-2 px-4 md:gap-3"
            : "flex flex-col items-center gap-2"
        }`}
      >
        {didjyahs.map((item) => (
          <DidjyahCard key={item.id} detail={item} viewMode={viewMode} />
        ))}
      </div>
    </div>
  )
}

export default DidjyahList
