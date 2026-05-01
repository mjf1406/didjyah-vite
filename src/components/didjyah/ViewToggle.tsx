import { List, LayoutGrid } from "lucide-react"
import { useViewMode } from "@/components/didjyah/useViewMode"

export function ViewToggle() {
  const [viewMode, setViewModeWithStorage] = useViewMode()

  const toggleView = () => {
    const newMode = viewMode === "list" ? "grid" : "list"
    setViewModeWithStorage(newMode)
  }

  const isGridView = viewMode === "grid"

  return (
    <button
      type="button"
      onClick={toggleView}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400/20 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
      aria-label={isGridView ? "Switch to list view" : "Switch to grid view"}
    >
      <List
        className={`h-[1.2rem] w-[1.2rem] transition-all ${
          isGridView ? "-rotate-90 scale-0" : "rotate-0 scale-100"
        }`}
      />
      <LayoutGrid
        className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${
          isGridView ? "rotate-0 scale-100" : "rotate-90 scale-0"
        }`}
      />
      <span className="sr-only">Toggle view</span>
    </button>
  )
}
