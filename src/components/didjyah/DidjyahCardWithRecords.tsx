import React, { useEffect, useMemo } from "react"
import { db } from "@/lib/db"
import {
  getTodayStartMs,
  homeDidjyahActiveRecordsWhere,
  homeDidjyahTodayRecordsWhere,
  mergeRecordsById,
} from "@/lib/records"
import DidjyahCard from "@/components/didjyah/DidjyahCard"
import DidjyahCardSkeleton from "@/components/didjyah/DidjyahCardSkeleton"
import DidjyahCardLoadError from "@/components/didjyah/DidjyahCardLoadError"
import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"

/* eslint-disable @typescript-eslint/no-empty-object-type -- InstaQL nested link shapes */
export type DidjyahRow = InstaQLEntity<AppSchema, "didjyahs", { folder: {} }>

export type DidjyahWithRecords = InstaQLEntity<
  AppSchema,
  "didjyahs",
  { records: {}; folder: {} }
>

type HomeRecordRow = InstaQLEntity<AppSchema, "didjyahRecords", {}>
/* eslint-enable @typescript-eslint/no-empty-object-type */

export type DidjyahCardLoadState =
  | { status: "loading"; didjyahId: string }
  | { status: "error"; didjyahId: string; error: unknown }
  | { status: "ready"; didjyahId: string; didjyah: DidjyahWithRecords }

function useDidjyahHomeRecords(
  didjyahId: string,
  ownerId: string,
  todayStartMs: number,
) {
  const todayQuery = db.useQuery({
    didjyahRecords: {
      $: {
        where: homeDidjyahTodayRecordsWhere(ownerId, didjyahId, todayStartMs),
      },
    },
  })

  const activeQuery = db.useQuery({
    didjyahRecords: {
      $: {
        where: homeDidjyahActiveRecordsWhere(ownerId, didjyahId),
      },
    },
  })

  const records = useMemo(
    () =>
      mergeRecordsById<HomeRecordRow>(
        (todayQuery.data?.didjyahRecords ?? []) as HomeRecordRow[],
        (activeQuery.data?.didjyahRecords ?? []) as HomeRecordRow[],
      ),
    [todayQuery.data?.didjyahRecords, activeQuery.data?.didjyahRecords],
  )

  const isLoading = todayQuery.isLoading || activeQuery.isLoading
  const error = todayQuery.error ?? activeQuery.error

  return { records, isLoading, error }
}

interface DidjyahCardWithRecordsProps {
  didjyah: DidjyahRow
  ownerId: string
  todayStartMs?: number
  viewMode?: "list" | "grid"
  onRecorded?: () => void
  onLoadStateChange?: (state: DidjyahCardLoadState) => void
}

const DidjyahCardWithRecords: React.FC<DidjyahCardWithRecordsProps> = ({
  didjyah,
  ownerId,
  todayStartMs: todayStartMsProp,
  viewMode = "list",
  onRecorded,
  onLoadStateChange,
}) => {
  const todayStartMs = useMemo(
    () => todayStartMsProp ?? getTodayStartMs(),
    [todayStartMsProp],
  )

  const { records, isLoading, error } = useDidjyahHomeRecords(
    didjyah.id,
    ownerId,
    todayStartMs,
  )

  const detail = useMemo(
    (): DidjyahWithRecords => ({
      ...didjyah,
      records,
    }),
    [didjyah, records],
  )

  useEffect(() => {
    if (!onLoadStateChange) return

    if (isLoading) {
      onLoadStateChange({ status: "loading", didjyahId: didjyah.id })
      return
    }

    if (error) {
      onLoadStateChange({ status: "error", didjyahId: didjyah.id, error })
      return
    }

    onLoadStateChange({ status: "ready", didjyahId: didjyah.id, didjyah: detail })
  }, [detail, didjyah.id, error, isLoading, onLoadStateChange])

  if (isLoading) {
    return <DidjyahCardSkeleton viewMode={viewMode} />
  }

  if (error) {
    return (
      <DidjyahCardLoadError
        name={didjyah.name}
        error={error}
        viewMode={viewMode}
      />
    )
  }

  return (
    <DidjyahCard detail={detail} viewMode={viewMode} onRecorded={onRecorded} />
  )
}

export default DidjyahCardWithRecords
