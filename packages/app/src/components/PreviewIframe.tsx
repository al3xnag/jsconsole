import { memo, useMemo } from 'react'

type PreviewIframeProps = React.DetailedHTMLProps<
  React.IframeHTMLAttributes<HTMLIFrameElement>,
  HTMLIFrameElement
>

export const PreviewIframe = memo((props: PreviewIframeProps) => {
  const iframeSrc = useMemo(() => {
    const html = `<!DOCTYPE html><meta name="color-scheme" content="light dark">`
    const blob = new Blob([html], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }, [])

  return <iframe {...props} src={iframeSrc} />
})
