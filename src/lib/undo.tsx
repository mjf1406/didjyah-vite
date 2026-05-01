import React, { createContext, useContext, useState, useCallback } from "react"
import { toast } from "sonner"
import { db } from "@/lib/db"

type ActionType = "create" | "update" | "delete"

type UndoableAction = {
  type: ActionType
  entityType: "todos" | "didjyahs" | "didjyahRecords" | "didjyahFolders"
  entityId: string
  previousData?: Record<string, unknown>
  newData?: Record<string, unknown>
  links?: Record<string, string>
  message: string
}

type UndoContextType = {
  registerAction: (action: UndoableAction) => void
  undoLastAction: () => Promise<void>
  hasUndoableAction: boolean
}

const UndoContext = createContext<UndoContextType | undefined>(undefined)

export function UndoProvider({ children }: { children: React.ReactNode }) {
  const [lastAction, setLastAction] = useState<UndoableAction | null>(null)
  const [toastId, setToastId] = useState<string | number | null>(null)

  const undoAction = useCallback(async (action: UndoableAction) => {
    try {
      switch (action.type) {
        case "create":
          await db.transact(db.tx[action.entityType][action.entityId].delete())
          toast.success("Action undone")
          break

        case "delete":
          if (action.previousData && action.links) {
            let tx = db.tx[action.entityType][action.entityId].update(
              action.previousData,
            )

            Object.entries(action.links).forEach(([key, value]) => {
              tx = tx.link({ [key]: value })
            })

            await db.transact(tx)
          }
          toast.success("Action undone")
          break

        case "update":
          if (action.previousData) {
            await db.transact(
              db.tx[action.entityType][action.entityId].update(
                action.previousData,
              ),
            )
          }
          toast.success("Action undone")
          break
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to undo action"
      toast.error(message)
    }
  }, [])

  const registerAction = useCallback(
    (action: UndoableAction) => {
      setLastAction(action)

      if (toastId !== null) {
        toast.dismiss(toastId)
      }

      const newToastId = toast.success(action.message, {
        action: {
          label: "Undo",
          onClick: async () => {
            await undoAction(action)
            setLastAction(null)
            setToastId(null)
          },
        },
        duration: 5000,
      })

      setToastId(newToastId)

      setTimeout(() => {
        setLastAction(null)
        setToastId(null)
      }, 5000)
    },
    [toastId, undoAction],
  )

  const undoLastAction = useCallback(async () => {
    if (lastAction) {
      await undoAction(lastAction)
      setLastAction(null)
      if (toastId !== null) {
        toast.dismiss(toastId)
        setToastId(null)
      }
    }
  }, [lastAction, toastId, undoAction])

  return (
    <UndoContext.Provider
      value={{
        registerAction,
        undoLastAction,
        hasUndoableAction: lastAction !== null,
      }}
    >
      {children}
    </UndoContext.Provider>
  )
}

export function useUndo() {
  const context = useContext(UndoContext)
  if (context === undefined) {
    throw new Error("useUndo must be used within an UndoProvider")
  }
  return context
}

export async function getEntityData(
  entityType: "todos" | "didjyahs" | "didjyahRecords" | "didjyahFolders",
  entityId: string,
): Promise<Record<string, unknown> | null> {
  try {
    let data: {
      todos?: unknown[]
      didjyahs?: unknown[]
      didjyahRecords?: unknown[]
      didjyahFolders?: unknown[]
    }

    switch (entityType) {
      case "todos":
        ;({ data } = await db.queryOnce({
          todos: {
            $: { where: { id: entityId } },
          },
        }))
        break
      case "didjyahs":
        ;({ data } = await db.queryOnce({
          didjyahs: {
            $: { where: { id: entityId } },
          },
        }))
        break
      case "didjyahRecords":
        ;({ data } = await db.queryOnce({
          didjyahRecords: {
            $: { where: { id: entityId } },
          },
        }))
        break
      case "didjyahFolders":
        ;({ data } = await db.queryOnce({
          didjyahFolders: {
            $: { where: { id: entityId } },
          },
        }))
        break
    }

    const entity = data?.[entityType]?.[0] as { id?: string } | undefined
    if (!entity) return null

    const { id, ...dataFields } = entity
    void id
    return dataFields as Record<string, unknown>
  } catch (error) {
    console.error("Error fetching entity data:", error)
    return null
  }
}
