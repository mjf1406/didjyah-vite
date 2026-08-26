import React, { useMemo } from "react"
import { db } from "@/lib/db"
import { getErrorMessage } from "@/lib/errors"
import {
  getTodayStartMs,
  groupHomeRecordsByDidjyahId,
  homeActiveStopwatchRecordsWhere,
  homeTodayRecordsWhere,
} from "@/lib/records"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CircleX } from "lucide-react"
import DidjyahCard from "@/components/didjyah/DidjyahCard"
import FolderCard from "@/components/didjyah/FolderCard"
import { Skeleton } from "@/components/ui/skeleton"
import NoDidjyahsCard from "@/components/didjyah/NoDidjyahsCard"
import ActiveStopwatchBar from "@/components/didjyah/ActiveStopwatchBar"
import { collectActiveStopwatchSessions } from "@/lib/stopwatch"
import { useViewMode } from "@/components/didjyah/useViewMode"
import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"

/* eslint-disable @typescript-eslint/no-empty-object-type -- InstaQL nested link shapes */
type DidjyahRow = InstaQLEntity<AppSchema, "didjyahs", { folder: {} }>

type DidjyahWithRecords = InstaQLEntity<
  AppSchema,
  "didjyahs",
  { records: {}; folder: {} }
>

type DidjyahFolderRow = InstaQLEntity<AppSchema, "didjyahFolders", { owner: {} }>

type HomeRecordRow = InstaQLEntity<AppSchema, "didjyahRecords", { didjyah: {} }>
/* eslint-enable @typescript-eslint/no-empty-object-type */

function HomeQueryError({
  label,
  error,
}: {
  label: string
  error: unknown
}) {
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
              {label}: {getErrorMessage(error)}
            </AlertDescription>
          </div>
        </Alert>
      </div>
    </div>
  )
}

const DidjyahList: React.FC = () => {
  const user = db.useUser()
  const [viewMode] = useViewMode()
  const todayStartMs = useMemo(() => getTodayStartMs(), [])

  const {
    data: entitiesData,
    isLoading: entitiesLoading,
    error: entitiesError,
  } = db.useQuery({
    didjyahs: {
      $: { where: { "owner.id": user.id } },
      folder: {},
    },
    didjyahFolders: {
      $: { where: { "owner.id": user.id } },
    },
  })

  const {
    data: todayRecordsData,
    isLoading: todayRecordsLoading,
    error: todayRecordsError,
  } = db.useQuery({
    didjyahRecords: {
      $: {
        where: homeTodayRecordsWhere(user.id, todayStartMs),
      },
      didjyah: {},
    },
  })

  const {
    data: activeRecordsData,
    isLoading: activeRecordsLoading,
    error: activeRecordsError,
  } = db.useQuery({
    didjyahRecords: {
      $: {
        where: homeActiveStopwatchRecordsWhere(user.id),
      },
      didjyah: {},
    },
  })

  const didjyahsWithRecords = useMemo(() => {
    const didjyahs = (entitiesData?.didjyahs || []) as DidjyahRow[]
    const todayRecords = (todayRecordsData?.didjyahRecords ||
      []) as HomeRecordRow[]
    const activeRecords = (activeRecordsData?.didjyahRecords ||
      []) as HomeRecordRow[]

    const recordsByDidjyahId = groupHomeRecordsByDidjyahId(
      todayRecords,
      activeRecords,
    )

    return didjyahs.map(
      (didjyah): DidjyahWithRecords => ({
        ...didjyah,
        records: recordsByDidjyahId.get(didjyah.id) ?? [],
      }),
    )
  }, [entitiesData?.didjyahs, todayRecordsData?.didjyahRecords, activeRecordsData?.didjyahRecords])

  const activeSessions = useMemo(
    () => collectActiveStopwatchSessions(didjyahsWithRecords),
    [didjyahsWithRecords],
  )

  if (entitiesLoading || todayRecordsLoading || activeRecordsLoading) {
    return (
      <div className="m-auto flex w-full max-w-4xl items-center justify-center lg:min-w-3xl">
        <Skeleton className="h-8 w-32" />
      </div>
    )
  }

  if (entitiesError) {
    return <HomeQueryError label="Failed to load didjyahs" error={entitiesError} />
  }

  if (todayRecordsError) {
    return (
      <HomeQueryError label="Failed to load today's records" error={todayRecordsError} />
    )
  }

  if (activeRecordsError) {
    return (
      <HomeQueryError
        label="Failed to load active stopwatch sessions"
        error={activeRecordsError}
      />
    )
  }

  const didjyahs = didjyahsWithRecords
  const folders = ((entitiesData?.didjyahFolders || []) as DidjyahFolderRow[]).slice()
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

  const activeBarScrollPadding =
    activeSessions.length === 0
      ? ""
      : activeSessions.length === 1
        ? "pb-36 md:pb-28"
        : activeSessions.length === 2
          ? "pb-48 md:pb-40"
          : "pb-56 md:pb-48"

  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-2 ${activeBarScrollPadding}`}
    >
      {isGridView ? (
        <div className="w-full px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground">
            Double tap a card to do it
            {activeSessions.length > 0
              ? " • Double tap again to stop a running session"
              : ""}{" "}
            • Tap and hold to open the action menu
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
      {activeSessions.length > 0 ? (
        <ActiveStopwatchBar sessions={activeSessions} />
      ) : null}
    </div>
  )
}

export default DidjyahList
