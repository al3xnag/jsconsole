import { highlightStyle } from '../../../app/src/lib/highlightStyle'
import { createEditor } from './createEditor'
import { editorTheme } from './editorTheme'
import { highlightLocation } from './highlightLocationExtension'

initTheme()

const editorView = createEditor({
  parent: document.getElementById('editor')!,
  highlightStyle,
  theme: editorTheme,
  initialValue: decodeURIComponent(
    document.querySelector('meta[name="data-source"]')!.getAttribute('content')!,
  ),
})

const locationToHighlight = parseLocationToHighlight()
if (locationToHighlight) {
  highlightLocation(editorView, locationToHighlight)
}

editorView.focus()

function initTheme() {
  const root = window.document.documentElement
  const theme = localStorage.getItem('theme') || 'system'

  if (theme === 'system') {
    const mediaQuery = matchMedia('(prefers-color-scheme: dark)')
    root.classList.add(mediaQuery.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', (event: MediaQueryListEvent) => {
      root.classList.remove('light', 'dark')
      root.classList.add(event.matches ? 'dark' : 'light')
    })
  } else {
    root.classList.add(theme)
  }
}

function parseLocationToHighlight():
  | [lineStart: number, colStart: number]
  | [lineStart: number, colStart: number, lineEnd: number, colEnd: number]
  | undefined {
  const hash = location.hash.slice(1)
  if (!hash) {
    return
  }

  const chunks = hash.split(';')
  const locationChunk = chunks.find((chunk) => chunk.startsWith('L'))
  if (!locationChunk) {
    return
  }

  const loc = locationChunk.slice(1).split(':')

  const lineStart = parseLocationValue(loc[0])
  if (lineStart === undefined) {
    return undefined
  }

  const colStart = parseLocationValue(loc[1]) ?? 1

  if (loc.length < 4) {
    return [lineStart, colStart]
  }

  const lineEnd = parseLocationValue(loc[2])
  if (lineEnd === undefined) {
    return undefined
  }

  const colEnd = parseLocationValue(loc[3]) ?? 1

  return [lineStart, colStart, lineEnd, colEnd]
}

function parseLocationValue(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined
  }

  const num = Number(value)
  if (isNaN(num)) {
    return undefined
  }

  return num
}
