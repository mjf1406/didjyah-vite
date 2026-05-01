import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"

export type Todo = InstaQLEntity<AppSchema, "todos">
export type Profile = InstaQLEntity<AppSchema, "profiles">
export type User = InstaQLEntity<AppSchema, "$users">
export type UserWithGuests = InstaQLEntity<
  AppSchema,
  "$users",
  { linkedGuestUsers: Record<string, never> }
>

export type GoogleJWTClaims = {
  given_name: string
  family_name: string
  email?: string
  picture?: string
}
