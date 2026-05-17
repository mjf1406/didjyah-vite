/** Format elapsed milliseconds as compact human-readable duration (e.g. "02h 05m 30s"). */
export function formatDuration(milliseconds: number): string {
  const secondsInMs = 1000
  const minutesInMs = 60 * secondsInMs
  const hoursInMs = 60 * minutesInMs
  const daysInMs = 24 * hoursInMs
  const monthsInMs = 30 * daysInMs
  const yearsInMs = 365 * daysInMs

  let remaining = milliseconds

  const years = Math.floor(remaining / yearsInMs)
  remaining %= yearsInMs

  const months = Math.floor(remaining / monthsInMs)
  remaining %= monthsInMs

  const days = Math.floor(remaining / daysInMs)
  remaining %= daysInMs

  const hours = Math.floor(remaining / hoursInMs)
  remaining %= hoursInMs

  const minutes = Math.floor(remaining / minutesInMs)
  remaining %= minutesInMs

  const seconds = Math.floor(remaining / secondsInMs)

  const pad = (num: number) => String(num).padStart(2, "0")

  const parts: string[] = []

  if (years > 0) parts.push(`${years}y`)
  if (months > 0) parts.push(`${months}m`)
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${pad(hours)}h`)
  if (minutes > 0) parts.push(`${pad(minutes)}m`)
  parts.push(`${pad(seconds)}s`)

  return parts.join(" ")
}
