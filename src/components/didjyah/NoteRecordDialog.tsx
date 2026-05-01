import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
  CredenzaBody,
  CredenzaFooter,
} from "@/components/ui/credenza"

export type NoteRecordDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  didjyahName: string
  defaultValue?: string
  onConfirm: (note: string) => void | Promise<void>
}

export function NoteRecordDialog({
  open,
  onOpenChange,
  didjyahName,
  defaultValue = "",
  onConfirm,
}: NoteRecordDialogProps) {
  const [note, setNote] = React.useState(defaultValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void Promise.resolve(onConfirm(note)).then(
      () => {
        onOpenChange(false)
      },
      () => {
        /* stay open on failure */
      },
    )
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="overflow-y-auto sm:max-w-[425px]">
        <form onSubmit={handleSubmit} noValidate>
          <CredenzaHeader>
            <CredenzaTitle>Add a note</CredenzaTitle>
            <CredenzaDescription>
              Optional note for &quot;{didjyahName}&quot;.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody className="space-y-2">
            <Label htmlFor="record-note-input">Note</Label>
            <Input
              id="record-note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Type a note…"
              autoFocus
            />
          </CredenzaBody>
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
      </CredenzaContent>
    </Credenza>
  )
}

export default NoteRecordDialog
