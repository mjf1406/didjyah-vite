import * as React from "react"

export type ViewMode = "list" | "grid"

const STORAGE_KEY = "didjyah-view-mode"

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "list"
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "list" || stored === "grid") return stored
  return "list"
}

export function useViewMode(): [ViewMode, (value: ViewMode) => void] {
  const [viewMode, setViewMode] = React.useState<ViewMode>(readStoredViewMode)

  React.useEffect(() => {
    const handleStorageChange = () => {
      setViewMode(readStoredViewMode())
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("viewModeChange", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("viewModeChange", handleStorageChange)
    }
  }, [])

  const setViewModeWithStorage = React.useCallback((value: ViewMode) => {
    setViewMode(value)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, value)
      window.dispatchEvent(new Event("viewModeChange"))
    }
  }, [])

  return [viewMode, setViewModeWithStorage]
}
