import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { toast } from "sonner"
import { db } from "@/lib/db"
import { useUndo } from "@/lib/undo"
import {
  type ActiveStopwatchSession,
  stopStopwatchSession,
} from "@/lib/stopwatch"
import SinceStopwatch from "@/components/didjyah/SinceStopWatch"
import NoteRecordDialog from "@/components/didjyah/NoteRecordDialog"
import { Button } from "@/components/ui/button"

interface ActiveStopwatchBarProps {
  sessions: ActiveStopwatchSession[]
}

export default function ActiveStopwatchBar({ sessions }: ActiveStopwatchBarProps) {
  const user = db.useUser()
  const { registerAction } = useUndo()
  const [noteDialogOpen, setNoteDialogOpen] = React.useState(false)
  const [noteDialogKey, setNoteDialogKey] = React.useState(0)
  const pendingSessionRef = React.useRef<ActiveStopwatchSession | null>(null)

  if (sessions.length === 0) return null

  const runStop = async (
    session: ActiveStopwatchSession,
    note?: string,
  ) => {
    try {
      await stopStopwatchSession({
        recordId: session.record.id,
        didjyahId: session.didjyah.id,
        didjyahName: session.didjyah.name,
        ownerId: user.id,
        note,
        registerAction,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while stopping the session."
      toast.error(message)
      throw error
    }
  }

  const handleStop = (session: ActiveStopwatchSession) => {
    if (session.didjyah.note) {
      pendingSessionRef.current = session
      setNoteDialogKey((k) => k + 1)
      setNoteDialogOpen(true)
      return
    }
    void runStop(session)
  }

  return (
    <>
      <div
        className="fixed bottom-16 left-0 right-0 z-40 border-t border-red-500/30 bg-background/95 px-4 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm supports-[backdrop-filter]:bg-background/85 md:bottom-0"
        role="region"
        aria-label="Active stopwatch sessions"
      >
        <div className="mx-auto w-full max-w-4xl">
          <p className="mb-2 text-xs font-medium text-red-700 dark:text-red-400">
            Active sessions
          </p>
          <ul className="max-h-40 space-y-2 overflow-y-auto md:max-h-48">
            {sessions.map((session) => (
              <li
                key={session.record.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {session.didjyah.name}
                  </p>
                  {session.record.createdDate ? (
                    <p className="text-xs text-muted-foreground">
                      <SinceStopwatch
                        startDateTime={session.record.createdDate}
                        wrapInParens={false}
                      />
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Stop ${session.didjyah.name}`}
                  onClick={() => handleStop(session)}
                >
                  <FontAwesomeIcon
                    className="text-xl text-red-600"
                    icon={["fas", "stop"]}
                  />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <NoteRecordDialog
        key={noteDialogKey}
        open={noteDialogOpen}
        onOpenChange={(open) => {
          setNoteDialogOpen(open)
          if (!open) pendingSessionRef.current = null
        }}
        didjyahName={pendingSessionRef.current?.didjyah.name ?? "DidjYah"}
        onConfirm={async (noteText) => {
          const session = pendingSessionRef.current
          if (!session) return
          await runStop(session, noteText)
          pendingSessionRef.current = null
        }}
      />
    </>
  )
}
