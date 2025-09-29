import { Entry } from '@/components/Entry'
import { HighlightedEntriesProvider } from '@/components/HighlightedEntriesProvider'
import { ValueContextProvider } from '@/components/ValueContextProvider'
import { useShowTimestamps } from '@/hooks/useShowTimestamps'
import { useStore } from '@/hooks/useStore'
import { ConsoleEntry, ConsoleSession } from '@/types'
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
    <HighlightedEntriesProvider>
      <ValueContextProvider value={valueContext}>
        {session.entries.map((entry, index, array) => (
          <Entry
            key={entry.id}
            entry={entry}
            session={session}
            isStale={!isCurrentSession}
            isPaired={isPaired(entry, index, array)}
            showTimestamps={showTimestamps}
          />
        ))}

        {!isCurrentSession && <SessionCut key={session.id} session={session} />}
      </ValueContextProvider>
    </HighlightedEntriesProvider>
  )
}

function SessionCut({ session }: { session: ConsoleSession }) {
  return (
    <div
      className="border-border/30 bg-muted border-b p-2 font-mono opacity-90"
      data-type="session-cut"
    >
      <div className="px-2 text-xs whitespace-pre-wrap">
        Previous session from {new Date(session.timestamp).toLocaleString()}
      </div>
    </div>
  )
}

function isPaired(entry: ConsoleEntry, index: number, array: ConsoleEntry[]): boolean {
  const isPairedInput: boolean =
    entry.type === 'input' &&
    entry.resultId !== undefined &&
    array[index + 1]?.type === 'result' &&
    entry.resultId === array[index + 1].id

  const isPairedResult: boolean =
    entry.type === 'result' &&
    entry.inputId !== undefined &&
    array[index - 1]?.type === 'input' &&
    entry.inputId === array[index - 1].id

  return isPairedInput || isPairedResult
}
