import { useEffect } from "react"
import { useRegisterSW } from "virtual:pwa-register/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

/** Shows a top-center toast when a new service worker is waiting; Refresh applies the update. */
export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error("SW registration error", error)
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    const id = toast("A new version is available", {
      description: "Refresh to get the latest improvements.",
      position: "top-center",
      duration: Infinity,
      closeButton: true,
      action: (
        <Button
          size="sm"
          onClick={() => {
            void updateServiceWorker(true)
          }}
        >
          Refresh
        </Button>
      ),
      onDismiss: () => setNeedRefresh(false),
    })
    return () => {
      toast.dismiss(id)
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  return null
}
