import React from "react"
import { Link } from "@tanstack/react-router"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import type { IconPrefix, IconName } from "@fortawesome/fontawesome-svg-core"
import { toast } from "sonner"
import { id } from "@instantdb/react"
import { db } from "@/lib/db"
import { useUndo } from "@/lib/undo"
import { nowMs } from "@/lib/time"
import { Progress } from "@/components/ui/progress"
import EditDidjyahDialog from "@/components/didjyah/EditDidjyahDialog"
import { Button } from "@/components/ui/button"
import SinceStopwatch from "@/components/didjyah/SinceStopWatch"
import DeleteDidjyahAlertDialog from "@/components/didjyah/DeleteDidjyahAlertDialog"
import CustomDidjyahDialog from "@/components/didjyah/CustomDidjyahDialog"
import NoteRecordDialog from "@/components/didjyah/NoteRecordDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Trash, BarChart3, Calendar } from "lucide-react"
import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"

type DidjyahWithRecords = InstaQLEntity<
  AppSchema,
  "didjyahs",
  { records: {} }
>

interface DidjyahCardProps {
  detail: DidjyahWithRecords
  viewMode?: "list" | "grid"
}

const DidjyahCard: React.FC<DidjyahCardProps> = ({
  detail,
  viewMode = "list",
}) => {
  const user = db.useUser()
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [customDialogOpen, setCustomDialogOpen] = React.useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = React.useState(false)
  const [noteDialogKey, setNoteDialogKey] = React.useState(0)
  const pendingTimestampRef = React.useRef<number | null>(null)
  const { registerAction } = useUndo()

  const lastTapTimeRef = React.useRef<number>(0)
  const doubleTapDelay = 300

  let iconComponent: React.ReactNode = null
  if (detail.icon) {
    const parts = detail.icon.split("|")
    if (parts.length === 2) {
      const [prefix, iconName] = parts
      iconComponent = (
        <FontAwesomeIcon
          icon={[prefix as IconPrefix, iconName as IconName]}
          style={{ color: detail.iconColor ?? "#000000" }}
          className={
            viewMode === "grid"
              ? "text-lg lg:text-2xl"
              : "text-3xl md:text-5xl"
          }
        />
      )
    }
  }
  iconComponent ??= (
    <span
      className={
        viewMode === "grid" ? "text-sm lg:text-xl" : "text-xs md:text-2xl"
      }
    >
      ❓
    </span>
  )

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartTimestamp = todayStart.getTime()
  const todayEndTimestamp = todayStartTimestamp + 24 * 60 * 60 * 1000

  const todayCount = (detail.records || []).filter((record) => {
    const recordDate = record.createdDate
    if (!recordDate) return false
    return (
      recordDate >= todayStartTimestamp && recordDate < todayEndTimestamp
    )
  }).length

  const handlePlayClick = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }

    const now = nowMs()
    const timeSinceLastTap = now - lastTapTimeRef.current

    if (timeSinceLastTap < doubleTapDelay && timeSinceLastTap > 0) {
      lastTapTimeRef.current = 0
      const timestamp = nowMs()
      if (detail.note) {
        pendingTimestampRef.current = timestamp
        setNoteDialogKey((k) => k + 1)
        setNoteDialogOpen(true)
      } else {
        try {
          const recordId = id()
          await db.transact(
            db.tx.didjyahRecords[recordId]
              .update({
                createdDate: timestamp,
                updatedDate: timestamp,
                endDate: timestamp,
              })
              .link({ didjyah: detail.id })
              .link({ owner: user.id }),
          )
          registerAction({
            type: "create",
            entityType: "didjyahRecords",
            entityId: recordId,
            links: { didjyah: detail.id, owner: user.id },
            message: `Record added to "${detail.name}"`,
          })
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "An error occurred while adding the record."
          toast.error(message)
        }
      }
    } else {
      lastTapTimeRef.current = now
    }
  }

  const current = detail.quantity ? todayCount * detail.quantity : todayCount
  const total =
    detail.dailyGoal && detail.quantity
      ? detail.dailyGoal * detail.quantity
      : (detail.dailyGoal ?? 0)
  const percentage = total > 0 ? (current / total) * 100 : 0
  const dailyGoalNum = Number(detail.dailyGoal)

  const records = detail.records || []
  const lastRecord =
    records.length > 0
      ? records.reduce((latest, record) => {
          if (!latest) return record
          if (!record.createdDate) return latest
          if (!latest.createdDate) return record
          return record.createdDate > latest.createdDate ? record : latest
        })
      : null

  const isGrid = viewMode === "grid"

  return (
    <div
      id={`DidgYa-${detail.id}`}
      className={`relative flex overflow-hidden rounded-lg border shadow-sm ${
        isGrid ? "w-full cursor-pointer flex-col" : "w-full max-w-[450px] flex-row"
      }`}
      onClick={isGrid ? (e) => void handlePlayClick(e) : undefined}
    >
      <div
        id={`emoji-${detail.id}`}
        style={{ backgroundColor: detail.color ?? "#ffffff" }}
        className={`flex items-center justify-center ${
          isGrid
            ? "h-12 w-full p-1.5 lg:h-16 lg:p-2"
            : "w-12 p-2 md:w-20 md:min-w-20 md:p-4"
        }`}
      >
        {iconComponent}
      </div>

      <div
        className={`flex w-full flex-col ${
          isGrid ? "gap-0.5 p-1.5 lg:p-2" : "gap-1 p-2 md:gap-2 md:p-4"
        }`}
      >
        <div
          className={`flex ${
            isGrid ? "flex-col gap-0.5" : "justify-between gap-3 md:gap-5"
          }`}
        >
          <div className="min-w-0 flex flex-col">
            {isGrid ? (
              <>
                <span
                  id={`name-${detail.id}`}
                  className="truncate text-[10px] font-semibold lg:text-sm"
                >
                  {detail.name}
                </span>
                {detail.sinceLast &&
                lastRecord &&
                lastRecord.createdDate ? (
                  <span className="truncate text-[8px] lg:text-xs">
                    <SinceStopwatch
                      startDateTime={lastRecord.createdDate}
                    />
                  </span>
                ) : null}
              </>
            ) : (
              <div className="flex min-w-0 items-center gap-1">
                <span
                  id={`name-${detail.id}`}
                  className="truncate text-xs font-semibold md:text-base"
                >
                  {detail.name}
                </span>
                {detail.sinceLast &&
                lastRecord &&
                lastRecord.createdDate ? (
                  <span className="shrink-0 text-[10px] md:text-xs">
                    <SinceStopwatch
                      startDateTime={lastRecord.createdDate}
                    />
                  </span>
                ) : null}
              </div>
            )}
            <span
              id={`performedToday-${detail.id}`}
              className={`${
                isGrid ? "text-[9px] lg:text-xs" : "text-[10px] md:text-xs"
              }`}
            >
              <b>
                {todayCount} {dailyGoalNum > 0 && `/ ${dailyGoalNum}`}
              </b>
              {!isGrid ? (
                <>
                  {" "}
                  {todayCount === 1 ? "time" : "times"} today{" "}
                  {detail.quantity !== 0 &&
                  detail.quantity &&
                  dailyGoalNum > 0 ? (
                    <>
                      <b>
                        ({(todayCount * detail.quantity).toLocaleString()} /{" "}
                        {(dailyGoalNum * detail.quantity).toLocaleString()})
                      </b>{" "}
                      {detail.unit}
                    </>
                  ) : null}
                </>
              ) : null}
            </span>
          </div>
          {!isGrid ? (
            <div className="flex items-center justify-end space-x-2 md:mt-2">
              <span
                id={`stop-${detail.id}`}
                className="text-supporting-light dark:text-supporting-dark hover:text-supporting-light/80 dark:hover:text-supporting-dark/80 hidden cursor-pointer"
              >
                <FontAwesomeIcon
                  className="text-2xl text-red-600 md:text-3xl"
                  icon={["fas", "stop"]}
                />
              </span>
              <Button
                id={`play-${detail.id}`}
                onClick={(e) => void handlePlayClick(e)}
                variant="ghost"
                size="icon"
              >
                <FontAwesomeIcon
                  className="text-2xl text-green-600 md:text-3xl"
                  icon={["fas", "play"]}
                />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      to="/$didjyahId"
                      params={{ didjyahId: detail.id }}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCustomDialogOpen(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Custom DidjYah
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    variant="destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>

        {dailyGoalNum > 0 ? (
          <Progress
            showPercentage={!isGrid}
            value={percentage}
            className={`w-full ${isGrid ? "h-1" : "h-3 md:h-4"}`}
          />
        ) : null}
      </div>

      {isGrid ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 bg-background/70 backdrop-blur-sm hover:bg-background"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem asChild>
              <Link
                to="/$didjyahId"
                params={{ didjyahId: detail.id }}
                onClick={(e) => e.stopPropagation()}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setCustomDialogOpen(true)
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Custom DidjYah
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setEditDialogOpen(true)
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setDeleteDialogOpen(true)
              }}
              variant="destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      <NoteRecordDialog
        key={noteDialogKey}
        open={noteDialogOpen}
        onOpenChange={(open) => {
          setNoteDialogOpen(open)
          if (!open) pendingTimestampRef.current = null
        }}
        didjyahName={detail.name}
        onConfirm={async (noteText) => {
          const timestamp = pendingTimestampRef.current ?? nowMs()
          try {
            const recordId = id()
            const trimmed = noteText.trim()
            await db.transact(
              db.tx.didjyahRecords[recordId]
                .update({
                  createdDate: timestamp,
                  updatedDate: timestamp,
                  endDate: timestamp,
                  ...(trimmed ? { note: trimmed } : {}),
                })
                .link({ didjyah: detail.id })
                .link({ owner: user.id }),
            )
            pendingTimestampRef.current = null
            registerAction({
              type: "create",
              entityType: "didjyahRecords",
              entityId: recordId,
              links: { didjyah: detail.id, owner: user.id },
              message: `Record added to "${detail.name}"`,
            })
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "An error occurred while adding the record."
            toast.error(message)
            throw error
          }
        }}
      />
      <CustomDidjyahDialog
        didjyah={detail}
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
      />
      <EditDidjyahDialog
        didjyah={detail}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      <DeleteDidjyahAlertDialog
        detail={detail}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  )
}

export default DidjyahCard
