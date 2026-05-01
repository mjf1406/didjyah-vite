export function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err
  if (err && typeof err === "object") {
    const obj = err as { body?: { message?: string }; message?: string }
    return obj.body?.message ?? obj.message ?? JSON.stringify(err)
  }
  return String(err)
}
