import { Compartment, StateEffect } from '@codemirror/state'
import { EditorView, ViewUpdate } from '@codemirror/view'
import { useEffect, useInsertionEffect, useRef } from 'react'

export function useEditorOnUpdate(
  editor: EditorView | undefined,
  callback: (update: ViewUpdate) => void,
) {
  const callbackRef = useRef(callback)

  useInsertionEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!editor) {
      return
    }

    const compartment = new Compartment()

    const updateExtension = EditorView.updateListener.of((update) => {
      callbackRef.current(update)
    })

    editor.dispatch({
      effects: StateEffect.appendConfig.of([compartment.of(updateExtension)]),
    })

    return () => {
      editor.dispatch({
        effects: compartment.reconfigure([]),
      })
    }
  }, [editor])
}
