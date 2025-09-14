import { ConsoleContext } from '@/lib/ConsoleContext'
import { useCallback, useRef, type ReactNode } from 'react'
import { ConsoleRefHandle } from './Console'

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const consoleHandleRef = useRef<ConsoleRefHandle>(null)

  const focusPrompt = useCallback(() => {
    consoleHandleRef.current?.focusPrompt()
  }, [])

  const scrollToBottom = useCallback(() => {
    consoleHandleRef.current?.scrollToBottom()
  }, [])

  return (
    <ConsoleContext.Provider
      value={{
        consoleHandleRef,
        focusPrompt,
        scrollToBottom,
      }}
    >
      {children}
    </ConsoleContext.Provider>
  )
}
