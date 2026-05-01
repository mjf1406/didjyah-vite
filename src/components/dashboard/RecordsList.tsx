import React, { useState } from "react"
import { db } from "@/lib/db"
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
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

const PAGE_SIZE = 20

type DidjyahRecordWithLinks = InstaQLEntity<
  AppSchema,
  "didjyahRecords",
  { didjyah: {}; owner: {} }
>

interface RecordsListProps {
  didjyah: {
    id: string
    name: string
  }
}

export default function RecordsList({ didjyah }: RecordsListProps) {
  const user = db.useUser()
  const [requestedPage, setRequestedPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  const [editDialogRecord, setEditDialogRecord] =
    useState<DidjyahRecordWithLinks | null>(null)
  const { registerAction } = useUndo()

  const { data: countData, isLoading: isLoadingCount } = db.useQuery({
    didjyahRecords: {
      $: {
        where: {
          "didjyah.id": didjyah.id,
          "owner.id": user.id,
        },
      },
    },
  })

  const allRecords = (countData?.didjyahRecords ||
    []) as DidjyahRecordWithLinks[]
  const totalRecords = allRecords.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))
  const currentPage = Math.min(requestedPage, totalPages)

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

  const isLoadingData = isLoadingCount || isLoading

  const handleDelete = async (recordId: string) => {
    try {
      const record = allRecords.find((r) => r.id === recordId)
      if (!record) return

      const previousData = await getEntityData("didjyahRecords", recordId)
      const didjyahId = record.didjyah?.id ?? didjyah.id
      const ownerId = record.owner?.id ?? user.id

      await db.transact(db.tx.didjyahRecords[recordId].delete())
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

  if (isLoadingData) {
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
            <AlertDescription>
              {error instanceof Error ? error.message : "An error occurred"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (totalRecords === 0) {
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

          {totalPages > 1 ? (
            <div className="pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage > 1) {
                          setRequestedPage(currentPage - 1)
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (page === 1) return true
                      if (page === totalPages) return true
                      if (Math.abs(page - currentPage) <= 1) return true
                      return false
                    })
                    .map((page, index, array) => {
                      const showEllipsisBefore =
                        index > 0 && array[index - 1] !== page - 1
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore ? (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : null}
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setRequestedPage(page)
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                })
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      )
                    })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage < totalPages) {
                          setRequestedPage(currentPage + 1)
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}

          <div className="text-sm text-muted-foreground">
            Showing{" "}
            {records.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0} to{" "}
            {Math.min(currentPage * PAGE_SIZE, totalRecords)} of {totalRecords}{" "}
            records
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
