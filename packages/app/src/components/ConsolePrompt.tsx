import { SPECIAL_RESULTS } from '@/constants'
import { useActions } from '@/hooks/useActions'
import { useStore } from '@/hooks/useStore'
import { editorTheme } from '@/lib/editorTheme'
import { highlightStyle } from '@/lib/highlightStyle'
import { ConsoleEntryInput, ConsoleEntryResult, Store } from '@/types'
import { type ViewUpdate, type EditorView } from '@codemirror/view'
import {
  AutocompleteCache,
  AutocompleteOptions,
  createEditor,
  SubmitHistoryPlugin,
} from '@jsconsole/code-editor'
import { evaluate, EvaluateResult, Metadata, type EvaluateOptions } from '@jsconsole/interpreter'
import { ChevronRight } from 'lucide-react'
import { Ref, useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { ConsoleEagerPreview } from './ConsoleEagerPreview'
import { useEditorOnUpdate } from '@/hooks/useEditorOnUpdate'

export type ConsolePromptRefHandle = {
  focus: () => void
}

export type ConsolePromptProps = {
  ref?: Ref<ConsolePromptRefHandle>
  onSubmit: (
    input: ConsoleEntryInput,
    result: ConsoleEntryResult | Promise<ConsoleEntryResult>,
  ) => void
  onUpdate: (update: ViewUpdate) => void
}

function initSubmitHistory(store: Store): SubmitHistoryPlugin {
  const submitHistory = new SubmitHistoryPlugin()

  store.sessions.forEach((session) => {
    session.entries.forEach((entry) => {
      if (entry.type === 'input') {
        submitHistory.push(entry.value)
      }
    })
  })

  return submitHistory
}

export function ConsolePrompt({ ref, onSubmit, onUpdate }: ConsolePromptProps) {
  const store = useStore()
  const currentSession = store.sessions.at(-1)

  const { submit } = useActions()

  const editorRootRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<EditorView>()

  const submitHistoryRef = useRef<SubmitHistoryPlugin>(null)
  if (submitHistoryRef.current === null) {
    submitHistoryRef.current = initSubmitHistory(store)
  }

  const autocompleteOptionsRef = useRef<AutocompleteOptions>({} as AutocompleteOptions)
  useLayoutEffect(() => {
    if (!currentSession || !currentSession.previewWindow) {
      Object.assign<AutocompleteOptions, AutocompleteOptions>(autocompleteOptionsRef.current, {
        globalObject: {},
        globalScope: { bindings: new Map() },
        metadata: new Metadata({}),
        evaluate: () => undefined,
      })
      return
    }

    const evaluateOptions: EvaluateOptions = {
      globalObject: currentSession.previewWindow,
      globalScope: currentSession.globalScope,
      metadata: currentSession.metadata,
      sideEffectInfo: currentSession.sideEffectInfo,
      wrapObjectLiteral: true,
      stripTypes: true,
      throwOnSideEffect: true,
      timeout: 500,
    }

    Object.assign<AutocompleteOptions, AutocompleteOptions>(autocompleteOptionsRef.current, {
      globalObject: currentSession.previewWindow,
      globalScope: currentSession.globalScope,
      metadata: currentSession.metadata,
      evaluate(expr: string) {
        const { value } = evaluate(expr, evaluateOptions) as EvaluateResult
        if (value === SPECIAL_RESULTS.HIDDEN) {
          return undefined
        }

        return value
      },
      cache: new AutocompleteCache(),
    })
  }, [currentSession])

  const handleSubmit = useCallback(
    (value: string) => {
      autocompleteOptionsRef.current.cache?.clear()

      const { input, result } = submit(value)
      onSubmit(input, result)
    },
    [submit, onSubmit],
  )

  const handleSubmitRef = useRef(handleSubmit)
  handleSubmitRef.current = handleSubmit

  const focus = useCallback(() => {
    editor?.focus()
  }, [editor])

  useImperativeHandle(ref, () => ({
    focus,
  }))

  useLayoutEffect(() => {
    const parent = editorRootRef.current
    if (!parent) {
      return
    }

    const editor = createEditor({
      parent,
      theme: editorTheme,
      highlightStyle,
      submitHistory: submitHistoryRef.current!,
      autocompleteOptions: autocompleteOptionsRef.current,
      onSubmit(value) {
        handleSubmitRef.current(value)
      },
    })

    editor.focus()
    setEditor(editor)

    return () => {
      editor.destroy()
      setEditor(undefined)
    }
  }, [])

  useEditorOnUpdate(editor, onUpdate)

  return (
    <div>
      <div className="flex items-start">
        <ChevronRight className="mt-2 ml-2 h-5 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <div ref={editorRootRef} className="flex-grow text-sm" />
      </div>
      <ConsoleEagerPreview editor={editor} />
    </div>
  )
}
