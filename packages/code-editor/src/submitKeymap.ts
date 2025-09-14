import { EditorView, KeyBinding } from '@codemirror/view'
import type { EditorOptions } from '.'
import type { SubmitHistoryPlugin } from './SubmitHistory'

export function submitKeymap({
  onSubmit,
  submitHistory,
}: {
  onSubmit: EditorOptions['onSubmit']
  submitHistory: SubmitHistoryPlugin
}): KeyBinding[] {
  return [
    {
      key: 'Enter',
      run: submit(onSubmit, submitHistory),
    },
  ]
}

function submit(
  onSubmit: EditorOptions['onSubmit'],
  submitHistory: SubmitHistoryPlugin,
): (view: EditorView) => boolean {
  return (view) => {
    if (onSubmit) {
      const value = view.state.doc.toString()
      if (value.trim() !== '') {
        const submitResult = onSubmit(value)
        if (submitResult === false) {
          return true
        }

        const finalizeSubmit = () => {
          submitHistory.push(value)
          view.dispatch({
            changes: {
              from: 0,
              to: view.state.doc.length,
              insert: '',
            },
            //selection: EditorSelection.cursor(0),
            //scrollIntoView: true,
          })
        }

        if (submitResult instanceof Promise) {
          submitResult.then(finalizeSubmit)
        } else {
          finalizeSubmit()
        }
      }

      return true
    }

    return false
  }
}
