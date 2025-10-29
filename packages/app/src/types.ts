import type { GlobalScope, Metadata, SideEffectInfo } from '@jsconsole/interpreter'
import { MarshalledValue } from './lib/marshalled'
import { AnySyntheticPropertyKey } from './lib/synthetic'

export type JSONValue = string | number | boolean | null | JSONValue[] | JSONObject
export type JSONObject = { [key: string]: JSONValue }

export type ConsoleEntryId = number

export interface ConsoleEntryBase {
  id: ConsoleEntryId
  timestamp: number
  severity?: 'error' | 'warning' | 'info' | 'debug'
}

export interface ConsoleEntryInput extends ConsoleEntryBase {
  type: 'input'
  value: string
  state: 'not-evaluated' | 'evaluating' | 'evaluated'
  resultId?: ConsoleEntryId
}

export interface ConsoleEntryResult extends ConsoleEntryBase {
  type: 'result'
  value: unknown
  inputId?: ConsoleEntryId
}

export interface ConsoleEntryUserAgent extends ConsoleEntryBase {
  type: 'user-agent'
  output: unknown[]
}

export interface ConsoleEntrySystem extends ConsoleEntryBase {
  type: 'system'
  kind: 'user-agent-reloaded' | 'console-cleared'
}

export type ConsoleEntry =
  | ConsoleEntryInput
  | ConsoleEntryResult
  | ConsoleEntrySystem
  | ConsoleEntryUserAgent

export type ConsoleEntryStoredJson =
  | ConsoleEntryInput
  | (Omit<ConsoleEntryResult, 'value'> & {
      value: MarshalledValue
    })
  | (Omit<ConsoleEntryUserAgent, 'output'> & {
      output: MarshalledValue[]
    })
  | ConsoleEntrySystem

export type ConsoleSession = {
  id: number
  timestamp: number
  entries: ConsoleEntry[]
  previewWindow: PreviewWindow | null
  globalScope: GlobalScope
  globals: Globals
  metadata: Metadata
  sideEffectInfo: SideEffectInfo
}

export type ConsoleSessionStoredJson = {
  id: number
  timestamp: number
  entries: ConsoleEntryStoredJson[]
}

export type PreviewWindowExtra = {
  clear: () => void
  help: () => void
}

export type PreviewWindow = Window & typeof globalThis & PreviewWindowExtra

export interface Store {
  sessions: ConsoleSession[]
}

export type StoreReducerAction =
  | {
      type: 'setStore'
      store: Store
    }
  | {
      type: 'clearConsole'
      withEntry: boolean
    }
  | {
      type: 'addConsoleEntry'
      payload: {
        sessionId?: number
        consoleEntry: ConsoleEntry
      }
    }
  | {
      type: 'updateConsoleEntry'
      payload: {
        sessionId?: number
        consoleEntry: Pick<ConsoleEntry, 'id'> & Partial<ConsoleEntry>
      }
    }
  | {
      type: 'removeConsoleEntry'
      payload: {
        session: ConsoleSession
        consoleEntry: ConsoleEntry
      }
    }
  | {
      type: 'newSession'
      previewWindow: PreviewWindow
      metadata: Metadata
    }
  | {
      type: 'resetAllSessions'
    }
  | {
      type: 'resetCurrentSession'
    }

export type GlobalThis = typeof globalThis

export type AsyncFunction = (...args: unknown[]) => Promise<unknown>

export interface AsyncFunctionConstructor {
  new (...args: string[]): AsyncFunction
  (...args: string[]): AsyncFunction
  readonly prototype: AsyncFunction
}

export type Globals = {
  [key: PropertyKey]: object | undefined | null
  Node: typeof globalThis.Node
  Element: typeof globalThis.Element
  Error: typeof globalThis.Error
  SyntaxError: typeof globalThis.SyntaxError
  TypeError: typeof globalThis.TypeError
  ReferenceError: typeof globalThis.ReferenceError
  EvalError: typeof globalThis.EvalError
  DOMException: typeof globalThis.DOMException
  Promise: typeof globalThis.Promise
  Map: typeof globalThis.Map
  Set: typeof globalThis.Set
  WeakMap: typeof globalThis.WeakMap
  WeakSet: typeof globalThis.WeakSet
  WeakRef: typeof globalThis.WeakRef
  Symbol: typeof globalThis.Symbol
  Boolean: typeof globalThis.Boolean
  Number: typeof globalThis.Number
  String: typeof globalThis.String
  BigInt: typeof globalThis.BigInt
  Date: typeof globalThis.Date
  RegExp: typeof globalThis.RegExp
  Array: typeof globalThis.Array
  Object: typeof globalThis.Object
  Function: typeof globalThis.Function
  Proxy: typeof globalThis.Proxy
  Reflect: typeof globalThis.Reflect
  eval: typeof globalThis.eval
  AsyncFunction: AsyncFunctionConstructor
  GeneratorFunction: GeneratorFunctionConstructor
  AsyncGeneratorFunction: AsyncGeneratorFunctionConstructor
}

export type BaseProperty = {
  name: PropertyKey
  descriptor: PropertyDescriptor
  isOwn?: boolean
  isSynthetic?: boolean
}

export type OwnProperty = BaseProperty & {
  isOwn: true
  isSynthetic?: false
}

export type InheritedProperty = BaseProperty & {
  isOwn?: false
  isSynthetic?: false
}

export type SyntheticProperty = BaseProperty & {
  name: AnySyntheticPropertyKey
  isOwn?: false
  isSynthetic: true
}

export type Property = OwnProperty | InheritedProperty | SyntheticProperty
