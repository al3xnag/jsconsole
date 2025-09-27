import type { ReactNode } from 'react'
import { useEffect, useReducer } from 'react'
import { initStoreFromUrlOrLocalStorage, saveStore } from '@/lib/store'
import { StoreContext, StoreDispatchContext } from '@/lib/StoreContext'
import { ConsoleEntry, ConsoleEntryInput, Store, StoreReducerAction } from '@/types'
import { getGlobals } from '@/lib/globals'
import { resetAllSessions, resetCurrentSession } from '@/lib/store-utils'
import { exhaustMicrotaskQueue } from '@/lib/exhaustMicrotaskQueue'
import { SideEffectInfo } from '@jsconsole/interpreter'

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(storeReducer, null, initStoreFromUrlOrLocalStorage)

  useEffect(() => {
    exhaustMicrotaskQueue().then(() => {
      saveStore(store)
    })
  }, [store])

  return (
    <StoreContext.Provider value={store}>
      <StoreDispatchContext.Provider value={dispatch}>{children}</StoreDispatchContext.Provider>
    </StoreContext.Provider>
  )
}

function storeReducer(store: Store, action: StoreReducerAction): Store {
  switch (action.type) {
    case 'setStore': {
      return action.store
    }

    case 'clearConsole': {
      const currentSession = store.sessions.at(-1)
      if (!currentSession) {
        return store
      }

      const newStore: Store = {
        ...store,
        sessions: [
          {
            ...currentSession,
            entries: action.withEntry
              ? [
                  {
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    type: 'system',
                    kind: 'console-cleared',
                  },
                ]
              : [],
          },
        ],
      }

      return newStore
    }

    case 'addConsoleEntry': {
      const currentSession = store.sessions.at(-1)
      if (!currentSession) {
        return store
      }

      if (action.payload.sessionId && currentSession.id !== action.payload.sessionId) {
        return store
      }

      const index = currentSession.entries.findLastIndex(
        (entry) => entry.type !== 'input' || entry.state !== 'not-evaluated',
      )

      const newEntries = currentSession.entries.toSpliced(index + 1, 0, action.payload.consoleEntry)

      const newStore: Store = {
        ...store,
        sessions: [
          ...store.sessions.slice(0, -1),
          {
            ...currentSession,
            entries: newEntries,
          },
        ],
      }

      return newStore
    }

    case 'updateConsoleEntry': {
      const currentSession = store.sessions.at(-1)
      if (!currentSession) {
        return store
      }

      if (action.payload.sessionId && currentSession.id !== action.payload.sessionId) {
        return store
      }

      const index = currentSession.entries.findIndex(
        (entry) => entry.id === action.payload.consoleEntry.id,
      )

      if (index !== -1) {
        const updatedEntry = {
          ...currentSession.entries[index],
          ...action.payload.consoleEntry,
        } as ConsoleEntry

        return {
          ...store,
          sessions: [
            ...store.sessions.slice(0, -1),
            {
              ...currentSession,
              entries: currentSession.entries.toSpliced(index, 1, updatedEntry),
            },
          ],
        }
      }

      return store
    }

    case 'removeConsoleEntry': {
      const { session, consoleEntry } = action.payload

      return {
        ...store,
        sessions: store.sessions.map((s) =>
          s.id === session.id
            ? {
                ...s,
                entries: s.entries.filter((entry) => {
                  if (entry.id === consoleEntry.id) {
                    return false
                  }

                  if (entry.type === 'input' && entry.resultId === consoleEntry.id) {
                    return false
                  }

                  if (entry.type === 'result' && entry.inputId === consoleEntry.id) {
                    return false
                  }

                  return true
                }),
              }
            : s,
        ),
      }
    }

    case 'newSession': {
      const currentSession = store.sessions.at(-1)

      if (!currentSession) {
        return {
          ...store,
          sessions: [
            {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              entries: [],
              previewWindow: action.previewWindow,
              globals: getGlobals(action.previewWindow),
              globalScope: { bindings: new Map() },
              metadata: action.metadata,
              sideEffectInfo: SideEffectInfo.withDefaults(action.previewWindow),
            },
          ],
        }
      }

      if (
        currentSession.entries.filter(
          (entry) => entry.type === 'input' || entry.type === 'user-agent',
        ).length === 0
      ) {
        return {
          ...store,
          sessions: [
            ...store.sessions.slice(0, -1).map((session) => ({
              ...session,
              previewWindow: null,
              sideEffectInfo: new SideEffectInfo(),
            })),
            {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              entries: [],
              previewWindow: action.previewWindow,
              globals: getGlobals(action.previewWindow),
              globalScope: { bindings: new Map() },
              metadata: action.metadata,
              sideEffectInfo: SideEffectInfo.withDefaults(action.previewWindow),
            },
          ],
        }
      }

      return {
        ...store,
        sessions: [
          ...store.sessions.slice(0, -1).map((session) => ({
            ...session,
            previewWindow: null,
            sideEffectInfo: new SideEffectInfo(),
          })),
          {
            ...currentSession,
            entries: currentSession.entries.map((entry) => {
              return entry.type === 'input' && entry.state === 'evaluating'
                ? ({
                    ...entry,
                    id: crypto.randomUUID(),
                    state: 'not-evaluated',
                  } satisfies ConsoleEntryInput)
                : entry
            }),
            previewWindow: null,
            sideEffectInfo: new SideEffectInfo(),
          },
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            entries: [],
            previewWindow: action.previewWindow,
            globals: getGlobals(action.previewWindow),
            globalScope: { bindings: new Map() },
            metadata: action.metadata,
            sideEffectInfo: SideEffectInfo.withDefaults(action.previewWindow),
          },
        ],
      }
    }

    case 'resetAllSessions': {
      return resetAllSessions(store)
    }

    case 'resetCurrentSession': {
      return resetCurrentSession(store)
    }
  }
}
