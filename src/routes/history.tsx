import { createFileRoute } from "@tanstack/react-router"

import { db } from "@/lib/db"
import EnsureProfile from "@/components/EnsureProfile"
import { DidjyahHistoryContent } from "@/components/didjyah/HistoryContent"

export type HistorySearch = {
  page?: number
  didjyahs?: string
  startDate?: string
  endDate?: string
}

export const Route = createFileRoute("/history")({
  validateSearch: (
    raw: Record<string, unknown> | undefined,
  ): HistorySearch => {
    const r = raw ?? {}
    const page = Number(r.page)
    return {
      page: Number.isFinite(page) && page > 0 ? page : undefined,
      didjyahs:
        typeof r.didjyahs === "string" && r.didjyahs.length > 0
          ? r.didjyahs
          : undefined,
      startDate:
        typeof r.startDate === "string" && r.startDate.length > 0
          ? r.startDate
          : undefined,
      endDate:
        typeof r.endDate === "string" && r.endDate.length > 0
          ? r.endDate
          : undefined,
    }
  },
  component: HistoryPage,
})

function HistoryPage() {
  return (
    <>
      <db.SignedIn>
        <EnsureProfile />
        <DidjyahHistoryContent />
      </db.SignedIn>
      <db.SignedOut>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-xl font-bold">
              Sign in to view DidjYah History
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please sign in to view your DidjYah records history.
            </p>
          </div>
        </div>
      </db.SignedOut>
    </>
  )
}
