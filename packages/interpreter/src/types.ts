import {
  AnonymousClassDeclaration,
  AnonymousFunctionDeclaration,
  ArrowFunctionExpression,
  ClassDeclaration,
  ClassExpression,
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

export type Primitive = string | number | boolean | bigint | symbol | undefined | null

declare module 'acorn' {
  interface Node {
    parent?: AnyNode
  }
}

export type PublicGlobalScope = Pick<GlobalScope, 'bindings'>

export type EvaluateOptions = {
  contextName?: string
  wrapObjectLiteral?: boolean
  stripTypes?: boolean
  globalObject?: object
  globalScope?: PublicGlobalScope
  metadata?: Metadata
  throwOnSideEffect?: boolean
  sideEffectInfo?: SideEffectInfo
  timeout?: number
  onUnhandledRejection?: (reason: unknown, promise: Promise<unknown>) => void
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
  newTarget: Constructor | undefined
  functionObject: Function
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
  name: string
  type: 'script' | 'module'
  code: string
  strict: boolean
  globalObject: Record<PropertyKey, unknown>
  globalScope: GlobalScope
  metadata: Metadata
  sideEffectInfo: SideEffectInfo
  onUnhandledRejection?: (reason: unknown, promise: Promise<unknown>) => void
  debug?: (...args: unknown[]) => void
}

export type CallStackLocation = {
  file: string
  /** 1-based */
  line: number
  /** 1-based */
  col: number
}

export type CallStack = Array<{
  fn: Function | null
  loc: CallStackLocation | null
  construct?: boolean
}>

export type EvaluatedNodeType =
  | typeof TYPE_RETURN
  | typeof TYPE_BREAK
  | typeof TYPE_CONTINUE
  | typeof TYPE_AWAIT

export type EvaluatedNode = {
  value: any | typeof EMPTY
  type?: EvaluatedNodeType
  base?: any
  thisValue?: any
  label?: string
}

export type AnyFunction =
  | FunctionDeclaration
  | AnonymousFunctionDeclaration
  | FunctionExpression
  | ArrowFunctionExpression

export type AnyClass = ClassDeclaration | AnonymousClassDeclaration | ClassExpression

export type EvaluateGenerator = Generator<EvaluatedNode, EvaluatedNode, EvaluatedNode>

export interface Constructor {
  new (...args: unknown[]): object
}

export type ClassFieldDefinitionRecord = {
  type: 'field'
  name: string
  isPrivate: boolean
  initializer?: Function
}

export type ClassStaticBlockDefinitionRecord = {
  type: 'static-block'
  bodyFunction: Function
}

export type PrivateName = { name: string }

export const PrivateName = function PrivateName(this: any, name: string) {
  this.name = name
} as unknown as { new (name: string): PrivateName }

export type PropertyReference = {
  object: any
  // About `unknown`: https://tc39.es/ecma262/#sec-evaluate-property-access-with-expression-key
  // > NOTE: In most cases, ToPropertyKey will be performed on propertyNameValue immediately after this step.
  // > However, in the case of a[b] = c, it will not be performed until after evaluation of c.
  propertyName: PropertyKey | PrivateName | unknown
  thisValue?: any
}

// https://tc39.es/ecma262/#sec-privateelement-specification-type
export type PrivateElement = {
  kind: 'field' | 'method' | 'accessor'
  // Present for fields and methods
  value?: unknown
  // Present for accessors
  get?: Function
  // Present for accessors
  set?: Function
}

export interface PrivateElementMap {
  [key: string]: PrivateElement
}

export type CreateFunctionResult = {
  fn: Function
  callInternal: FunctionCallInternal
}

export type FunctionCallInternal = (
  this: unknown,
  args: unknown[],
  newTarget: Constructor,
  callee: Function,
  callStack?: CallStack,
) => { result: unknown; scope: FunctionScope }
