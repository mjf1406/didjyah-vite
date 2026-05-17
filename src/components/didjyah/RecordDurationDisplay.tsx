import SinceStopwatch from "@/components/didjyah/SinceStopWatch"
import {
  formatRecordDuration,
  isRunningStopwatchRecord,
} from "@/lib/stopwatch"

interface RecordDurationDisplayProps {
  createdDate?: number | null
  endDate?: number | null
  stopwatchEnabled?: boolean | null
}

export function RecordDurationDisplay({
  createdDate,
  endDate,
  stopwatchEnabled,
}: RecordDurationDisplayProps) {
  const record = { createdDate, endDate }

  if (
    isRunningStopwatchRecord(
      { id: "", createdDate, endDate },
      stopwatchEnabled,
    )
  ) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        In progress:{" "}
        <SinceStopwatch startDateTime={createdDate} wrapInParens={false} />
      </p>
    )
  }

  const duration = formatRecordDuration(record)
  if (!duration) return null

  return (
    <p className="text-sm text-muted-foreground">
      Duration:{" "}
      <span className="font-stopwatch tabular-nums">{duration}</span>
    </p>
  )
}
