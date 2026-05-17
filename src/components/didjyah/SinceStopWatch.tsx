import React, { useEffect, useState } from "react"
import { formatDuration } from "@/lib/duration"

interface StopwatchProps {
  startDateTime?: number | null
  /** When false, omit wrapping parentheses (default true). */
  wrapInParens?: boolean
}

const Stopwatch: React.FC<StopwatchProps> = ({
  startDateTime,
  wrapInParens = true,
}) => {
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
  const inner = (
    <span className="font-stopwatch tabular-nums">{formattedTime}</span>
  )

  if (!wrapInParens) {
    return inner
  }

  return <span>({inner})</span>
}

export default Stopwatch
