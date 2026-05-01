import React from "react"
import { toast } from "sonner"
import { db } from "@/lib/db"
import { useUndo, getEntityData } from "@/lib/undo"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"

type DidjyahWithRecords = InstaQLEntity<
  AppSchema,
  "didjyahs",
  { records: {} }
>

interface DeleteDidjyahAlertDialogProps {
  detail: DidjyahWithRecords
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DeleteDidjyahAlertDialog: React.FC<DeleteDidjyahAlertDialogProps> = ({
  detail,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen
  const { registerAction } = useUndo()

  const handleDelete = async () => {
    try {
      const previousData = await getEntityData("didjyahs", detail.id)
      const ownerId = (detail as { owner?: { id: string } }).owner?.id

      await db.transact(db.tx.didjyahs[detail.id].delete())
      setOpen(false)

      if (previousData && ownerId) {
        registerAction({
          type: "delete",
          entityType: "didjyahs",
          entityId: detail.id,
          previousData,
          links: { owner: ownerId },
          message: `Didjyah "${detail.name}" deleted`,
        })
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while deleting the didjyah."
      toast.error(message)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined ? (
        <AlertDialogTrigger asChild>
          <Button id={`delete-${detail.id}`} variant="ghost" size="icon">
            <Trash />
          </Button>
        </AlertDialogTrigger>
      ) : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {detail.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <b>{detail.name}</b>? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => void handleDelete()}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteDidjyahAlertDialog
