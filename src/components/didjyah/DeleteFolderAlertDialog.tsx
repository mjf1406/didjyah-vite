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

/* eslint-disable @typescript-eslint/no-empty-object-type -- InstaQL nested link shapes */
type DidjyahFolderEntity = InstaQLEntity<AppSchema, "didjyahFolders", {}>
/* eslint-enable @typescript-eslint/no-empty-object-type */

interface DeleteFolderAlertDialogProps {
  folder: DidjyahFolderEntity
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DeleteFolderAlertDialog: React.FC<DeleteFolderAlertDialogProps> = ({
  folder,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen
  const { registerAction } = useUndo()

  const handleDelete = async () => {
    try {
      const previousData = await getEntityData("didjyahFolders", folder.id)
      const ownerId = (folder as { owner?: { id: string } }).owner?.id

      await db.transact(db.tx.didjyahFolders[folder.id].delete())
      setOpen(false)

      if (previousData && ownerId) {
        registerAction({
          type: "delete",
          entityType: "didjyahFolders",
          entityId: folder.id,
          previousData,
          links: { owner: ownerId },
          message: `Folder "${folder.name}" deleted`,
        })
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while deleting the folder."
      toast.error(message)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined ? (
        <AlertDialogTrigger asChild>
          <Button id={`delete-folder-${folder.id}`} variant="ghost" size="icon">
            <Trash />
          </Button>
        </AlertDialogTrigger>
      ) : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {folder.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this folder? DidjYahs in this folder
            will not be deleted—they will appear in your main list again.
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

export default DeleteFolderAlertDialog
