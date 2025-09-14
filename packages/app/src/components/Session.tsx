import { Entry } from '@/components/Entry'
import { ValueContextProvider } from '@/components/ValueContextProvider'
import { useShowTimestamps } from '@/hooks/useShowTimestamps'
import { useStore } from '@/hooks/useStore'
import { ConsoleSession } from '@/types'
import { useMemo } from 'react'

export function Session({ session }: { session: ConsoleSession }) {
  const { sessions } = useStore()
  const [showTimestamps] = useShowTimestamps()

  const isCurrentSession = session === sessions[sessions.length - 1]

  const valueContext = useMemo(() => {
    return {
      globals: session.globals,
      metadata: session.metadata,
      sideEffectInfo: session.sideEffectInfo,
    }
  }, [session.globals, session.metadata, session.sideEffectInfo])

  return (
    <ValueContextProvider value={valueContext}>
      {session.entries.map((entry) => (
        <Entry
          key={entry.id}
          entry={entry}
          isStale={!isCurrentSession}
          showTimestamps={showTimestamps}
        />
      ))}

      {!isCurrentSession && <SessionCut key={session.id} session={session} />}
    </ValueContextProvider>
  )
}

function SessionCut({ session }: { session: ConsoleSession }) {
  return (
    <div
      className="border-border/30 bg-muted border-b p-2 font-mono opacity-90"
      data-type="session-cut"
    >
      <div className="px-2 text-xs whitespace-pre-wrap text-gray-800">
        Previous session from {new Date(session.timestamp).toLocaleString()}
      </div>
    </div>
  )
}
