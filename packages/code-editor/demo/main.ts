import './style.css'
import { createEditor } from '../src'
import { defaultHighlightStyle } from '@codemirror/language'

const editorView = createEditor({
  parent: document.getElementById('app')!,
  highlightStyle: defaultHighlightStyle,
  // onSubmit: (value) => {
  //   console.log('submitted', value)
  // },
})

editorView.focus()

Object.assign(window, { editorView, view: editorView })
