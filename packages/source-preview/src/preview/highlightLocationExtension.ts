import { EditorView, Decoration } from '@codemirror/view'
import { StateField, StateEffect, Range, EditorSelection } from '@codemirror/state'

const highlightRangeDecor = Decoration.mark({ class: 'cm-highlighted-range' })
const highlightLineDecor = Decoration.line({ class: 'cm-highlighted-line' })
const highlightRangeEffect = StateEffect.define<Range<Decoration>[]>()
const clearRangeHighlightsEffect = StateEffect.define<null>()

export const highlightLocationExtension = StateField.define({
  create() {
    return Decoration.none
  },
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(highlightRangeEffect)) {
        value = value.update({
          add: effect.value,
          sort: true,
        })
      } else if (effect.is(clearRangeHighlightsEffect)) {
        value = Decoration.none
      }
    }

    return value
  },
  provide: (field) => EditorView.decorations.from(field),
})

/**
 * @param location 1-based
 */
export function highlightLocation(
  view: EditorView,
  location:
    | [lineStart: number, colStart: number]
    | [lineStart: number, colStart: number, lineEnd: number, colEnd: number],
) {
  const state = view.state

  const [lineStart, colStart, lineEnd, colEnd] = location
  const lineStartLine = state.doc.line(lineStart)
  const from = lineStartLine.from + (colStart - 1)

  const effects: StateEffect<unknown>[] = [
    EditorView.scrollIntoView(from, { y: 'center', x: 'center' }),
  ]

  if (lineEnd !== undefined && colEnd !== undefined) {
    const to = state.doc.line(lineEnd).from + (colEnd - 1)
    const range = highlightRangeDecor.range(from, to)
    const effect = highlightRangeEffect.of([range])
    effects.push(effect)
  } else {
    const range = highlightLineDecor.range(lineStartLine.from)
    const effect = highlightRangeEffect.of([range])
    effects.push(effect)
  }

  view.dispatch({
    effects,
    selection: EditorSelection.cursor(from),
  })
}
