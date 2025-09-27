import {
  Store,
  ConsoleSession,
  ConsoleSessionStoredJson,
  ConsoleEntry,
  ConsoleEntryUserAgent,
  ConsoleEntrySystem,
  ConsoleEntryResult,
  ConsoleEntryInput,
} from '@/types'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { getGlobals } from './globals'
import { ValueContext } from './ValueContextContext'
import { toRevived } from './revived'
import { assertNever } from '@jsconsole/interpreter/src/lib/assert'
import { Metadata, SideEffectInfo } from '@jsconsole/interpreter'
import { MarshalledValue, toMarshalled } from './marshalled'

type StoreStoredJson = {
  sessions: ConsoleSessionStoredJson[]
}

function getEmptySession(): ConsoleSession {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    entries: [],
    previewWindow: null,
    globals: getGlobals(globalThis),
    globalScope: { bindings: new Map() },
    metadata: new Metadata(),
    sideEffectInfo: new SideEffectInfo(),
  }
}

function getEmptyStore(): Store {
  return {
    sessions: [getEmptySession()],
  }
}

export function isEmptyStore(store: Store): boolean {
  return store.sessions.length === 1 && store.sessions[0].entries.length === 0
}

export function saveStore(store: Store): void {
  try {
    if (isEmptyStore(store)) {
      localStorage.removeItem('store')
      history.replaceState({}, '', ' ')
      return
    }

    const storeJson: StoreStoredJson = {
      sessions: store.sessions
        .filter((session) => {
          return session.entries.length > 0
        })
        .map((session) => {
          return {
            timestamp: session.timestamp,
            entries: session.entries.map((entry) => {
              if (entry.type === 'input') {
                return {
                  id: entry.id,
                  timestamp: entry.timestamp,
                  resultId: entry.resultId,
                  severity: entry.severity,
                  type: entry.type,
                  value: entry.value,
                  state: entry.state,
                }
              } else if (entry.type === 'result') {
                return {
                  id: entry.id,
                  timestamp: entry.timestamp,
                  inputId: entry.inputId,
                  severity: entry.severity,
                  type: entry.type,
                  value: withCache(entry, () =>
                    toMarshalled(entry.value, {
                      globals: session.globals,
                      metadata: session.metadata,
                      sideEffectInfo: session.sideEffectInfo,
                    }),
                  ),
                }
              } else if (entry.type === 'user-agent') {
                return {
                  id: entry.id,
                  timestamp: entry.timestamp,
                  severity: entry.severity,
                  type: entry.type,
                  output: withCache(entry, () =>
                    entry.output.map((x) =>
                      toMarshalled(x, {
                        globals: session.globals,
                        metadata: session.metadata,
                        sideEffectInfo: session.sideEffectInfo,
                      }),
                    ),
                  ),
                }
              } else if (entry.type === 'system') {
                return {
                  id: entry.id,
                  timestamp: entry.timestamp,
                  severity: entry.severity,
                  type: entry.type,
                  kind: entry.kind,
                }
              } else {
                assertNever(entry, 'Invalid entry type')
              }
            }),
          } satisfies ConsoleSessionStoredJson
        }),
    }

    const hash = encodeStore(storeJson)
    localStorage.setItem('store', hash)
    history.replaceState({}, '', `#${hash}`)
  } catch (error) {
    console.error('Error saving store', store)
    throw error
  }
}

export function initStoreFromUrlOrLocalStorage(): Store {
  const encodedSource = location.hash.slice(1) || localStorage.getItem('store')
  if (!encodedSource) {
    return getEmptyStore()
  }

  const storeStoredJson = decodeStore(encodedSource)

  if (!isValidStore(storeStoredJson)) {
    console.error('Invalid store', storeStoredJson)
    return getEmptyStore()
  }

  const store: Store = {
    sessions: [
      ...storeStoredJson.sessions
        .filter((sessionJson) => {
          return sessionJson.entries.length > 0
        })
        .map((sessionJson) => {
          const globals = getGlobals(globalThis)
          const metadata = new Metadata()
          const sideEffectInfo = new SideEffectInfo()
          const globalScope = { kind: 'global' as const, bindings: new Map(), parent: null }
          const valueContext: ValueContext = { globals, metadata, sideEffectInfo }

          return {
            id: crypto.randomUUID(),
            timestamp: sessionJson.timestamp,
            entries: sessionJson.entries.map<ConsoleEntry>((entryJson) => {
              if (entryJson.type === 'input') {
                return {
                  ...entryJson,
                  state: entryJson.state === 'evaluating' ? 'not-evaluated' : entryJson.state,
                } satisfies ConsoleEntryInput
              } else if (entryJson.type === 'result') {
                const entry: ConsoleEntryResult = {
                  ...entryJson,
                  value: toRevived(entryJson.value, valueContext),
                }

                withCache(entry, () => entryJson.value)

                return entry
              } else if (entryJson.type === 'user-agent') {
                const entry: ConsoleEntryUserAgent = {
                  ...entryJson,
                  output: entryJson.output.map((x) => toRevived(x, valueContext)),
                }

                withCache(entry, () => entryJson.output)

                return entry
              } else if (entryJson.type === 'system') {
                return {
                  ...entryJson,
                } satisfies ConsoleEntrySystem
              } else {
                assertNever(entryJson, 'Invalid entry type')
              }
            }),
            previewWindow: null,
            globals,
            globalScope,
            metadata,
            sideEffectInfo,
          } satisfies ConsoleSession
        }),
      getEmptySession(),
    ],
  }

  return store
}

function encodeStore(store: StoreStoredJson): string {
  const str = JSON.stringify(store)
  return compressToEncodedURIComponent(str)
}

function decodeStore(hash: string): unknown {
  const str = decompressFromEncodedURIComponent(hash)
  return JSON.parse(str)
}

function isValidStore(raw: unknown): raw is StoreStoredJson {
  return raw != null && typeof raw == 'object' && 'sessions' in raw && Array.isArray(raw.sessions)
}

const cache = new WeakMap<ConsoleEntry, MarshalledValue | MarshalledValue[]>()

function withCache<T extends MarshalledValue | MarshalledValue[]>(
  key: ConsoleEntry,
  getValue: () => T,
): T {
  if (cache.has(key)) {
    return cache.get(key)! as T
  }

  const value = getValue()
  cache.set(key, value)
  return value
}
