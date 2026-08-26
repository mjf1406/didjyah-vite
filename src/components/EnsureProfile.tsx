import React from "react"
import { toast } from "sonner"
import { db } from "@/lib/db"
import { getErrorMessage } from "@/lib/errors"

type EnsureProfileProps = {
  defaults?: {
    firstName?: string
    lastName?: string
    googlePicture?: string
    plan?: string
  }
}

export default function EnsureProfile({ defaults }: EnsureProfileProps) {
  const user = db.useUser()
  const { data, isLoading, error } = db.useQuery({
    profiles: { $: { where: { "user.id": user.id } } },
  })
  const attemptRef = React.useRef<"idle" | "pending" | "done" | "failed">(
    "idle",
  )
  const existingProfile = data?.profiles?.[0]

  const existingProfileId = existingProfile?.id

  React.useEffect(() => {
    if (!user?.id) return
    if (user.isGuest) return
    if (isLoading) return
    if (existingProfileId) {
      attemptRef.current = "done"
      return
    }
    if (attemptRef.current === "pending" || attemptRef.current === "failed") {
      return
    }

    attemptRef.current = "pending"
    const firstName = defaults?.firstName ?? ""
    const lastName = defaults?.lastName ?? ""
    const googlePicture = defaults?.googlePicture
    const plan = defaults?.plan ?? "free"

    void db
      .transact(
        db.tx.profiles[user.id]
          .update({
            joined: new Date(),
            plan,
            firstName,
            lastName,
            googlePicture,
          })
          .link({ user: user.id }),
      )
      .then(() => {
        attemptRef.current = "done"
      })
      .catch((createError: unknown) => {
        attemptRef.current = "failed"
        toast.error(
          `Could not create your profile: ${getErrorMessage(createError)}`,
        )
      })
  }, [
    user?.id,
    user?.isGuest,
    isLoading,
    existingProfileId,
    defaults?.firstName,
    defaults?.lastName,
    defaults?.googlePicture,
    defaults?.plan,
  ])

  if (error) {
    console.error("Failed to load profile:", error)
  }

  return null
}
