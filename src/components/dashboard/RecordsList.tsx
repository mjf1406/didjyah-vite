import { useState } from "react"
import { db } from "@/lib/db"
import { getErrorMessage } from "@/lib/errors"
import { syncLastRecordedAtForDidjyah } from "@/lib/records"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { CircleX, Clock, Edit, Trash } from "lucide-react"
import { toast } from "sonner"
import { useUndo, getEntityData } from "@/lib/undo"
import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"
import { EditRecordDialog } from "@/components/didjyah/EditRecordDialog"
import { RecordDurationDisplay } from "@/components/didjyah/RecordDurationDisplay"

const PAGE_SIZE = 20

/* eslint-disable @typescript-eslint/no-empty-object-type -- InstaQL nested link shapes */
type DidjyahRecordWithLinks = InstaQLEntity<
  AppSchema,
  "didjyahRecords",
  { didjyah: {}; owner: {} }
>
/* eslint-enable @typescript-eslint/no-empty-object-type */

interface RecordsListProps {
  didjyah: {
    id: string
    name: string
    stopwatch?: boolean | null
  }
}

export default function RecordsList({ didjyah }: RecordsListProps) {
  const user = db.useUser()
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  const [editDialogRecord, setEditDialogRecord] =
    useState<DidjyahRecordWithLinks | null>(null)
  const { registerAction } = useUndo()

  const { data, isLoading, error } = db.useQuery({
    didjyahRecords: {
      $: {
        where: {
          "didjyah.id": didjyah.id,
          "owner.id": user.id,
        },
        order: { createdDate: "desc" },
        limit: PAGE_SIZE,
        offset: (currentPage - 1) * PAGE_SIZE,
      },
      didjyah: {},
      owner: {},
    },
  })

  const records = (data?.didjyahRecords || []) as DidjyahRecordWithLinks[]
  const hasNextPage = records.length === PAGE_SIZE
  const hasPrevPage = currentPage > 1

  const handleDelete = async (recordId: string) => {
    try {
      const record = records.find((r) => r.id === recordId)
      if (!record) return

      const previousData = await getEntityData("didjyahRecords", recordId)
      const didjyahId = record.didjyah?.id ?? didjyah.id
      const ownerId = record.owner?.id ?? user.id

      await db.transact(db.tx.didjyahRecords[recordId].delete())
      await syncLastRecordedAtForDidjyah(didjyahId, ownerId)
      setDeleteDialogOpen(null)

      if (previousData && didjyahId && ownerId) {
        registerAction({
          type: "delete",
          entityType: "didjyahRecords",
          entityId: recordId,
          previousData,
          links: { didjyah: didjyahId, owner: ownerId },
          message: `Record deleted from "${didjyah.name}"`,
        })
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred while deleting the record."
      toast.error(message)
    }
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Unknown date"
    const date = new Date(timestamp)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <CircleX className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (currentPage === 1 && records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No records yet. Start tracking to see them here!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {records.map((record, index) => {
            const rank = (currentPage - 1) * PAGE_SIZE + index + 1
            return (
              <div
                key={record.id}
                className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-semibold">Record #{rank}</div>
                  <p className="text-sm text-muted-foreground">
                    Created: {formatDate(record.createdDate)}
                  </p>
                  {record.endDate != null &&
                  record.endDate !== record.createdDate ? (
                    <p className="text-sm text-muted-foreground">
                      Ended: {formatDate(record.endDate)}
                    </p>
                  ) : null}
                  <RecordDurationDisplay
                    createdDate={record.createdDate}
                    endDate={record.endDate}
                    stopwatchEnabled={didjyah.stopwatch}
                  />
                  {record.note ? (
                    <p className="truncate text-sm text-muted-foreground">
                      Note: {record.note}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    aria-label="Edit record"
                    onClick={() => setEditDialogRecord(record)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    aria-label="Delete record"
                    onClick={() => setDeleteDialogOpen(record.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  <AlertDialog
                    open={deleteDialogOpen === record.id}
                    onOpenChange={(open) =>
                      setDeleteDialogOpen(open ? record.id : null)
                    }
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete record?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this record from{" "}
                          <b>{didjyah.name}</b>? You can undo from the toast.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void handleDelete(record.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )
          })}

          {(hasPrevPage || hasNextPage) && (
            <div className="pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (hasPrevPage) {
                          setCurrentPage((page) => page - 1)
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }
                      }}
                      className={
                        !hasPrevPage
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (hasNextPage) {
                          setCurrentPage((page) => page + 1)
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }
                      }}
                      className={
                        !hasNextPage
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Page {currentPage}
            {records.length > 0
              ? ` · showing ${records.length} record${records.length === 1 ? "" : "s"}`
              : ""}
          </div>
        </CardContent>
      </Card>

      {editDialogRecord ? (
        <EditRecordDialog
          open={!!editDialogRecord}
          onOpenChange={(open) => {
            if (!open) setEditDialogRecord(null)
          }}
          didjyahName={didjyah.name}
          didjyahId={didjyah.id}
          ownerId={user.id}
          record={{
            id: editDialogRecord.id,
            createdDate: editDialogRecord.createdDate,
            endDate: editDialogRecord.endDate,
            note: editDialogRecord.note,
          }}
        />
      ) : null}
    </>
  )
}
