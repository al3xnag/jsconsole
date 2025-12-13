import { EditorView } from 'codemirror'

// For a reference, see https://github.com/ChromeDevTools/devtools-frontend/blob/2f89fb20f4601f188569f991a98198f83322f2e2/front_end/ui/components/text_editor/theme.ts#L7
export const editorTheme = EditorView.theme({
  '&.cm-editor': {
    '&.cm-focused': {
      outline: 'none',
    },
  },

  // '.cm-scroller': {},

  '.cm-content': {
    padding: '8px 0',
  },

  '.cm-line': {
    padding: '0 8px',
  },

  '.cm-selectionMatch': {
    backgroundColor: 'light-dark(#ffea008f, #685f00c9)',
  },

  '.cm-cursor': {
    borderLeft: '1.5px solid currentColor',
  },

  '.cm-selectionBackground': {
    background: 'var(--muted)',
  },

  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
    background: 'light-dark(#00a4ff40, #0080c08f)',
  },

  '&.cm-focused .cm-matchingBracket': {
    background: 'var(--accent)',
    borderBottom: '1px solid currentColor',
  },

  '&.cm-focused .cm-nonmatchingBracket': {
    background: 'var(--accent)',
    borderBottom: '1px solid var(--destructive)',
  },

  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--muted-foreground)',
  },

  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },

  '.cm-lineNumbers .cm-gutterElement': {
    paddingLeft: '20px',
  },

  '.cm-highlighted-range': {
    backgroundColor: 'light-dark(#fff700, #000)',
    border: '2px solid light-dark(#fff700, #000)',
  },

  '.cm-highlighted-line': {
    backgroundColor: 'light-dark(#fff700, #000)',
  },
})
