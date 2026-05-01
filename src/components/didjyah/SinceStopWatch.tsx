import React, { useEffect, useState } from "react"

interface StopwatchProps {
  startDateTime?: number | null
}

const formatDuration = (milliseconds: number): string => {
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

const Stopwatch: React.FC<StopwatchProps> = ({ startDateTime }) => {
  const [elapsed, setElapsed] = useState<number>(0)

  useEffect(() => {
    if (!startDateTime) {
      return
    }

    const startTime = startDateTime
    const updateElapsed = () => {
      setElapsed(Date.now() - startTime)
    }

    updateElapsed()
    const intervalId = setInterval(updateElapsed, 1000)

    return () => clearInterval(intervalId)
  }, [startDateTime])

  if (!startDateTime) {
    return <span>Not yet performed</span>
  }

  const formattedTime = formatDuration(elapsed)

  return (
    <span>
      (<span className="font-stopwatch tabular-nums">{formattedTime}</span>)
    </span>
  )
}

export default Stopwatch
