import { usePreview } from '@/hooks/usePreview'
import { useStore } from '@/hooks/useStore'
import { useStoreDispatch } from '@/hooks/useStoreDispatch'
import { ActionsContext, RestartOptions } from '@/lib/ActionsContext'
import { evaluateEntry } from '@/lib/evaluateEntry'
import { getGlobals } from '@/lib/globals'
import { nextId } from '@/lib/nextId'
import { resetAllSessions, resetCurrentSession } from '@/lib/store-utils'
import { ConsoleEntryInput, ConsoleEntryResult, ConsoleSession } from '@/types'
import { Metadata, SideEffectInfo } from '@jsconsole/interpreter'
import { useCallback, useRef, type ReactNode } from 'react'

export function ActionsProvider({ children }: { children: ReactNode }) {
  const store = useStore()
  const storeDispatch = useStoreDispatch()
  const { previewHandleRef } = usePreview()
  const evaluateAllEntriesAbortControllerRef = useRef<AbortController>(null)

  const evaluateSessionEntries = useCallback(
    async (session: ConsoleSession, awaitTopLevelAwait: boolean) => {
      evaluateAllEntriesAbortControllerRef.current?.abort()
      evaluateAllEntriesAbortControllerRef.current = new AbortController()
      const { signal } = evaluateAllEntriesAbortControllerRef.current

      for (const entry of session.entries) {
        if (signal.aborted) {
          return
        }

        if (entry.type === 'input') {
          storeDispatch({
            type: 'updateConsoleEntry',
            payload: {
              sessionId: session.id,
              consoleEntry: {
                id: entry.id,
                timestamp: Date.now(),
                state: 'evaluating',
                severity: undefined,
                resultId: undefined,
              },
            },
          })

          const result = evaluateEntry(entry, session)

          if (result instanceof Promise) {
            if (awaitTopLevelAwait) {
              const resolvedResult = await result

              storeDispatch({
                type: 'updateConsoleEntry',
                payload: {
                  sessionId: session.id,
                  consoleEntry: {
                    id: entry.id,
                    state: 'evaluated',
                    severity: resolvedResult.severity,
                    resultId: resolvedResult.id,
                  },
                },
              })

              storeDispatch({
                type: 'addConsoleEntry',
                payload: {
                  sessionId: session.id,
                  consoleEntry: resolvedResult,
                },
              })
            } else {
              result.then((resolvedResult) => {
                storeDispatch({
                  type: 'updateConsoleEntry',
                  payload: {
                    sessionId: session.id,
                    consoleEntry: {
                      id: entry.id,
                      state: 'evaluated',
                      severity: resolvedResult.severity,
                      resultId: resolvedResult.id,
                    },
                  },
                })

                storeDispatch({
                  type: 'addConsoleEntry',
                  payload: {
                    sessionId: session.id,
                    consoleEntry: resolvedResult,
                  },
                })
              })
            }
          } else {
            storeDispatch({
              type: 'updateConsoleEntry',
              payload: {
                sessionId: session.id,
                consoleEntry: {
                  id: entry.id,
                  state: 'evaluated',
                  severity: result.severity,
                  resultId: result.id,
                },
              },
            })

            storeDispatch({
              type: 'addConsoleEntry',
              payload: {
                sessionId: session.id,
                consoleEntry: result,
              },
            })
          }
        }
      }
    },
    [storeDispatch],
  )

  const restart = useCallback(
    async ({ what, awaitTopLevelAwait }: RestartOptions) => {
      evaluateAllEntriesAbortControllerRef.current?.abort()

      if (!previewHandleRef.current) {
        return
      }

      const win = await previewHandleRef.current.reload()

      storeDispatch({
        type: 'setStore',
        store: store,
      })

      const newStore =
        what === 'all-sessions' ? resetAllSessions(store) : resetCurrentSession(store)
      const currentSession = newStore.sessions.at(-1)
      if (!currentSession) {
        return
      }

      currentSession.previewWindow = win
      currentSession.globals = getGlobals(win)
      currentSession.globalScope = { bindings: new Map() }
      currentSession.metadata = new Metadata(win)
      currentSession.sideEffectInfo = SideEffectInfo.withDefaults(win)

      storeDispatch({
        type: 'setStore',
        store: newStore,
      })

      await evaluateSessionEntries(currentSession, awaitTopLevelAwait)
    },
    [evaluateSessionEntries, previewHandleRef, store, storeDispatch],
  )

  const clear = useCallback(
    ({ withEntry }: { withEntry: boolean }) => {
      storeDispatch({ type: 'clearConsole', withEntry })
    },
    [storeDispatch],
  )

  const reload = useCallback(async () => {
    evaluateAllEntriesAbortControllerRef.current?.abort()

    if (!previewHandleRef.current) {
      return
    }

    await previewHandleRef.current.reload()
  }, [previewHandleRef])

  const submit = useCallback(
    (
      input: string,
    ): {
      input: ConsoleEntryInput
      result: ConsoleEntryResult | Promise<ConsoleEntryResult>
    } => {
      const currentSession = store.sessions.at(-1)
      if (!currentSession) {
        throw new Error('No session found')
      }

      if (!currentSession.previewWindow) {
        throw new Error('previewWindow is not set')
      }

      let inputEntry: ConsoleEntryInput = {
        id: nextId(),
        value: input,
        type: 'input',
        timestamp: Date.now(),
        state: 'evaluating',
      }

      storeDispatch({
        type: 'addConsoleEntry',
        payload: {
          sessionId: currentSession.id,
          consoleEntry: inputEntry,
        },
      })

      const result = evaluateEntry(inputEntry, currentSession)

      if (result instanceof Promise) {
        result.then((result) => {
          inputEntry = {
            ...inputEntry,
            state: 'evaluated',
            severity: result.severity,
            resultId: result.id,
          }

          storeDispatch({
            type: 'updateConsoleEntry',
            payload: {
              sessionId: currentSession.id,
              consoleEntry: inputEntry,
            },
          })

          storeDispatch({
            type: 'addConsoleEntry',
            payload: {
              sessionId: currentSession.id,
              consoleEntry: result,
            },
          })
        })
      } else {
        inputEntry = {
          ...inputEntry,
          state: 'evaluated',
          severity: result.severity,
          resultId: result.id,
        }

        storeDispatch({
          type: 'updateConsoleEntry',
          payload: {
            sessionId: currentSession.id,
            consoleEntry: inputEntry,
          },
        })

        storeDispatch({
          type: 'addConsoleEntry',
          payload: {
            sessionId: currentSession.id,
            consoleEntry: result,
          },
        })
      }

      return { input: inputEntry, result }
    },
    [storeDispatch, store.sessions],
  )

  return (
    <ActionsContext.Provider
      value={{
        restart,
        clear,
        reload,
        submit,
      }}
    >
      {children}
    </ActionsContext.Provider>
  )
}
