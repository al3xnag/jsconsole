import createRequiredContext from '@/lib/createRequiredContext'
import { ConsoleEntry, ConsoleEntryId } from '@/types'

export const HighlightedEntriesContext = createRequiredContext<{
  highlightedEntryIds: ConsoleEntryId[]
  highlightEntry: (entry: ConsoleEntry, paired: boolean) => void
  unhighlightEntry: (entry: ConsoleEntry, paired: boolean) => void
}>()
