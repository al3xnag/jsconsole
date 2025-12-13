import initPreviewScriptUrl from './preview/initPreview?worker&url'
import styleUrl from './preview/style.css?url'

export type SourcePreviewOptions = {
  title: string
  source: string
  /** 1-based */
  location?:
    | [lineStart: number, colStart: number]
    | [lineStart: number, colStart: number, lineEnd: number, colEnd: number]
}

export type SourcePreview = {
  url: string
  dispose: () => void
}

export function createSourcePreview(options: SourcePreviewOptions): SourcePreview {
  const html = getSourcePreviewHtml(options)
  const blob = new Blob([html], { type: 'text/html' })
  const blobUrl = URL.createObjectURL(blob)

  let url = blobUrl
  if (options.location) {
    url += '#L' + options.location.join(':')
  }

  return {
    url,
    dispose: () => URL.revokeObjectURL(blobUrl),
  }
}

function getSourcePreviewHtml(options: SourcePreviewOptions) {
  const { title, source, location } = options
  const pageTitle = location ? `${title}:${location[0]}:${location[1]}` : title

  const initPreviewScriptAbsUrl = new URL(initPreviewScriptUrl, import.meta.url).href
  const styleAbsUrl = new URL(styleUrl, import.meta.url).href

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="data-source" content="${encodeURIComponent(source)}">
        <title>${pageTitle}</title>
        <link rel="stylesheet" href="${styleAbsUrl}"> 
      </head>
      <body>
        <h1>${title}</h1>
        <div id="editor"></div>
        <script${import.meta.env.DEV ? ' type="module"' : ''} src="${initPreviewScriptAbsUrl}"></script>
      </body>
    </html>
  `
}
