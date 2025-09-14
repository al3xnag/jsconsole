import { PreviewContext } from '@/lib/PreviewContext'
import { useCallback, useRef, useState, type ReactNode } from 'react'
import { PreviewRefHandle } from './Preview'
import { ImperativePanelHandle } from 'react-resizable-panels'

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [previewShown, setPreviewShown] = useState(false)
  const previewHandleRef = useRef<PreviewRefHandle>(null)
  const previewPanelHandleRef = useRef<ImperativePanelHandle>(null)

  const togglePreview = useCallback((show?: boolean) => {
    const panel = previewPanelHandleRef.current
    if (!panel) {
      return
    }

    if (show ?? panel.isCollapsed()) {
      panel.expand()
    } else {
      panel.collapse()
    }
  }, [])

  const handlePreviewResize = useCallback(
    (size: number) => {
      if (size === 0 && previewShown) {
        setPreviewShown(false)
      } else if (size > 0 && !previewShown) {
        setPreviewShown(true)
      }
    },
    [previewShown],
  )

  return (
    <PreviewContext.Provider
      value={{
        previewShown,
        togglePreview,
        handlePreviewResize,
        previewHandleRef,
        previewPanelHandleRef,
      }}
    >
      {children}
    </PreviewContext.Provider>
  )
}
