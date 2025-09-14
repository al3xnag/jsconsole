import { EditorView, KeyBinding } from '@codemirror/view'
import { indentMore, indentLess } from '@codemirror/commands'

export function indentKeymap(): KeyBinding[] {
  return [
    {
      key: 'Tab',
      run: (view: EditorView) => (view.state.doc.length ? indentMore(view) : false),
      shift: (view: EditorView) => (view.state.doc.length ? indentLess(view) : false),
    },
  ]
}
