import { memo, useMemo } from 'react'
import injectInterpreterRelativeUrl from '@/lib/injectInterpreter?worker&url'

type PreviewIframeProps = React.DetailedHTMLProps<
  React.IframeHTMLAttributes<HTMLIFrameElement>,
  HTMLIFrameElement
>

const injectInterpreterUrl = new URL(injectInterpreterRelativeUrl, import.meta.url).href

export const PreviewIframe = memo((props: PreviewIframeProps) => {
  const iframeSrc = useMemo(() => {
    const html = `<!DOCTYPE html><meta name="color-scheme" content="light dark"><script src="${injectInterpreterUrl}" type="module" onload="this.remove()"></script>`
    const blob = new Blob([html], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }, [])

  return <iframe {...props} src={iframeSrc} />
})
