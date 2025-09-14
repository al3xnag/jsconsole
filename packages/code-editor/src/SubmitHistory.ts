import { type EditorView, type KeyBinding } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'

export class SubmitHistory {
  #data: string[] = []
  #offset = 0
  #maxSize = 200

  push(text: string) {
    if (this.#offset > 0) {
      // Remove uncommitted text.
      this.#data.pop()
    }

    this.#offset = 0

    if (text !== this.#currentItem()) {
      this.#data.push(text)
    }

    if (this.#data.length > this.#maxSize) {
      this.#data = this.#data.slice(-this.#maxSize)
    }
  }

  clear() {
    this.#data = []
    this.#offset = 0
  }

  previous(currentText: string): string | undefined {
    if (this.#offset > this.#data.length - 1) {
      return undefined
    }

    if (this.#offset === 0) {
      // Temporarily add the current (uncommitted) text to the history,
      // so that we can navigate back to it.
      this.#data.push(currentText)
    }

    this.#offset++
    return this.#currentItem()
  }

  next(): string | undefined {
    if (this.#offset === 0) {
      return undefined
    }

    this.#offset--
    const item = this.#currentItem()

    if (this.#offset === 0) {
      // Remove temporarily added uncommitted text.
      this.#data.pop()
    }

    return item
  }

  #currentItem(): string | undefined {
    return this.#data[this.#data.length - 1 - this.#offset]
  }
}

export class SubmitHistoryPlugin {
  #submitHistory = new SubmitHistory()

  push(text: string) {
    this.#submitHistory.push(text)
  }

  clear() {
    this.#submitHistory.clear()
  }

  lookupKeymap: readonly KeyBinding[] = [
    { key: 'ArrowUp', run: (view) => this.#move(true, false, view) },
    { key: 'ArrowDown', run: (view) => this.#move(false, false, view) },
    { mac: 'Ctrl-p', run: (view) => this.#move(true, true, view) },
    { mac: 'Ctrl-n', run: (view) => this.#move(false, true, view) },
  ]

  #move(isBackward: boolean, force: boolean, view: EditorView) {
    const { selection, doc } = view.state

    if (!force) {
      if (!selection.main.empty) {
        return false
      }

      const line = view.state.doc.lineAt(selection.main.head)

      if (isBackward && line.number !== 1) {
        return false
      }

      if (!isBackward && line.number !== doc.lines) {
        return false
      }
    }

    const currentText = doc.toString()
    const newText = isBackward
      ? this.#submitHistory.previous(currentText)
      : this.#submitHistory.next()

    if (newText === undefined) {
      return false
    }

    const cursorPos = isBackward ? newText.search(/\n|$/) : newText.length

    view.dispatch({
      changes: { from: 0, to: doc.length, insert: newText },
      selection: EditorSelection.cursor(cursorPos),
      scrollIntoView: true,
    })

    return true
  }
}
