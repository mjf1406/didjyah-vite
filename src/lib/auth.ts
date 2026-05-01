import { db } from "@/lib/db"
import type { GoogleJWTClaims } from "@/lib/types"

export function parseGoogleIdToken(idToken: string): GoogleJWTClaims {
  const base64Url = idToken.split(".")[1]
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  )
  const decoded = atob(padded)
  return JSON.parse(decoded) as GoogleJWTClaims
}

export async function signInWithGoogle(
  credential: string,
  nonce: string,
): Promise<void> {
  const claims = parseGoogleIdToken(credential)
  const { user } = await db.auth.signInWithIdToken({
    clientName: import.meta.env.VITE_GOOGLE_CLIENT_NAME!,
    idToken: credential,
    nonce,
  })

  await db.transact(
    db.tx.profiles[user.id]
      .update({
        firstName: claims.given_name,
        lastName: claims.family_name,
        googlePicture: claims.picture,
        joined: new Date(),
        plan: "free",
      })
      .link({ user: user.id }),
  )
}
