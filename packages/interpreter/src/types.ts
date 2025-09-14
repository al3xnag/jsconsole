import {
  AnonymousFunctionDeclaration,
  ArrowFunctionExpression,
  FunctionDeclaration,
  FunctionExpression,
} from 'acorn'
import {
  EMPTY,
  TYPE_AWAIT,
  TYPE_BREAK,
  TYPE_CONTINUE,
  TYPE_RETURN,
  UNINITIALIZED,
} from './constants'
import { Metadata } from './lib/Metadata'
import { SideEffectInfo } from './lib/SideEffectInfo'

declare module 'acorn' {
  interface Node {
    parent?: AnyNode
  }
}

export type PublicGlobalScope = Pick<GlobalScope, 'bindings'>

export type EvaluateOptions = {
  wrapObjectLiteral?: boolean
  globalObject?: object
  globalScope?: PublicGlobalScope
  metadata?: Metadata
  throwOnSideEffect?: boolean
  sideEffectInfo?: SideEffectInfo
  timeout?: number
  debug?: (...args: unknown[]) => void
}

export type EvaluateResult<T = unknown> = {
  value: T
}

export type GlobalScope = {
  kind: 'global'
  bindings: Map<string, { value: unknown; kind: 'let' | 'const' }>
  parent: null
  name?: undefined
  hasThisBinding: true
  thisValue: object
}

export type ModuleScope = {
  kind: 'module'
  bindings: Map<string, { value: unknown; kind: 'var' | 'let' | 'const' }>
  parent: GlobalScope
  name: string
  hasThisBinding: true
  thisValue: undefined
}

export type FunctionScope = {
  kind: 'function'
  bindings: Map<string, { value: unknown; kind: 'var' | 'let' | 'const' }>
  parent: Scope
  name: string
  /**
   * `false` for arrow functions, `true` for normal functions.
   * https://tc39.es/ecma262/#table-additional-fields-of-function-environment-records
   */
  hasThisBinding: boolean
  /**
   * https://tc39.es/ecma262/#table-additional-fields-of-function-environment-records
   */
  thisValue: unknown | typeof UNINITIALIZED | undefined
  /**
   * https://tc39.es/ecma262/#table-additional-fields-of-function-environment-records
   */
  newTarget: unknown | undefined
}

export type BlockScope = {
  kind: 'block'
  bindings: Map<string, { value: unknown; kind: 'let' | 'const' }>
  parent: Scope
  name: string
  hasThisBinding?: false
  thisValue?: undefined
}

export type Scope = GlobalScope | ModuleScope | FunctionScope | BlockScope

export type Context = {
  type: 'script' | 'module'
  code: string
  strict: boolean
  globalObject: Record<PropertyKey, unknown>
  globalScope: GlobalScope
  metadata: Metadata
  sideEffectInfo: SideEffectInfo
  debug?: (...args: unknown[]) => void
}

export type EvaluatedNodeType =
  | typeof TYPE_RETURN
  | typeof TYPE_BREAK
  | typeof TYPE_CONTINUE
  | typeof TYPE_AWAIT

export type EvaluatedNode = {
  value: any | typeof EMPTY
  type?: EvaluatedNodeType
  base?: any
  label?: string
}

export type AnyFunction =
  | FunctionDeclaration
  | AnonymousFunctionDeclaration
  | FunctionExpression
  | ArrowFunctionExpression

export type EvaluateGenerator = Generator<EvaluatedNode, EvaluatedNode, EvaluatedNode>
