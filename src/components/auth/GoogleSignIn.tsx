import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google"
import { signInWithGoogle } from "@/lib/auth"
import { getErrorMessage } from "@/lib/errors"

type GoogleSignInProps = {
  nonce: string
  onSuccess?: () => void
  onError?: (message: string) => void
}

export default function GoogleSignIn({
  nonce,
  onSuccess,
  onError,
}: GoogleSignInProps) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    return (
      <p className="text-destructive text-sm">
        Missing VITE_GOOGLE_CLIENT_ID in environment.
      </p>
    )
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLogin
        nonce={nonce}
        onError={() => {
          const message = "Login failed"
          if (onError) onError(message)
          else alert(message)
        }}
        onSuccess={async ({ credential }) => {
          if (!credential) return
          try {
            await signInWithGoogle(credential, nonce)
            onSuccess?.()
          } catch (err) {
            const message = getErrorMessage(err)
            if (onError) onError(message)
            else alert("Uh oh: " + message)
          }
        }}
      />
    </GoogleOAuthProvider>
  )
}
