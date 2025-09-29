/* Based on https://github.com/replit/codemirror-vim/blob/71919db3d4466d487d53aae551ab035a490dd75a/src/block-cursor.ts */

import { SelectionRange } from '@codemirror/state'
import { ViewUpdate, EditorView, Direction } from '@codemirror/view'

type Measure = { cursors: Piece[] }

class Piece {
  constructor(
    readonly left: number,
    readonly top: number,
    readonly height: number,
    readonly fontFamily: string,
    readonly fontSize: string,
    readonly fontWeight: string,
    readonly color: string,
    readonly className: string,
    readonly letter: string,
  ) {}

  draw() {
    const elt = document.createElement('div')
    elt.className = this.className
    this.adjust(elt)
    return elt
  }

  adjust(elt: HTMLElement) {
    elt.style.left = this.left + 'px'
    elt.style.top = this.top + 'px'
    elt.style.height = this.height + 'px'
    elt.style.lineHeight = this.height + 'px'
    elt.style.fontFamily = this.fontFamily
    elt.style.fontSize = this.fontSize
    elt.style.fontWeight = this.fontWeight
    elt.style.setProperty('--text-color', this.color)

    elt.className = this.className
    elt.textContent = this.letter
  }

  eq(p: Piece) {
    return (
      this.left == p.left &&
      this.top == p.top &&
      this.height == p.height &&
      this.fontFamily == p.fontFamily &&
      this.fontSize == p.fontSize &&
      this.fontWeight == p.fontWeight &&
      this.color == p.color &&
      this.className == p.className &&
      this.letter == p.letter
    )
  }
}

export class BlockCursor {
  rangePieces: readonly Piece[] = []
  cursors: readonly Piece[] = []
  measureReq: { read: () => Measure; write: (value: Measure) => void }
  cursorLayer: HTMLElement

  constructor(readonly view: EditorView) {
    this.measureReq = { read: this.readPos.bind(this), write: this.drawSel.bind(this) }
    this.cursorLayer = view.scrollDOM.appendChild(document.createElement('div'))
    this.cursorLayer.className = 'cm-cursorLayer cm-blockCursorLayer'
    this.cursorLayer.setAttribute('aria-hidden', 'true')
    view.requestMeasure(this.measureReq)
  }

  update(update: ViewUpdate) {
    if (
      update.selectionSet ||
      update.geometryChanged ||
      update.viewportChanged ||
      update.focusChanged
    ) {
      this.view.requestMeasure(this.measureReq)
      this.cursorLayer.style.animationName =
        this.cursorLayer.style.animationName === 'cm-blink' ? 'cm-blink2' : 'cm-blink'
    }
  }

  scheduleRedraw() {
    this.view.requestMeasure(this.measureReq)
  }

  readPos(): Measure {
    const { state } = this.view
    const cursors: Piece[] = []
    for (const r of state.selection.ranges) {
      const prim = r == state.selection.main
      const piece = measureCursor(this.view, r, prim)
      if (piece) cursors.push(piece)
    }
    return { cursors }
  }

  drawSel({ cursors }: Measure) {
    if (cursors.length != this.cursors.length || cursors.some((c, i) => !c.eq(this.cursors[i]))) {
      const oldCursors = this.cursorLayer.children
      if (oldCursors.length !== cursors.length) {
        this.cursorLayer.textContent = ''
        for (const c of cursors) this.cursorLayer.appendChild(c.draw())
      } else {
        cursors.forEach((c, idx) => c.adjust(oldCursors[idx] as HTMLElement))
      }
      this.cursors = cursors
    }
  }

  destroy() {
    this.cursorLayer.remove()
  }
}

function getBase(view: EditorView) {
  const rect = view.scrollDOM.getBoundingClientRect()
  const left =
    view.textDirection == Direction.LTR ? rect.left : rect.right - view.scrollDOM.clientWidth
  return {
    left: left - view.scrollDOM.scrollLeft * view.scaleX,
    top: rect.top - view.scrollDOM.scrollTop * view.scaleY,
  }
}

function measureCursor(view: EditorView, cursor: SelectionRange, primary: boolean): Piece | null {
  const blockCursor = true
  if (!blockCursor) {
    return null
  }

  let head = cursor.head
  const hCoeff = 1

  let letter = head < view.state.doc.length && view.state.sliceDoc(head, head + 1)
  let isPlaceholderLetter = false

  // If the document is empty, use the first character of the placeholder
  if (head === 0 && view.state.doc.length === 0) {
    const placeholderFirstChar = getPlaceholderFirstChar(view)
    if (placeholderFirstChar) {
      letter = placeholderFirstChar
      isPlaceholderLetter = true
    }
  }

  if (letter && /[\uDC00-\uDFFF]/.test(letter) && head > 1) {
    // step back if cursor is on the second half of a surrogate pair
    head--
    letter = view.state.sliceDoc(head, head + 1)
  }

  const pos = view.coordsAtPos(head, 1)
  if (!pos) return null
  const base = getBase(view)
  let domAtPos = view.domAtPos(head)
  let node = domAtPos ? domAtPos.node : view.contentDOM
  if (node instanceof Text && domAtPos.offset >= node.data.length) {
    if (node.parentElement?.nextSibling) {
      node = node.parentElement?.nextSibling
      domAtPos = { node: node, offset: 0 }
    }
  }
  while (domAtPos && domAtPos.node instanceof HTMLElement) {
    node = domAtPos.node
    domAtPos = { node: domAtPos.node.childNodes[domAtPos.offset], offset: 0 }
  }
  if (!(node instanceof HTMLElement)) {
    if (!node.parentNode) return null
    node = node.parentNode
  }
  const style = getComputedStyle(node as HTMLElement)
  let left = pos.left
  // TODO remove coordsAtPos when all supported versions of codemirror have coordsForChar api
  const charCoords = view.coordsForChar?.(head)
  if (charCoords) {
    left = charCoords.left
  }
  if (!letter || letter == '\n' || letter == '\r') {
    letter = '\xa0'
  } else if (letter == '\t') {
    letter = '\xa0'
    const nextPos = view.coordsAtPos(head + 1, -1)
    if (nextPos) {
      left = nextPos.left - (nextPos.left - pos.left) / parseInt(style.tabSize)
    }
  } else if (/[\uD800-\uDBFF]/.test(letter) && head < view.state.doc.length - 1) {
    // include the second half of a surrogate pair in cursor
    letter += view.state.sliceDoc(head + 1, head + 2)
  }
  const h = pos.bottom - pos.top
  const isPartial = hCoeff != 1
  return new Piece(
    (left - base.left) / view.scaleX,
    (pos.top - base.top + h * (1 - hCoeff)) / view.scaleY,
    (h * hCoeff) / view.scaleY,
    style.fontFamily,
    style.fontSize,
    style.fontWeight,
    style.color,
    `cm-block-cursor ${primary ? 'cm-cursor-primary' : 'cm-cursor-secondary'} ${isPlaceholderLetter ? 'cm-block-cursor-placeholder' : ''} ${isPartial ? 'cm-block-cursor-partial' : ''}`,
    letter,
  )
}

function getPlaceholderFirstChar(view: EditorView): string | null {
  const placeholder = view.contentDOM.querySelector('.cm-placeholder')
  if (!placeholder || !placeholder.firstChild || placeholder.firstChild.nodeType !== 3) return null

  const placeholderText = placeholder.firstChild.textContent
  if (!placeholderText) return null

  const firstChar = placeholderText[0]
  return firstChar
}
