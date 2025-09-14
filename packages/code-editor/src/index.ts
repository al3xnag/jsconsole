import { EditorView } from 'codemirror'
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript'
import { autocomplete, AutocompleteOptions } from './autocomplete'

import {
  //lineNumbers,
  //highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  //highlightActiveLine,
  keymap,
  placeholder as placeholderExtension,
} from '@codemirror/view'
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands'
import { closeBrackets, autocompletion, closeBracketsKeymap } from '@codemirror/autocomplete'
import {
  //foldGutter,
  indentOnInput,
  syntaxHighlighting,
  bracketMatching,
  //foldKeymap,
  HighlightStyle,
} from '@codemirror/language'
import { highlightSelectionMatches /*, searchKeymap */ } from '@codemirror/search'
import { EditorState, Extension } from '@codemirror/state'
// import { lintKeymap } from '@codemirror/lint'
import { SubmitHistoryPlugin } from './SubmitHistory'
import { AutocompleteCache } from './AutocompleteCache'
import { Metadata } from '@jsconsole/interpreter'
import { completionKeymap } from './completionKeymap'
import { indentKeymap } from './indentKeymap'
import { conservativeCompletion } from './conservativeCompletion'
import { submitKeymap } from './submitKeymap'
import { blockCursor } from '@jsconsole/codemirror-block-cursor'

export { SubmitHistoryPlugin } from './SubmitHistory'
export { AutocompleteCache } from './AutocompleteCache'
export { type AutocompleteOptions } from './autocomplete'

export type EditorOptions = {
  parent: HTMLElement
  highlightStyle: HighlightStyle
  theme?: Extension
  submitHistory?: SubmitHistoryPlugin
  autocompleteOptions?: AutocompleteOptions
  /**
   * Return false to cancel the submission.
   * Return a Promise to defer the submission.
   */
  onSubmit?: (value: string) => boolean | Promise<void> | void
  placeholder?: string
}

export function createEditor({
  parent,
  theme,
  highlightStyle,
  submitHistory,
  autocompleteOptions,
  onSubmit,
  placeholder = 'Enter to submit, Shift+Enter for newline',
}: EditorOptions) {
  submitHistory ??= new SubmitHistoryPlugin()
  autocompleteOptions ??= {
    globalObject: globalThis,
    globalScope: { bindings: new Map() },
    metadata: new Metadata(),
    evaluate: globalThis.eval,
    cache: new AutocompleteCache(),
  }

  // node_modules/codemirror/dist/index.js
  // See `import { basicSetup } from 'codemirror'` for default extensions.
  const basicSetup = (() => [
    //lineNumbers(),
    //highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    //foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(highlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    //autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    //highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
      ...completionKeymap(),
      ...indentKeymap(),
      ...submitKeymap({ onSubmit, submitHistory }),
      ...submitHistory.lookupKeymap,
      ...closeBracketsKeymap,
      ...defaultKeymap,
      //...searchKeymap,
      ...historyKeymap,
      //...foldKeymap,
      //...lintKeymap,
    ]),
  ])()

  const extensions = [
    basicSetup,
    javascript({
      jsx: false,
      typescript: false,
    }),
    javascriptLanguage.data.of({
      autocomplete: autocomplete(autocompleteOptions),
    }),
    conservativeCompletion,
    autocompletion({
      defaultKeymap: false,
      tooltipClass: (state: EditorState) => {
        return state.field(conservativeCompletion, false) ? 'conservativeCompletion' : ''
      },
      //selectOnOpen: false,
    }),
    EditorView.lineWrapping,
    blockCursor(),
  ]

  if (placeholder) {
    extensions.push(placeholderExtension(placeholder))
  }

  if (theme) {
    extensions.push(theme)
  }

  const editorView = new EditorView({
    doc: '',
    extensions,
    parent,
  })

  return editorView
}
