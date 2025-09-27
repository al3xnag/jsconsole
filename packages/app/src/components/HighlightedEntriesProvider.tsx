import { HighlightedEntriesContext } from '@/lib/HighlightedEntriesContext'
import { useCallback, useState, type ReactNode } from 'react'
import { ConsoleEntry, ConsoleEntryId } from '@/types'

export function HighlightedEntriesProvider({ children }: { children: ReactNode }) {
  const [highlightedEntryIds, setHighlightedEntryIds] = useState<ConsoleEntryId[]>([])

  const highlightEntry = useCallback((entry: ConsoleEntry, paired: boolean) => {
    setHighlightedEntryIds((x) => {
      if (paired && entry.type === 'input' && entry.resultId) {
        return [...x, entry.id, entry.resultId]
      }

      if (paired && entry.type === 'result' && entry.inputId) {
        return [...x, entry.id, entry.inputId]
      }

      return [...x, entry.id]
    })
  }, [])

  const unhighlightEntry = useCallback((entry: ConsoleEntry, paired: boolean) => {
    setHighlightedEntryIds((x) => {
      if (paired && entry.type === 'input' && entry.resultId) {
        return x.filter((id) => id !== entry.id && id !== entry.resultId)
      }

      if (paired && entry.type === 'result' && entry.inputId) {
        return x.filter((id) => id !== entry.id && id !== entry.inputId)
      }

      return x.filter((id) => id !== entry.id)
    })
  }, [])

  return (
    <HighlightedEntriesContext.Provider
      value={{
        highlightedEntryIds,
        highlightEntry,
        unhighlightEntry,
      }}
    >
      {children}
    </HighlightedEntriesContext.Provider>
  )
}
