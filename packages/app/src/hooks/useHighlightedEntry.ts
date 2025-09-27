import { HighlightedEntriesContext } from '@/lib/HighlightedEntriesContext'
import { ConsoleEntry } from '@/types'
import { useCallback, useMemo } from 'react'

export function useHighlightedEntry(entry: ConsoleEntry) {
  const { highlightedEntryIds, highlightEntry, unhighlightEntry } =
    HighlightedEntriesContext.useContext()

  const isHighlighted = useMemo(() => {
    return highlightedEntryIds.includes(entry.id)
  }, [highlightedEntryIds, entry.id])

  const highlight = useCallback(
    (paired: boolean) => {
      highlightEntry(entry, paired)
    },
    [highlightEntry, entry],
  )

  const unhighlight = useCallback(
    (paired: boolean) => {
      unhighlightEntry(entry, paired)
    },
    [unhighlightEntry, entry],
  )

  return { isHighlighted, highlight, unhighlight }
}
