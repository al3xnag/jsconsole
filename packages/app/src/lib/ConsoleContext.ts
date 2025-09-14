import { ConsoleRefHandle } from '@/components/Console'
import createRequiredContext from '@/lib/createRequiredContext'
import { RefObject } from 'react'

export const ConsoleContext = createRequiredContext<{
  consoleHandleRef: RefObject<ConsoleRefHandle | null>
  focusPrompt: () => void
  scrollToBottom: () => void
}>()
