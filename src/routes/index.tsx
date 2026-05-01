import { createFileRoute } from "@tanstack/react-router"

import { db } from "@/lib/db"
import DidjyahList from "@/components/didjyah/DidjyahList"

export const Route = createFileRoute("/")({
  component: DidjyahHomePage,
})

function DidjyahHomePage() {
  return (
    <>
      <db.SignedIn>
        <main className="p-2 md:p-4">
          <DidjyahList />
        </main>
      </db.SignedIn>
      <db.SignedOut>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-xl font-bold">Sign in to use DidjYah</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please sign in to track your activities.
            </p>
          </div>
        </div>
      </db.SignedOut>
    </>
  )
}
