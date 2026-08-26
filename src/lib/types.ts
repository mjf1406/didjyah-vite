import type { InstaQLEntity } from "@instantdb/react"
import type { AppSchema } from "@/instant.schema"

export type Todo = InstaQLEntity<AppSchema, "todos">
export type Profile = InstaQLEntity<AppSchema, "profiles">
export type User = InstaQLEntity<AppSchema, "$users">
/* eslint-disable @typescript-eslint/no-empty-object-type -- InstaQL nested link shapes */
export type UserWithGuests = InstaQLEntity<
  AppSchema,
  "$users",
  { linkedGuestUsers: {} }
>
/* eslint-enable @typescript-eslint/no-empty-object-type */

export type GoogleJWTClaims = {
  given_name: string
  family_name: string
  email?: string
  picture?: string
}
