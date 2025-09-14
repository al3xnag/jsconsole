import { PreviewRefHandle } from '@/components/Preview'
import createRequiredContext from '@/lib/createRequiredContext'
import { RefObject } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'

export const PreviewContext = createRequiredContext<{
  previewShown: boolean
  togglePreview: (show?: boolean) => void
  handlePreviewResize: (size: number) => void
  previewHandleRef: RefObject<PreviewRefHandle | null>
  previewPanelHandleRef: RefObject<ImperativePanelHandle | null>
}>()
