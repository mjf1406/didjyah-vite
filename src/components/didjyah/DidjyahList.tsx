import React, { useEffect, useMemo, useRef } from "react"
import { db } from "@/lib/db"
import { getErrorMessage } from "@/lib/errors"
import { backfillLastRecordedAtBatch, getTodayStartMs } from "@/lib/records"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CircleX } from "lucide-react"
import FolderCard from "@/components/didjyah/FolderCard"
import DidjyahCardWithRecords from "@/components/didjyah/DidjyahCardWithRecords"
import {
  buildDidjyahLoadStates,
  type DidjyahRow,
  useHomeOwnerRecords,
} from "@/components/didjyah/homeRecordState"
import { Skeleton } from "@/components/ui/skeleton"
import NoDidjyahsCard from "@/components/didjyah/NoDidjyahsCard"
import ActiveStopwatchBar from "@/components/didjyah/ActiveStopwatchBar"
import ActiveStopwatchBarSkeleton from "@/components/didjyah/ActiveStopwatchBarSkeleton"
import { collectActiveStopwatchSessions } from "@/lib/stopwatch"
import { useViewMode } from "@/components/didjyah/useViewMode"
import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"

/* eslint-disable @typescript-eslint/no-empty-object-type -- InstaQL nested link shapes */
type DidjyahFolderRow = InstaQLEntity<AppSchema, "didjyahFolders", { owner: {} }>
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
  const connectionStatus = db.useConnectionStatus()
  const [viewMode] = useViewMode()
  const todayStartMs = useMemo(() => getTodayStartMs(), [])
  const backfillStartedRef = useRef(false)

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
    recordsByDidjyahId,
    isLoading: recordsLoading,
    error: recordsError,
  } = useHomeOwnerRecords(user.id, todayStartMs)

  const didjyahs = useMemo(
    () => (entitiesData?.didjyahs || []) as DidjyahRow[],
    [entitiesData?.didjyahs],
  )

  const hasCachedRecords = recordsByDidjyahId.size > 0

  const loadStates = useMemo(
    () =>
      buildDidjyahLoadStates(
        didjyahs,
        recordsByDidjyahId,
        recordsLoading,
        recordsError,
        hasCachedRecords,
      ),
    [
      didjyahs,
      recordsByDidjyahId,
      recordsLoading,
      recordsError,
      hasCachedRecords,
    ],
  )

  useEffect(() => {
    if (connectionStatus !== "authenticated") return
    if (entitiesLoading || recordsLoading) return
    if (backfillStartedRef.current) return

    const needingBackfill = didjyahs.filter(
      (didjyah) => didjyah.sinceLast && didjyah.lastRecordedAt == null,
    )
    if (needingBackfill.length === 0) return

    backfillStartedRef.current = true
    void backfillLastRecordedAtBatch(needingBackfill, user.id)
  }, [
    connectionStatus,
    didjyahs,
    entitiesLoading,
    recordsLoading,
    user.id,
  ])

  const activeSessions = useMemo(() => {
    const readyDidjyahs = Array.from(loadStates.values())
      .filter((state) => state.status === "ready")
      .map((state) => state.didjyah)

    return collectActiveStopwatchSessions(readyDidjyahs)
  }, [loadStates])

  if (entitiesLoading) {
    return (
      <div className="m-auto flex w-full max-w-4xl items-center justify-center lg:min-w-3xl">
        <Skeleton className="h-8 w-32" />
      </div>
    )
  }

  if (entitiesError) {
    return (
      <HomeQueryError label="Failed to load didjyahs" error={entitiesError} />
    )
  }

  if (recordsError && !hasCachedRecords) {
    return (
      <HomeQueryError label="Failed to load records" error={recordsError} />
    )
  }

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

  const folderMap = new Map<string, DidjyahRow[]>()
  for (const didjyah of didjyahs) {
    const folderId = didjyah.folder?.id
    if (folderId) {
      const list = folderMap.get(folderId) ?? []
      list.push(didjyah)
      folderMap.set(folderId, list)
    }
  }
  for (const list of folderMap.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  const unfolderedDidjyahs = didjyahs.filter((didjyah) => !didjyah.folder)
  const isGridView = viewMode === "grid"
  const showStopwatchSkeleton = recordsLoading && !hasCachedRecords

  const activeBarScrollPadding =
    showStopwatchSkeleton
      ? "pb-36 md:pb-28"
      : activeSessions.length === 0
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
            didjyahLoadStates={loadStates}
          />
        ))}
        {unfolderedDidjyahs.map((didjyah) => (
          <DidjyahCardWithRecords
            key={didjyah.id}
            loadState={loadStates.get(didjyah.id)}
            fallbackName={didjyah.name}
            viewMode={viewMode}
          />
        ))}
      </div>
      {showStopwatchSkeleton ? (
        <ActiveStopwatchBarSkeleton />
      ) : activeSessions.length > 0 ? (
        <ActiveStopwatchBar sessions={activeSessions} />
      ) : null}
    </div>
  )
}

export default DidjyahList
