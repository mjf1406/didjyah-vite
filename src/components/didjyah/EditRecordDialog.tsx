import React from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
  CredenzaBody,
  CredenzaFooter,
} from "@/components/ui/credenza"
import { useUndo, getEntityData } from "@/lib/undo"
import { nowMs } from "@/lib/time"

function dateToLocalDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const editRecordSchema = z
  .object({
    createdDate: z.string().min(1, "Date and time are required"),
    endDate: z.string().optional(),
    note: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.endDate?.trim()) return true
      return (
        new Date(data.endDate).getTime() >=
        new Date(data.createdDate).getTime()
      )
    },
    { message: "End must be on or after start", path: ["endDate"] },
  )

type EditRecordFormValues = z.infer<typeof editRecordSchema>

export type EditRecordDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  didjyahName: string
  record: {
    id: string
    createdDate?: number
    endDate?: number
    note?: string
  }
}

export function EditRecordDialog({
  open,
  onOpenChange,
  didjyahName,
  record,
}: EditRecordDialogProps) {
  const { registerAction } = useUndo()

  const form = useForm<EditRecordFormValues>({
    resolver: zodResolver(editRecordSchema),
    defaultValues: {
      createdDate: dateToLocalDateTime(new Date()),
      endDate: "",
      note: "",
    },
  })

  React.useEffect(() => {
    if (open) {
      const created = record.createdDate ?? nowMs()
      form.reset({
        createdDate: dateToLocalDateTime(new Date(created)),
        endDate:
          record.endDate != null
            ? dateToLocalDateTime(new Date(record.endDate))
            : "",
        note: record.note ?? "",
      })
    }
  }, [
    open,
    record.id,
    record.createdDate,
    record.endDate,
    record.note,
    form,
  ])

  const onSubmit: SubmitHandler<EditRecordFormValues> = async (data) => {
    try {
      const createdTs = new Date(data.createdDate).getTime()
      const now = nowMs()
      const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000
      const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000

      if (createdTs < oneYearAgo) {
        toast.error("Date cannot be more than one year in the past")
        return
      }

      if (createdTs > oneYearFromNow) {
        toast.error("Date cannot be more than one year in the future")
        return
      }

      const endTs = data.endDate?.trim()
        ? new Date(data.endDate).getTime()
        : createdTs

      if (endTs < createdTs) {
        toast.error("End must be on or after start")
        return
      }

      const trimmedNote = data.note?.trim() ?? ""
      const previousData = await getEntityData("didjyahRecords", record.id)
      if (!previousData) {
        toast.error("Could not load record to update")
        return
      }

      await db.transact(
        db.tx.didjyahRecords[record.id].update({
          createdDate: createdTs,
          endDate: endTs,
          note: trimmedNote,
          updatedDate: nowMs(),
        }),
      )

      registerAction({
        type: "update",
        entityType: "didjyahRecords",
        entityId: record.id,
        previousData,
        message: `Record updated in "${didjyahName}"`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error(error)
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while updating the record"
      toast.error(message)
    }
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="overflow-y-auto sm:max-w-[425px]">
        <CredenzaHeader>
          <CredenzaTitle>Edit record</CredenzaTitle>
          <CredenzaDescription>
            Update date, end time, or note for &quot;{didjyahName}&quot;.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="createdDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start (created)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End (optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      If empty, end time matches start.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional note" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CredenzaFooter className="flex flex-row gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </CredenzaFooter>
            </form>
          </Form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}

export default EditRecordDialog
