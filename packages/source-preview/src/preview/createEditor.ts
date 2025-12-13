import { EditorView } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import {
  lineNumbers,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  keymap,
} from '@codemirror/view'
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import {
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
  bracketMatching,
  foldKeymap,
  HighlightStyle,
} from '@codemirror/language'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { EditorState, Extension } from '@codemirror/state'

import { highlightLocationExtension } from './highlightLocationExtension'

type EditorOptions = {
  parent: HTMLElement
  highlightStyle: HighlightStyle
  initialValue?: string
  theme?: Extension
}

export function createEditor({ parent, theme, highlightStyle, initialValue }: EditorOptions) {
  // node_modules/codemirror/dist/index.js
  // See `import { basicSetup } from 'codemirror'` for default extensions.
  const basicSetup = (() => [
    lineNumbers(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    syntaxHighlighting(highlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    rectangularSelection(),
    crosshairCursor(),
    highlightSelectionMatches(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
    ]),
  ])()

  const extensions = [
    basicSetup,
    javascript({
      jsx: false,
      typescript: false,
    }),
    EditorView.lineWrapping,

    // https://codemirror.net/examples/readonly/
    EditorState.readOnly.of(true),
    // EditorView.editable.of(false),

    highlightLocationExtension,
  ]

  if (theme) {
    extensions.push(theme)
  }

  const editorView = new EditorView({
    doc: initialValue ?? '',
    extensions,
    parent,
  })

  return editorView
}
