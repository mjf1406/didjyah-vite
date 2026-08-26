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

/** Today's records for one didjyah on the home page. */
export function homeDidjyahTodayRecordsWhere(
  ownerId: string,
  didjyahId: string,
  todayStartMs: number,
) {
  return {
    "owner.id": ownerId,
    "didjyah.id": didjyahId,
    createdDate: { $gte: todayStartMs },
  }
}

/** Running stopwatch records for one didjyah on the home page. */
export function homeDidjyahActiveRecordsWhere(
  ownerId: string,
  didjyahId: string,
) {
  return {
    "owner.id": ownerId,
    "didjyah.id": didjyahId,
    endDate: { $isNull: true },
  }
}

/** Merge record arrays by record id. */
export function mergeRecordsById<
  T extends { id: string },
>(...recordSets: T[][]): T[] {
  const byId = new Map<string, T>()
  for (const records of recordSets) {
    for (const record of records) {
      byId.set(record.id, record)
    }
  }
  return Array.from(byId.values())
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
