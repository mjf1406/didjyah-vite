import React from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { id } from "@instantdb/react"
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
import { useUndo } from "@/lib/undo"
import FAIconPicker from "@/components/didjyah/FAIconPicker"
import ColorPicker from "@/components/didjyah/ShadcnColorPicker"
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
import { FolderPlus } from "lucide-react"

const folderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional(),
  color: z.string().optional(),
  iconColor: z.string().optional(),
})

type FolderFormValues = z.infer<typeof folderSchema>

export function CreateFolderDialog() {
  const user = db.useUser()
  const [open, setOpen] = React.useState(false)
  const { registerAction } = useUndo()

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: "",
      icon: "fas|folder",
      color: "#e8e8e8",
      iconColor: "#000000",
    },
  })

  const onSubmit: SubmitHandler<FolderFormValues> = async (data) => {
    try {
      const now = nowMs()
      const folderId = id()

      const updateData: Record<string, unknown> = {
        name: data.name,
        createdDate: now,
        updatedDate: now,
      }

      if (data.icon) updateData.icon = data.icon
      if (data.color) updateData.color = data.color
      if (data.iconColor) updateData.iconColor = data.iconColor

      await db.transact(
        db.tx.didjyahFolders[folderId]
          .update(updateData)
          .link({ owner: user.id }),
      )

      registerAction({
        type: "create",
        entityType: "didjyahFolders",
        entityId: folderId,
        links: { owner: user.id },
        message: `Folder "${data.name}" created`,
      })

      form.reset({
        name: "",
        icon: "fas|folder",
        color: "#e8e8e8",
        iconColor: "#000000",
      })
      setOpen(false)
    } catch (error) {
      console.error(error)
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred"
      toast.error(message)
    }
  }

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>
        <Button variant="outline">
          <FolderPlus />
          <span className="hidden md:block">Create Folder</span>
        </Button>
      </CredenzaTrigger>
      <CredenzaContent className="overflow-y-auto sm:max-w-[425px]">
        <CredenzaHeader>
          <CredenzaTitle>Create Folder</CredenzaTitle>
          <CredenzaDescription>
            Group your DidjYahs into a folder. You can assign DidjYahs when you
            create or edit them.
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
                <Button type="submit">Create Folder</Button>
              </CredenzaFooter>
            </form>
          </Form>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  )
}

export default CreateFolderDialog
