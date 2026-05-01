import React from "react"
import { db } from "@/lib/db"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CircleX } from "lucide-react"
import DidjyahCard from "@/components/didjyah/DidjyahCard"
import FolderCard from "@/components/didjyah/FolderCard"
import { Skeleton } from "@/components/ui/skeleton"
import NoDidjyahsCard from "@/components/didjyah/NoDidjyahsCard"
import { useViewMode } from "@/components/didjyah/useViewMode"
import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"

/* eslint-disable @typescript-eslint/no-empty-object-type -- InstaQL nested link shapes */
type DidjyahWithRecords = InstaQLEntity<
  AppSchema,
  "didjyahs",
  { owner: {}; records: {}; folder: {} }
>

type DidjyahFolderRow = InstaQLEntity<AppSchema, "didjyahFolders", { owner: {} }>
/* eslint-enable @typescript-eslint/no-empty-object-type */

const DidjyahList: React.FC = () => {
  const user = db.useUser()
  const [viewMode] = useViewMode()

  const { data, isLoading, error } = db.useQuery({
    didjyahs: {
      $: { where: { "owner.id": user.id } },
      records: {},
      folder: {},
    },
    didjyahFolders: {
      $: { where: { "owner.id": user.id } },
      owner: {},
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
  const folders = ((data?.didjyahFolders || []) as DidjyahFolderRow[]).slice()
  folders.sort((a, b) => a.name.localeCompare(b.name))

  if (didjyahs.length === 0 && folders.length === 0) {
    return (
      <div className="m-auto flex h-auto w-full items-center justify-center">
        <div className="max-w-5xl px-4">
          <NoDidjyahsCard />
        </div>
      </div>
    )
  }

  const folderMap = new Map<string, DidjyahWithRecords[]>()
  for (const d of didjyahs) {
    const fid = d.folder?.id
    if (fid) {
      const list = folderMap.get(fid) ?? []
      list.push(d)
      folderMap.set(fid, list)
    }
  }
  for (const list of folderMap.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  const unfolderedDidjyahs = didjyahs.filter((d) => !d.folder)

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
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            folderDidjyahs={folderMap.get(folder.id) ?? []}
            viewMode={viewMode}
          />
        ))}
        {unfolderedDidjyahs.map((item) => (
          <DidjyahCard key={item.id} detail={item} viewMode={viewMode} />
        ))}
      </div>
    </div>
  )
}

export default DidjyahList
