'use client'

import { Console } from '@/components/Console'
import { Header } from '@/components/Header'
import { Preview } from '@/components/Preview'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useConsole } from '@/hooks/useConsole'
import { usePreview } from '@/hooks/usePreview'
import type { PanelGroupStorage } from 'react-resizable-panels'

const panelGroupDefaultState = {
  'console,preview': {
    expandToSizes: { preview: 30 },
    layout: [100, 0],
  },
}

const panelGroupStorage: PanelGroupStorage = {
  getItem(name) {
    return localStorage.getItem(name) ?? JSON.stringify(panelGroupDefaultState)
  },
  setItem(name, value) {
    localStorage.setItem(name, value)
  },
}

export function Playground() {
  return (
    <div className="fixed inset-0 flex flex-col text-sm">
      <Header />
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1"
        autoSaveId="main"
        storage={panelGroupStorage}
      >
        <ConsolePanel />
        <ResizableHandle withHandle className="aria-[valuenow=100]:hidden" />
        <PreviewPanel />
      </ResizablePanelGroup>
    </div>
  )
}

function ConsolePanel() {
  const { consoleHandleRef } = useConsole()

  return (
    <ResizablePanel id="console" order={1} minSize={1}>
      <Console ref={consoleHandleRef} />
    </ResizablePanel>
  )
}

function PreviewPanel() {
  const { previewHandleRef, previewPanelHandleRef, handlePreviewResize } = usePreview()

  return (
    <ResizablePanel
      ref={previewPanelHandleRef}
      id="preview"
      order={2}
      collapsible={true}
      minSize={5}
      className="data-[panel-size=0.0]:pointer-events-none data-[panel-size=0.0]:fixed data-[panel-size=0.0]:opacity-0"
      onResize={handlePreviewResize}
    >
      <Preview ref={previewHandleRef} />
    </ResizablePanel>
  )
}
