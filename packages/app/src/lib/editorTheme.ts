import { EditorView } from 'codemirror'
import CodiconSymbolVariable from '@/assets/CodiconSymbolVariable.svg?no-inline'
import CodiconSymbolMethod from '@/assets/CodiconSymbolMethod.svg?no-inline'
import CodiconSymbolField from '@/assets/CodiconSymbolField.svg?no-inline'
import CodiconSymbolKeyword from '@/assets/CodiconSymbolKeyword.svg?no-inline'

// For a reference, see https://github.com/ChromeDevTools/devtools-frontend/blob/2f89fb20f4601f188569f991a98198f83322f2e2/front_end/ui/components/text_editor/theme.ts#L7
export const editorTheme = EditorView.theme({
  '&.cm-editor': {
    '&.cm-focused': {
      outline: 'none',
    },
  },

  '.cm-scroller': {
    lineHeight: 'inherit',
  },

  '.cm-content': {
    padding: '8px 0',
  },

  '.cm-line': {
    padding: '0 8px',
  },

  '.cm-selectionMatch': {
    backgroundColor: 'mark',
    color: 'marktext',
  },

  '.cm-cursor': {
    borderLeft: '1.5px solid currentColor',

    // Fix small cursor height (14px) after clearing the editor (e.g. using backspace).
    height: '16.5px !important',
  },

  '.cm-selectionBackground': {
    background: 'var(--muted)',
  },

  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
    background: 'SelectedItem',
  },

  '&.cm-focused .cm-matchingBracket': {
    background: 'var(--accent)',
    borderBottom: '1px solid currentColor',
  },

  '&.cm-focused .cm-nonmatchingBracket': {
    background: 'var(--accent)',
    borderBottom: '1px solid var(--destructive)',
  },

  '.cm-placeholder': {
    color: 'var(--token-muted)',
  },

  '.cm-tooltip.cm-tooltip-autocomplete': {
    background: 'none',
    border: 'none',
    padding: '4px 0',

    '& > ul': {
      backgroundColor: 'var(--popover)',
      boxShadow:
        '0 0 0 1px rgb(0 0 0 / 5%), 0 2px 4px rgb(0 0 0 / 20%), 0 2px 6px rgb(0 0 0 / 10%)',

      maxHeight: '25em',
      minWidth: '16em',
    },
  },

  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
    display: 'flex',
    gap: '8px',
    border: '1px solid transparent',

    '&:hover': {
      backgroundColor: 'var(--accent)',
    },

    '&[aria-selected]': {
      backgroundColor: 'var(--selection)',
      borderColor: 'var(--selection-border)',
      color: 'var(--selection-foreground)',

      '&::after': {
        content: '"tab"',
        alignSelf: 'center',
        marginLeft: 'auto',
        padding: '2px 3px',
        fontSize: '10px',
        lineHeight: '1',
        color: 'var(--muted-foreground)',
        backgroundColor: 'var(--muted)',
        border: '1px solid var(--selection-border)',
        borderRadius: '2px',
      },
    },
  },

  '.cm-tooltip.cm-tooltip-autocomplete.conservativeCompletion > ul > li[aria-selected]': {
    background: 'none',
    border: '1px dotted currentColor',
    '&::after': {
      color: 'var(--muted-foreground)',
      background: 'none',
      border: '1px solid var(--border)',
    },
  },

  '.cm-completionIcon': {
    paddingRight: '0',
    width: '18px',
    height: '16px',
    alignSelf: 'center',

    opacity: '0.4',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',

    '&::after': {
      content: 'unset',
    },
  },

  // `Completion.type`:
  // > The type of the completion. This is used to pick an icon to show for the completion.
  // > Icons are styled with a CSS class created by appending the type name to "cm-completionIcon-".
  // > You can define or restyle icons by defining these selectors. The base library defines simple icons for
  // > class, constant, enum, function, interface, keyword, method, namespace, property, text, type, and variable.
  '.cm-completionIcon-function': {
    backgroundImage: `url("${CodiconSymbolMethod}")`,
  },
  '.cm-completionIcon-method': {
    backgroundImage: `url("${CodiconSymbolMethod}")`,
  },
  '.cm-completionIcon-variable': {
    backgroundImage: `url("${CodiconSymbolVariable}")`,
  },
  '.cm-completionIcon-property': {
    backgroundImage: `url("${CodiconSymbolField}")`,
  },
  '.cm-completionIcon-keyword': {
    backgroundImage: `url("${CodiconSymbolKeyword}")`,
  },

  '.cm-completionLabel': {},

  '.cm-completionDetail': {
    opacity: '0.5',
    marginLeft: '0',
    fontSize: 'smaller',
    alignSelf: 'center',
  },

  '.cm-completionMatchedText': {
    textDecoration: 'none',
    fontWeight: 'bold',
  },
})
