import { SPECIAL_RESULTS } from '@/constants'
import { useStore } from '@/hooks/useStore'
import { EditorView } from '@codemirror/view'
import {
  evaluate,
  InternalError,
  PossibleSideEffectError,
  TimeoutError,
  type EvaluateResult,
} from '@jsconsole/interpreter'
import { useCallback, useDeferredValue, useMemo, useRef, useState } from 'react'
import { ValueContextProvider } from './ValueContextProvider'
import { ValuePreview } from './ValuePreview'
import { useEditorOnUpdate } from '@/hooks/useEditorOnUpdate'

const NO_VALUE = Symbol()

export function ConsoleEagerPreview({ editor }: { editor: EditorView | undefined }) {
  const elementRef = useRef<HTMLDivElement>(null)

  const [input, setInput] = useState('')
  const deferredInput = useDeferredValue(input)

  // For smoother UI. When submitting, it's better to reset `value` synchronously
  // to avoid flickering (so editor text and `value` are reset at the same time).
  const actualInput = input === '' ? input : deferredInput

  const store = useStore()
  const currentSession = store.sessions.at(-1)

  const valueContext = useMemo(() => {
    if (!currentSession?.globals) {
      return undefined
    }

    return {
      globals: currentSession.globals,
      metadata: currentSession.metadata,
      sideEffectInfo: currentSession.sideEffectInfo,
    }
  }, [currentSession?.globals, currentSession?.metadata, currentSession?.sideEffectInfo])

  const handleClick = useCallback(() => {
    const selection = document.getSelection()
    if (selection && !selection.isCollapsed && selection.containsNode(elementRef.current!, true)) {
      return
    }

    editor?.focus()
  }, [editor])

  useEditorOnUpdate(editor, (update) => {
    if (update.docChanged) {
      setInput(update.state.doc.toString())
    }
  })

  const evaluateValue = useCallback(
    (input: string) => {
      if (!currentSession?.previewWindow) {
        return NO_VALUE
      }

      if (input.trim() === '') {
        return NO_VALUE
      }

      let result: EvaluateResult | Promise<EvaluateResult>

      try {
        result = evaluate(input, {
          contextName: `vm:///anonymous`,
          globalObject: currentSession.previewWindow,
          globalScope: currentSession.globalScope,
          metadata: currentSession.metadata,
          sideEffectInfo: currentSession.sideEffectInfo,
          throwOnSideEffect: true,
          timeout: 500,
          wrapObjectLiteral: true,
          stripTypes: true,
        })
      } catch (e) {
        if (
          e instanceof EvalError ||
          e instanceof SyntaxError ||
          e instanceof PossibleSideEffectError ||
          e instanceof TimeoutError ||
          e instanceof InternalError
        ) {
          return NO_VALUE
        }

        return e
      }

      if (result instanceof Promise) {
        return NO_VALUE
      }

      if (result.value === SPECIAL_RESULTS.HIDDEN) {
        return NO_VALUE
      }

      return result.value
    },
    [
      currentSession?.globalScope,
      currentSession?.metadata,
      currentSession?.sideEffectInfo,
      currentSession?.previewWindow,
    ],
  )

  const value = useMemo(() => evaluateValue(actualInput), [evaluateValue, actualInput])

  const previewWrapperRef = (node: HTMLSpanElement) => {
    // https://github.com/ChromeDevTools/devtools-frontend/blob/bf8f5e55a44cf54d6b67de880f94696b43090453/front_end/panels/console/ConsolePrompt.ts#L208
    node.hidden = node.textContent === actualInput.trim()
    return () => {}
  }

  return (
    <div
      ref={elementRef}
      onClick={handleClick}
      className="box-content h-5 overflow-hidden pr-2 pb-2 pl-8 font-mono text-ellipsis whitespace-nowrap opacity-40"
    >
      {valueContext && value !== NO_VALUE && (
        <ValueContextProvider value={valueContext}>
          <span ref={previewWrapperRef}>
            <ValuePreview key={actualInput} value={value} placement="top" />
          </span>
        </ValueContextProvider>
      )}
    </div>
  )
}
