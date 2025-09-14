import { ConsolePrompt, ConsolePromptRefHandle } from '@/components/ConsolePrompt'
import { Session } from '@/components/Session'
import { WelcomeEntry } from '@/components/WelcomeEntry'
import { useStore } from '@/hooks/useStore'
import { type ViewUpdate } from '@codemirror/view'
import { Ref, useCallback, useImperativeHandle, useLayoutEffect, useRef } from 'react'

export type ConsoleRefHandle = {
  focusPrompt: () => void
  scrollToBottom: () => void
}

export type ConsoleProps = {
  ref?: Ref<ConsoleRefHandle>
}

export function Console({ ref }: ConsoleProps) {
  const { sessions } = useStore()

  const consolePromptRef = useRef<ConsolePromptRefHandle>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  }, [])

  // Scroll to bottom when the component mounts
  useLayoutEffect(() => {
    scrollToBottom()
  }, [scrollToBottom])

  const handlePromptSubmit = useCallback(() => {
    requestAnimationFrame(() => {
      scrollToBottom()
      requestAnimationFrame(scrollToBottom)
    })
  }, [scrollToBottom])

  const handlePromptUpdate = useCallback(
    (update: ViewUpdate) => {
      if (
        update.heightChanged &&
        update.view.contentHeight < scrollContainerRef.current!.clientHeight - 200
      ) {
        scrollToBottom()
      }
    },
    [scrollToBottom],
  )

  const focusPrompt = useCallback(() => {
    consolePromptRef.current?.focus()
  }, [])

  useImperativeHandle(ref, () => ({
    focusPrompt,
    scrollToBottom,
  }))

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto" ref={scrollContainerRef}>
        <div className="break-words [overflow-anchor:none]">
          <WelcomeEntry className={sessions.length > 1 ? 'bg-muted opacity-90' : ''} />
          {sessions.map((session) => (
            <Session key={session.id} session={session} />
          ))}
        </div>

        <ConsolePrompt
          ref={consolePromptRef}
          onSubmit={handlePromptSubmit}
          onUpdate={handlePromptUpdate}
        />

        <div
          onMouseDown={(e) => {
            focusPrompt()
            e.preventDefault()
          }}
          className="relative flex-1"
        />
      </div>
    </div>
  )
}
