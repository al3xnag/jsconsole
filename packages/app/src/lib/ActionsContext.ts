import createRequiredContext from '@/lib/createRequiredContext'
import { ConsoleEntryInput, ConsoleEntryResult } from '@/types'

export type RestartOptions = {
  what: 'auto' | 'all-sessions' | 'current-session'
  awaitTopLevelAwait: boolean
}

export const ActionsContext = createRequiredContext<{
  restart: (options: RestartOptions) => Promise<void>
  clear: ({ withEntry }: { withEntry: boolean }) => void
  reload: () => Promise<void>
  submit: (input: string) => {
    input: ConsoleEntryInput
    result: ConsoleEntryResult | Promise<ConsoleEntryResult>
  }
}>()
