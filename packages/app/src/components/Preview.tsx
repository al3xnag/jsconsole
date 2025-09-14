import { Ref, useCallback, useImperativeHandle, useRef, useState } from 'react'
import {
  PreviewWindowRaw,
  PreviewWindow,
  PreviewWindowExtra,
  ConsoleEntryUserAgent,
} from '../types'
import { ResizeOverlay } from './ResizeOverlay'
import { Deferred, deferred } from '@/lib/deferred'
import { useActions } from '@/hooks/useActions'
import { useStoreDispatch } from '@/hooks/useStoreDispatch'
import { PreviewIframe } from './PreviewIframe'
import { Metadata } from '@jsconsole/interpreter'
import { HELP_ENTRY_TEXT } from '@/constants'

export type PreviewRefHandle = {
  reload: () => Promise<PreviewWindow>
}

export type PreviewProps = {
  ref?: Ref<PreviewRefHandle>
}

const loadDeferredInitial = deferred<PreviewWindow>()

export function Preview({ ref }: PreviewProps) {
  const storeDispatch = useStoreDispatch()
  const { clear: clearConsole } = useActions()

  const [iframeKey, setIframeKey] = useState(0)
  const loadDeferredRef = useRef<Deferred<PreviewWindow>>(loadDeferredInitial)
  const isFirstLoad = useRef(true)

  const setupWindow = useCallback(
    (win: PreviewWindowRaw, metadata: Metadata): PreviewWindow => {
      const x = Object.assign<PreviewWindowRaw, PreviewWindowExtra>(win, {
        help: function help() {
          storeDispatch({
            type: 'addConsoleEntry',
            payload: {
              consoleEntry: {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: 'user-agent',
                output: [HELP_ENTRY_TEXT],
                severity: 'info',
              },
            },
          })
        }.bind(win),

        // `setTimeout(() => { console.clear(); console.log('a') }, 1000);` -> Console was cleared; a
        clear: function clear() {
          clearConsole({ withEntry: true })
        }.bind(win),
      })

      // TODO: support revocable proxies
      win.Proxy = new win.Proxy(win.Proxy, {
        construct(origProxy, args: [object, ProxyHandler<object>]) {
          const proxy = new origProxy(...args)
          metadata.proxies.set(proxy, {
            target: args[0],
            handler: args[1],
          })
          return proxy
        },
      })

      const origConsoleLogFn = {
        log: win.console.log,
        warn: win.console.warn,
        error: win.console.error,
        info: win.console.info,
        debug: win.console.debug,
      }

      const origConsoleClearFn = win.console.clear

      const severityMap: Record<keyof typeof origConsoleLogFn, ConsoleEntryUserAgent['severity']> =
        {
          log: undefined,
          warn: 'warning',
          error: 'error',
          info: 'info',
          debug: 'debug',
        }

      function handleConsoleLog(
        this: unknown,
        fn: keyof typeof origConsoleLogFn,
        ...args: unknown[]
      ) {
        origConsoleLogFn[fn].apply(this, args)

        if (args.length > 0) {
          storeDispatch({
            type: 'addConsoleEntry',
            payload: {
              consoleEntry: {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: 'user-agent',
                output: args,
                severity: severityMap[fn],
              },
            },
          })
        }
      }

      function handleConsoleClear(this: unknown) {
        origConsoleClearFn.call(this)
        clearConsole({ withEntry: true })
      }

      Object.assign(win.console, {
        log: function log(...args: unknown[]) {
          handleConsoleLog.call(this, 'log', ...args)
        },
        warn: function warn(...args: unknown[]) {
          handleConsoleLog.call(this, 'warn', ...args)
        },
        error: function error(...args: unknown[]) {
          handleConsoleLog.call(this, 'error', ...args)
        },
        info: function info(...args: unknown[]) {
          handleConsoleLog.call(this, 'info', ...args)
        },
        debug: function debug(...args: unknown[]) {
          handleConsoleLog.call(this, 'debug', ...args)
        },
        clear: function clear() {
          handleConsoleClear.call(this)
        },
      })

      win.addEventListener('error', (e) => {
        storeDispatch({
          type: 'addConsoleEntry',
          payload: {
            consoleEntry: {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'user-agent',
              output: ['Uncaught', e.error],
              severity: 'error',
            },
          },
        })
      })

      win.addEventListener('unhandledrejection', (e) => {
        storeDispatch({
          type: 'addConsoleEntry',
          payload: {
            consoleEntry: {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'user-agent',
              output: ['Uncaught (in promise)', e.reason],
              severity: 'error',
            },
          },
        })
      })

      return x satisfies PreviewWindow
    },
    [clearConsole, storeDispatch],
  )

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLIFrameElement>) => {
      const win = e.currentTarget.contentWindow as PreviewWindowRaw | null
      if (!win) {
        return
      }

      if (!isFirstLoad.current) {
        storeDispatch({
          type: 'addConsoleEntry',
          payload: {
            consoleEntry: {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'system',
              kind: 'user-agent-reloaded',
            },
          },
        })
      }

      const metadata = new Metadata()
      const previewWindow = setupWindow(win, metadata)

      storeDispatch({
        type: 'newSession',
        previewWindow,
        metadata,
      })

      loadDeferredRef.current.resolve(previewWindow)
      isFirstLoad.current = false
    },
    [setupWindow, storeDispatch],
  )

  useImperativeHandle(ref, () => ({
    async reload() {
      loadDeferredRef.current = deferred()
      setIframeKey((prev) => prev + 1)
      return await loadDeferredRef.current.promise
    },
  }))

  return (
    <div className="relative flex h-full w-[round(down,100%,1px)] flex-col">
      <PreviewIframe key={iframeKey} className="flex-1" onLoad={handleLoad} />
      <ResizeOverlay className="absolute inset-0" />
    </div>
  )
}
