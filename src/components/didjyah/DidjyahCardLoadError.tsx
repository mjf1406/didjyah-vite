import { getErrorMessage } from "@/lib/errors"
import { AlertCircle } from "lucide-react"

interface DidjyahCardLoadErrorProps {
  name: string
  error: unknown
  viewMode?: "list" | "grid"
}

export default function DidjyahCardLoadError({
  name,
  error,
  viewMode = "list",
}: DidjyahCardLoadErrorProps) {
  const isGrid = viewMode === "grid"

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-2 ${
        isGrid ? "w-full flex-col" : "w-full max-w-[450px] flex-row"
      }`}
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="min-w-0">
        <p
          className={`truncate font-semibold ${
            isGrid ? "text-[10px] lg:text-sm" : "text-xs md:text-sm"
          }`}
        >
          {name}
        </p>
        <p
          className={`text-destructive ${
            isGrid ? "text-[9px] lg:text-xs" : "text-[10px] md:text-xs"
          }`}
        >
          {getErrorMessage(error)}
        </p>
      </div>
    </div>
  )
}
