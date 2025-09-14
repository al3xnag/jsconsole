import { HighlightCodeLang, highlightCodeInHTMLElement } from '@/lib/highlightCode'
import { memo } from 'react'

export const HighlightCode = memo(function HighlightCode({
  lang,
  children,
  className,
}: {
  lang: HighlightCodeLang
  children: React.ReactNode
  className?: string
}) {
  const ref = (element: HTMLDivElement | null) => {
    if (element) {
      highlightCodeInHTMLElement(element, lang)
    }
  }

  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  )
})
