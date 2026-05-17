import { id } from "@instantdb/react"
import { db } from "@/lib/db"
import { getEntityData } from "@/lib/undo"
import { nowMs } from "@/lib/time"
import { formatDuration } from "@/lib/duration"

export type StopwatchRecordLike = {
  id: string
  createdDate?: number | null
  endDate?: number | null
}

export type StopwatchDidjyahLike = {
  id: string
  name: string
  stopwatch?: boolean | null
  note?: boolean | null
  records?: StopwatchRecordLike[] | null
}

export type ActiveStopwatchSession = {
  didjyah: StopwatchDidjyahLike
  record: StopwatchRecordLike
}

export function isRunningStopwatchRecord(
  record: StopwatchRecordLike,
  stopwatchEnabled?: boolean | null,
): boolean {
  return (
    !!stopwatchEnabled &&
    record.createdDate != null &&
    record.endDate == null
  )
}

export function getActiveStopwatchRecord(
  didjyah: StopwatchDidjyahLike,
): StopwatchRecordLike | null {
  if (!didjyah.stopwatch) return null

  const active = (didjyah.records || []).filter(
    (r) => r.createdDate != null && r.endDate == null,
  )
  if (active.length === 0) return null

  return active.reduce((latest, record) => {
    if (!latest.createdDate) return record
    if (!record.createdDate) return latest
    return record.createdDate > latest.createdDate ? record : latest
  })
}

export function collectActiveStopwatchSessions(
  didjyahs: StopwatchDidjyahLike[],
): ActiveStopwatchSession[] {
  const sessions: ActiveStopwatchSession[] = []
  for (const didjyah of didjyahs) {
    const record = getActiveStopwatchRecord(didjyah)
    if (record) {
      sessions.push({ didjyah, record })
    }
  }
  return sessions.sort((a, b) => {
    const aStart = a.record.createdDate ?? 0
    const bStart = b.record.createdDate ?? 0
    return bStart - aStart
  })
}

/** Completed session duration in ms, or null if in-progress / instant / invalid. */
export function recordDurationMs(record: {
  createdDate?: number | null
  endDate?: number | null
}): number | null {
  if (record.createdDate == null) return null
  if (record.endDate == null) return null
  if (record.endDate === record.createdDate) return null
  return record.endDate - record.createdDate
}

export function formatRecordDuration(record: {
  createdDate?: number | null
  endDate?: number | null
}): string | null {
  const ms = recordDurationMs(record)
  if (ms == null) return null
  return formatDuration(ms)
}

type RegisterAction = (action: {
  type: "create" | "update"
  entityType: "didjyahRecords"
  entityId: string
  previousData?: Record<string, unknown>
  links?: Record<string, string>
  message: string
}) => void

export async function startStopwatchSession({
  didjyahId,
  didjyahName,
  ownerId,
  registerAction,
}: {
  didjyahId: string
  didjyahName: string
  ownerId: string
  registerAction: RegisterAction
}): Promise<string> {
  const recordId = id()
  const timestamp = nowMs()

  await db.transact(
    db.tx.didjyahRecords[recordId]
      .update({
        createdDate: timestamp,
        updatedDate: timestamp,
      })
      .link({ didjyah: didjyahId })
      .link({ owner: ownerId }),
  )

  registerAction({
    type: "create",
    entityType: "didjyahRecords",
    entityId: recordId,
    links: { didjyah: didjyahId, owner: ownerId },
    message: `Started "${didjyahName}"`,
  })

  return recordId
}

export async function stopStopwatchSession({
  recordId,
  didjyahId,
  didjyahName,
  ownerId,
  note,
  registerAction,
}: {
  recordId: string
  didjyahId: string
  didjyahName: string
  ownerId: string
  note?: string
  registerAction: RegisterAction
}): Promise<void> {
  const endTime = nowMs()
  const previousData = await getEntityData("didjyahRecords", recordId)
  const trimmed = note?.trim()

  await db.transact(
    db.tx.didjyahRecords[recordId].update({
      endDate: endTime,
      updatedDate: endTime,
      ...(trimmed ? { note: trimmed } : {}),
    }),
  )

  if (previousData) {
    registerAction({
      type: "update",
      entityType: "didjyahRecords",
      entityId: recordId,
      previousData,
      links: { didjyah: didjyahId, owner: ownerId },
      message: `Stopped "${didjyahName}"`,
    })
  }
}
