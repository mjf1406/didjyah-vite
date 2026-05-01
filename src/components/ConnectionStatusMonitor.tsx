import { useEffect, useRef } from "react"
import { db } from "@/lib/db"
import { toast } from "sonner"

export default function ConnectionStatusMonitor() {
  const status = db.useConnectionStatus()
  const previousStatusRef = useRef<string | null>(null)
  const toastIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    if (previousStatusRef.current === null) {
      previousStatusRef.current = status
      return
    }

    if (previousStatusRef.current === status) {
      return
    }

    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }

    const statusMap: Record<
      string,
      { message: string; type: "info" | "success" | "error" }
    > = {
      connecting: {
        message: "Connecting to database...",
        type: "info",
      },
      opened: {
        message: "Authenticating...",
        type: "info",
      },
      authenticated: {
        message: "Connected! You're back online.",
        type: "success",
      },
      closed: {
        message: "Connection closed. Reconnecting...",
        type: "info",
      },
      errored: {
        message:
          "Connection error. Please check your internet connection.",
        type: "error",
      },
    }

    const statusInfo = statusMap[status]
    if (statusInfo) {
      const toastOptions = {
        duration: status === "authenticated" ? 3000 : Infinity,
      }

      if (statusInfo.type === "success") {
        toastIdRef.current = toast.success(statusInfo.message, toastOptions)
      } else if (statusInfo.type === "error") {
        toastIdRef.current = toast.error(statusInfo.message, toastOptions)
      } else {
        toastIdRef.current = toast.info(statusInfo.message, toastOptions)
      }
    }

    previousStatusRef.current = status
  }, [status])

  useEffect(() => {
    return () => {
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current)
      }
    }
  }, [])

  return null
}
