import { useEffect, useMemo } from "react"
import { db } from "@/lib/db"
import {
  getTodayStartMs,
  homeDidjyahActiveRecordsWhere,
  homeDidjyahTodayRecordsWhere,
  mergeRecordsById,
} from "@/lib/records"
import type {
  DidjyahCardLoadState,
  DidjyahRow,
  DidjyahWithRecords,
} from "@/components/didjyah/DidjyahCardWithRecords"
import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"

/* eslint-disable @typescript-eslint/no-empty-object-type -- InstaQL record shape */
type HomeRecordRow = InstaQLEntity<AppSchema, "didjyahRecords", {}>
/* eslint-enable @typescript-eslint/no-empty-object-type */

interface DidjyahRecordsSubscriberProps {
  didjyah: DidjyahRow
  ownerId: string
  todayStartMs?: number
  onLoadStateChange?: (state: DidjyahCardLoadState) => void
}

/** Headless subscription so folder didjyahs report state before their popover opens. */
export default function DidjyahRecordsSubscriber({
  didjyah,
  ownerId,
  todayStartMs: todayStartMsProp,
  onLoadStateChange,
}: DidjyahRecordsSubscriberProps) {
  const todayStartMs = useMemo(
    () => todayStartMsProp ?? getTodayStartMs(),
    [todayStartMsProp],
  )

  const todayQuery = db.useQuery({
    didjyahRecords: {
      $: {
        where: homeDidjyahTodayRecordsWhere(
          ownerId,
          didjyah.id,
          todayStartMs,
        ),
      },
    },
  })

  const activeQuery = db.useQuery({
    didjyahRecords: {
      $: {
        where: homeDidjyahActiveRecordsWhere(ownerId, didjyah.id),
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

    onLoadStateChange({
      status: "ready",
      didjyahId: didjyah.id,
      didjyah: detail,
    })
  }, [detail, didjyah.id, error, isLoading, onLoadStateChange])

  return null
}
