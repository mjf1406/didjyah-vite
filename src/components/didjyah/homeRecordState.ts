import { useMemo } from "react"
import { db } from "@/lib/db"
import {
  groupHomeRecordsByDidjyahId,
  homeOwnerActiveRecordsWhere,
  homeOwnerTodayRecordsWhere,
  mergeRecordsById,
} from "@/lib/records"
import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"

/* eslint-disable @typescript-eslint/no-empty-object-type -- InstaQL nested link shapes */
export type DidjyahRow = InstaQLEntity<AppSchema, "didjyahs", { folder: {} }>

export type DidjyahWithRecords = InstaQLEntity<
  AppSchema,
  "didjyahs",
  { records: {}; folder: {} }
>

export type HomeRecordRow = InstaQLEntity<
  AppSchema,
  "didjyahRecords",
  { didjyah: {} }
>
/* eslint-enable @typescript-eslint/no-empty-object-type */

export type DidjyahCardLoadState =
  | { status: "loading"; didjyahId: string }
  | { status: "error"; didjyahId: string; error: unknown }
  | { status: "ready"; didjyahId: string; didjyah: DidjyahWithRecords }

export function useHomeOwnerRecords(ownerId: string, todayStartMs: number) {
  const todayQuery = db.useQuery({
    didjyahRecords: {
      $: {
        where: homeOwnerTodayRecordsWhere(ownerId, todayStartMs),
      },
      didjyah: {},
    },
  })

  const activeQuery = db.useQuery({
    didjyahRecords: {
      $: {
        where: homeOwnerActiveRecordsWhere(ownerId),
      },
      didjyah: {},
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

  const recordsByDidjyahId = useMemo(
    () => groupHomeRecordsByDidjyahId(records),
    [records],
  )

  const isLoading = todayQuery.isLoading || activeQuery.isLoading
  const error = todayQuery.error ?? activeQuery.error

  return { recordsByDidjyahId, isLoading, error }
}

export function buildDidjyahLoadStates(
  didjyahs: DidjyahRow[],
  recordsByDidjyahId: Map<string, HomeRecordRow[]>,
  isLoading: boolean,
  error: unknown,
  hasStableSnapshot: boolean,
): Map<string, DidjyahCardLoadState> {
  const loadStates = new Map<string, DidjyahCardLoadState>()

  for (const didjyah of didjyahs) {
    if (error && !hasStableSnapshot) {
      loadStates.set(didjyah.id, {
        status: "error",
        didjyahId: didjyah.id,
        error,
      })
      continue
    }

    if (isLoading && !hasStableSnapshot && !recordsByDidjyahId.has(didjyah.id)) {
      loadStates.set(didjyah.id, { status: "loading", didjyahId: didjyah.id })
      continue
    }

    loadStates.set(didjyah.id, {
      status: "ready",
      didjyahId: didjyah.id,
      didjyah: {
        ...didjyah,
        records: recordsByDidjyahId.get(didjyah.id) ?? [],
      },
    })
  }

  return loadStates
}
