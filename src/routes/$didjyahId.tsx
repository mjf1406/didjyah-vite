import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"

import { db } from "@/lib/db"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { CircleX, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import EnsureProfile from "@/components/EnsureProfile"
import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"
import DashboardStats from "@/components/dashboard/DashboardStats"
import RecordsChart from "@/components/dashboard/RecordsChart"
import StreakTracker from "@/components/dashboard/StreakTracker"
import GoalProgress from "@/components/dashboard/GoalProgress"
import RecordsList from "@/components/dashboard/RecordsList"

type DidjyahWithRecords = InstaQLEntity<
  AppSchema,
  "didjyahs",
  { owner: {}; records: {} }
>

export const Route = createFileRoute("/$didjyahId")({
  component: DidjyahDashboardRoute,
  pendingComponent: DashboardPending,
})

function DashboardPending() {
  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" disabled>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
      <Skeleton className="h-64" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  )
}

function DidjyahDashboardRoute() {
  return (
    <>
      <db.SignedIn>
        <EnsureProfile />
        <DidjyahDashboard />
      </db.SignedIn>
      <db.SignedOut>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-xl font-bold">Sign in to view dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please sign in to view your didjyah analytics.
            </p>
          </div>
        </div>
      </db.SignedOut>
    </>
  )
}

function DidjyahDashboard() {
  const { didjyahId } = Route.useParams()
  const navigate = useNavigate()
  const user = db.useUser()

  const { data, isLoading, error } = db.useQuery({
    didjyahs: {
      $: {
        where: {
          id: didjyahId,
          "owner.id": user.id,
        },
      },
      records: {},
    },
  })

  if (isLoading) {
    return <DashboardPending />
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Alert variant="destructive">
          <CircleX className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "An error occurred"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const didjyah = data?.didjyahs?.[0] as DidjyahWithRecords | undefined

  if (!didjyah) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Alert>
          <AlertTitle>Didjyah not found</AlertTitle>
          <AlertDescription>
            This didjyah doesn&apos;t exist or you don&apos;t have access to it.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link to="/">Back to list</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => navigate({ to: "/" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{didjyah.name}</h1>
          {didjyah.description ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {didjyah.description}
            </p>
          ) : null}
        </div>
      </div>

      <DashboardStats didjyah={didjyah} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecordsChart didjyah={didjyah} />
        <GoalProgress didjyah={didjyah} />
      </div>
      <StreakTracker didjyah={didjyah} />
      <RecordsList didjyah={didjyah} />
    </div>
  )
}
