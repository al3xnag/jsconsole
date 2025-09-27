import { Store, ConsoleEntryInput } from '@/types'
import { nextId } from './nextId'

export function resetAllSessions(store: Store): Store {
  const currentSession = store.sessions.at(-1)
  if (!currentSession) {
    return store
  }

  return {
    ...store,
    sessions: [
      {
        id: nextId(),
        timestamp: Date.now(),
        entries: store.sessions
          .flatMap((session) => session.entries)
          .filter((entry) => entry.type === 'input')
          .map((entry) => {
            return {
              id: nextId(),
              type: 'input',
              value: entry.value,
              state: 'not-evaluated',
              timestamp: entry.timestamp,
            } satisfies ConsoleEntryInput
          }),
        previewWindow: currentSession.previewWindow,
        globals: currentSession.globals,
        globalScope: currentSession.globalScope,
        metadata: currentSession.metadata,
        sideEffectInfo: currentSession.sideEffectInfo,
      },
    ],
  }
}

export function resetCurrentSession(store: Store): Store {
  const currentSession = store.sessions.at(-1)
  if (!currentSession) {
    return store
  }

  return {
    ...store,
    sessions: [
      ...store.sessions.slice(0, -1),
      {
        id: nextId(),
        timestamp: Date.now(),
        entries: currentSession.entries
          .filter((entry) => entry.type === 'input')
          .map((entry) => {
            return {
              id: nextId(),
              type: 'input',
              value: entry.value,
              state: 'not-evaluated',
              timestamp: entry.timestamp,
            } satisfies ConsoleEntryInput
          }),
        previewWindow: currentSession.previewWindow,
        globals: currentSession.globals,
        globalScope: currentSession.globalScope,
        metadata: currentSession.metadata,
        sideEffectInfo: currentSession.sideEffectInfo,
      },
    ],
  }
}
