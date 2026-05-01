import { db } from "@/lib/db"
import type { Profile } from "@/lib/types"

type UseUserResult = {
  user: ReturnType<typeof db.useUser>
  profile: Profile | undefined
  isLoading: boolean
  error: Error | undefined
}

export function useUserWithProfile(): UseUserResult {
  const user = db.useUser()
  const {
    data,
    isLoading,
    error: queryError,
  } = db.useQuery({
    profiles: {
      $: { where: { "user.id": user.id } },
    },
  })
  const profile = data?.profiles?.[0] as Profile | undefined

  const normalizedError: Error | undefined = queryError
    ? queryError instanceof Error
      ? queryError
      : new Error(
          (queryError as { message?: string }).message ?? String(queryError),
        )
    : undefined

  return { user, profile, isLoading, error: normalizedError }
}
