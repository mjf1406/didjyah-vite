import React, { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"
import { APP_NAME } from "@/lib/constants"
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

type DidjyahWithRecords = InstaQLEntity<
  AppSchema,
  "didjyahs",
  { records: {} }
>

const didjyahSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["since", "timer", "stopwatch", "daily", "goal"]),
  icon: z.string().optional(),
  color: z.string().optional(),
  iconColor: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().optional(),
  dailyGoal: z.number().optional(),
  timer: z.number().optional(),
  stopwatch: z.boolean().optional(),
  inputs: z.string().optional(),
  sinceLast: z.boolean().optional(),
  note: z.boolean().optional(),
})

type DidjyahFormValues = z.infer<typeof didjyahSchema>

interface EditDidjyahDialogProps {
  didjyah: DidjyahWithRecords
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EditDidjyahDialog({
  didjyah,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EditDidjyahDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen
  const { registerAction } = useUndo()
  const form = useForm<DidjyahFormValues>({
    resolver: zodResolver(didjyahSchema),
    defaultValues: {
      name: didjyah.name,
      type:
        (didjyah.type as
          | "since"
          | "timer"
          | "stopwatch"
          | "daily"
          | "goal") || "since",
      icon: didjyah.icon ?? "",
      color: didjyah.color ?? "#000000",
      iconColor: didjyah.iconColor ?? "#000000",
      description: didjyah.description ?? "",
      unit: didjyah.unit ?? "",
      quantity: didjyah.quantity,
      dailyGoal: didjyah.dailyGoal,
      timer: didjyah.timer,
      stopwatch: didjyah.stopwatch ?? false,
      inputs:
        typeof didjyah.inputs === "string"
          ? didjyah.inputs
          : didjyah.inputs
            ? JSON.stringify(didjyah.inputs)
            : "",
      sinceLast: didjyah.sinceLast ?? false,
      note: didjyah.note ?? false,
    },
  })

  useEffect(() => {
    form.reset({
      name: didjyah.name,
      type:
        (didjyah.type as
          | "since"
          | "timer"
          | "stopwatch"
          | "daily"
          | "goal") || "since",
      icon: didjyah.icon ?? "",
      color: didjyah.color ?? "#000000",
      iconColor: didjyah.iconColor ?? "#000000",
      description: didjyah.description ?? "",
      unit: didjyah.unit ?? "",
      quantity: didjyah.quantity,
      dailyGoal: didjyah.dailyGoal,
      timer: didjyah.timer,
      stopwatch: didjyah.stopwatch ?? false,
      inputs:
        typeof didjyah.inputs === "string"
          ? didjyah.inputs
          : didjyah.inputs
            ? JSON.stringify(didjyah.inputs)
            : "",
      sinceLast: didjyah.sinceLast ?? false,
      note: didjyah.note ?? false,
    })
  }, [didjyah, form])

  const onSubmit: SubmitHandler<DidjyahFormValues> = async (data) => {
    try {
      const previousData = await getEntityData("didjyahs", didjyah.id)

      let parsedInputs: unknown = null
      if (data.inputs) {
        try {
          parsedInputs = JSON.parse(data.inputs)
        } catch {
          parsedInputs = data.inputs
        }
      }

      const now = nowMs()

      const updateData: Record<string, unknown> = {
        name: data.name,
        type: data.type,
        updatedDate: now,
      }

      if (data.icon) updateData.icon = data.icon
      if (data.color) updateData.color = data.color
      if (data.iconColor) updateData.iconColor = data.iconColor
      if (data.description) updateData.description = data.description
      if (data.unit) updateData.unit = data.unit
      if (data.quantity !== undefined) updateData.quantity = data.quantity
      if (data.dailyGoal !== undefined) updateData.dailyGoal = data.dailyGoal
      if (data.timer !== undefined) updateData.timer = data.timer
      if (data.stopwatch !== undefined) updateData.stopwatch = data.stopwatch
      if (data.sinceLast !== undefined) updateData.sinceLast = data.sinceLast
      if (data.note !== undefined) updateData.note = data.note
      if (parsedInputs !== null) updateData.inputs = parsedInputs

      await db.transact(db.tx.didjyahs[didjyah.id].update(updateData))

      if (previousData) {
        registerAction({
          type: "update",
          entityType: "didjyahs",
          entityId: didjyah.id,
          previousData,
          newData: updateData,
          message: `Didjyah "${data.name}" updated`,
        })
      }

      form.reset()
      setOpen(false)
    } catch (error) {
      console.error(error)
      const message =
        error instanceof Error
          ? error.message
          : `Error updating ${APP_NAME}`
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
          <CredenzaTitle>Edit {APP_NAME}</CredenzaTitle>
          <CredenzaDescription>
            Update the details for {didjyah.name}.
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
                      <Input placeholder="Didjyah Name" {...field} />
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="Unit of measure" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value)
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dailyGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Goal</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Daily Goal"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value)
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timer (in seconds)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Timer value"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value)
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stopwatch"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-4">
                    <FormLabel>Use Stopwatch</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sinceLast"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-4">
                    <FormLabel>Since Last</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-4">
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inputs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inputs (JSON)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g., {"blah": "example"}'
                        {...field}
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

export default EditDidjyahDialog
