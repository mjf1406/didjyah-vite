import { db } from "@/lib/db"

/** Start of local calendar day in ms. */
export function getTodayStartMs(at: Date = new Date()): number {
  const d = new Date(at)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** One year ago from now in ms (dashboard record window). */
export function getOneYearAgoMs(at: Date = new Date()): number {
  const d = new Date(at)
  d.setFullYear(d.getFullYear() - 1)
  return d.getTime()
}

/** Top-level where for today's records on the home page. */
export function homeTodayRecordsWhere(ownerId: string, todayStartMs: number) {
  return {
    "owner.id": ownerId,
    createdDate: { $gte: todayStartMs },
  }
}

/** Top-level where for running stopwatch records on the home page. */
export function homeActiveStopwatchRecordsWhere(ownerId: string) {
  return {
    "owner.id": ownerId,
    endDate: { $isNull: true },
  }
}

/** Merge home record sets by didjyah, de-duplicating by record id. */
export function groupHomeRecordsByDidjyahId<
  T extends { id: string; didjyah?: { id: string } | null },
>(...recordSets: T[][]): Map<string, T[]> {
  const byDidjyah = new Map<string, Map<string, T>>()

  for (const records of recordSets) {
    for (const record of records) {
      const didjyahId = record.didjyah?.id
      if (!didjyahId) continue

      let recordsById = byDidjyah.get(didjyahId)
      if (!recordsById) {
        recordsById = new Map()
        byDidjyah.set(didjyahId, recordsById)
      }
      recordsById.set(record.id, record)
    }
  }

  const grouped = new Map<string, T[]>()
  for (const [didjyahId, recordsById] of byDidjyah) {
    grouped.set(didjyahId, Array.from(recordsById.values()))
  }
  return grouped
}

export function lastRecordedAtUpdateTx(didjyahId: string, timestamp: number) {
  return db.tx.didjyahs[didjyahId].update({ lastRecordedAt: timestamp })
}

/** Recompute `lastRecordedAt` from the newest remaining record. */
export async function syncLastRecordedAtForDidjyah(
  didjyahId: string,
  ownerId: string,
): Promise<void> {
  const result = await db.queryOnce({
    didjyahRecords: {
      $: {
        where: {
          "didjyah.id": didjyahId,
          "owner.id": ownerId,
        },
        order: { createdDate: "desc" },
        limit: 1,
      },
    },
  })

  const latestCreatedDate = result.data?.didjyahRecords?.[0]?.createdDate

  await db.transact(
    db.tx.didjyahs[didjyahId].update({
      ...(latestCreatedDate != null
        ? { lastRecordedAt: latestCreatedDate }
        : { lastRecordedAt: null }),
    }),
  )
}

/** Start of day ms for a date input value (`YYYY-MM-DD`). */
export function dateInputToStartMs(dateStr: string): number {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** End of day ms for a date input value (`YYYY-MM-DD`). */
export function dateInputToEndMs(dateStr: string): number {
  const d = new Date(dateStr)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

export type HistoryRecordFilters = {
  ownerId: string
  didjyahIds: string[]
  startDate: string
  endDate: string
}

type HistoryRecordWhereClause =
  | { "owner.id": string }
  | { "didjyah.id": { $in: string[] } }
  | { createdDate: { $gte: number } }
  | { createdDate: { $lte: number } }

/** Server-side where clause for paginated history records. */
export function buildHistoryRecordsWhere(filters: HistoryRecordFilters): {
  and: HistoryRecordWhereClause[]
} {
  const clauses: HistoryRecordWhereClause[] = [
    { "owner.id": filters.ownerId },
  ]

  if (filters.didjyahIds.length > 0) {
    clauses.push({ "didjyah.id": { $in: filters.didjyahIds } })
  }

  if (filters.startDate) {
    clauses.push({
      createdDate: { $gte: dateInputToStartMs(filters.startDate) },
    })
  }

  if (filters.endDate) {
    clauses.push({
      createdDate: { $lte: dateInputToEndMs(filters.endDate) },
    })
  }

  return { and: clauses }
}
