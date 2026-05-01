import React, { useEffect } from "react"
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
import { nowMs } from "@/lib/time"
import { useUndo, getEntityData } from "@/lib/undo"
import FAIconPicker from "@/components/didjyah/FAIconPicker"
import ColorPicker from "@/components/didjyah/ShadcnColorPicker"
import { Edit } from "lucide-react"
import type { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core"
import {
  Credenza,
  CredenzaTrigger,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
  CredenzaBody,
  CredenzaFooter,
} from "@/components/ui/credenza"
import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"

/* eslint-disable @typescript-eslint/no-empty-object-type -- InstaQL nested link shapes */
type DidjyahFolderEntity = InstaQLEntity<AppSchema, "didjyahFolders", {}>
/* eslint-enable @typescript-eslint/no-empty-object-type */

const folderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional(),
  color: z.string().optional(),
  iconColor: z.string().optional(),
})

type FolderFormValues = z.infer<typeof folderSchema>

interface EditFolderDialogProps {
  folder: DidjyahFolderEntity
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EditFolderDialog({
  folder,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EditFolderDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen
  const { registerAction } = useUndo()

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: folder.name,
      icon: folder.icon ?? "fas|folder",
      color: folder.color ?? "#e8e8e8",
      iconColor: folder.iconColor ?? "#000000",
    },
  })

  useEffect(() => {
    form.reset({
      name: folder.name,
      icon: folder.icon ?? "fas|folder",
      color: folder.color ?? "#e8e8e8",
      iconColor: folder.iconColor ?? "#000000",
    })
  }, [folder, form])

  const onSubmit: SubmitHandler<FolderFormValues> = async (data) => {
    try {
      const previousData = await getEntityData("didjyahFolders", folder.id)

      const now = nowMs()

      const updateData: Record<string, unknown> = {
        name: data.name,
        updatedDate: now,
      }

      if (data.icon) updateData.icon = data.icon
      if (data.color) updateData.color = data.color
      if (data.iconColor) updateData.iconColor = data.iconColor

      await db.transact(db.tx.didjyahFolders[folder.id].update(updateData))

      if (previousData) {
        registerAction({
          type: "update",
          entityType: "didjyahFolders",
          entityId: folder.id,
          previousData,
          newData: updateData,
          message: `Folder "${data.name}" updated`,
        })
      }

      form.reset()
      setOpen(false)
    } catch (error) {
      console.error(error)
      const message =
        error instanceof Error ? error.message : "Error updating folder"
      toast.error(message)
    }
  }

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined ? (
        <CredenzaTrigger asChild>
          <Button variant="ghost" size="icon">
            <Edit />
          </Button>
        </CredenzaTrigger>
      ) : null}
      <CredenzaContent className="overflow-y-auto sm:max-w-[425px]">
        <CredenzaHeader>
          <CredenzaTitle>Edit Folder</CredenzaTitle>
          <CredenzaDescription>
            Update the details for {folder.name}.
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Folder name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <FAIconPicker
                        selectedIcon={
                          field.value?.includes("|")
                            ? (() => {
                                const [prefix, name] = field.value.split("|")
                                return prefix && name
                                  ? ({
                                      prefix: prefix as IconPrefix,
                                      name: name as IconName,
                                    } as const)
                                  : undefined
                              })()
                            : undefined
                        }
                        onSelectIcon={(iconName, prefix) =>
                          field.onChange(`${prefix}|${iconName}`)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iconColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon Color</FormLabel>
                    <FormControl>
                      <ColorPicker
                        selectedColor={field.value ?? "#000000"}
                        onSelectColor={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <ColorPicker
                        selectedColor={field.value ?? "#e8e8e8"}
                        onSelectColor={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CredenzaFooter>
                <Button type="submit">Save Changes</Button>
              </CredenzaFooter>
            </form>
          </Form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}

export default EditFolderDialog
