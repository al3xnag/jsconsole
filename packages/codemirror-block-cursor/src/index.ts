/* Based on https://github.com/replit/codemirror-vim/blob/71919db3d4466d487d53aae551ab035a490dd75a/src/index.ts */

import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { Extension, Prec } from '@codemirror/state'
import { BlockCursor } from './block-cursor'

const plugin = ViewPlugin.fromClass(
  class {
    blockCursor: BlockCursor

    constructor(view: EditorView) {
      this.blockCursor = new BlockCursor(view)
    }

    update(update: ViewUpdate) {
      this.blockCursor.update(update)
    }

    destroy() {
      this.blockCursor.destroy()
    }
  },
)

const theme = Prec.highest(
  EditorView.theme({
    '.cm-cursorLayer:not(.cm-blockCursorLayer)': {
      display: 'none',
    },
    '.cm-block-cursor': {
      position: 'absolute',
      background: 'black',
      color: 'white',
      border: 'none',
      borderRadius: '1px',
      whiteSpace: 'pre',
      '&.cm-block-cursor-placeholder': {
        color: '#ddd',
      },
      '&.cm-block-cursor-partial': {
        color: 'transparent',
      },
    },
    '&:not(.cm-focused) .cm-block-cursor': {
      background: 'none',
      color: 'transparent',
      outline: '1px solid black',
    },
  }),
)

export function blockCursor(): Extension {
  return [plugin, theme]
}
