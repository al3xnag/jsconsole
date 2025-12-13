import {
  ClassFieldDefinitionRecord,
  Context,
  FunctionCallInternal,
  PrivateElementMap,
} from '../types'
import { findGetter } from './findGetter'
import { findSetter } from './findSetter'
import { InternalError } from './InternalError'

export type FunctionMetadata = {
  sourceCode?: string
  bound?: boolean
  // NOTE: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#thisarg
  // thisArg: if the function is not in strict mode, null and undefined will be replaced with the global object,
  // and primitive values will be converted to objects. The value is ignored if the bound function is constructed
  // using the new operator.
  // NOTE: bound of bound: new thisArg is ignored (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#description).
  // NOTE: console.dir(foo.bind()) // [[BoundThis]]: undefined; [[BoundArgs]]: Array(0)
  boundThis?: unknown
  boundArgs?: unknown[]
  // Function that is bound to
  targetFunction?: Function
  arrow?: boolean
  async?: boolean
  generator?: boolean
  constructable?: boolean
  isClassConstructor?: boolean
  // [[HomeObject]]
  homeObject?: object
  // [[PrivateMethods]]
  privateMethods?: PrivateElementMap
  // [[Fields]]
  fields?: ClassFieldDefinitionRecord[]
  callInternal?: FunctionCallInternal
}

export type PromiseMetadata = {
  state: 'pending' | 'fulfilled' | 'rejected'
  result: unknown
}

export type WeakMapMetadata = {
  entries: Map<WeakRef<WeakKey> | WeakKey, unknown | WeakRef<object>>
}

export type WeakSetMetadata = {
  values: Set<WeakRef<WeakKey> | WeakKey>
}

export type ProxyMetadata = {
  target: object
  handler: ProxyHandler<object>
}

export type MetadataGlobals = {
  String: StringConstructor
  Number: NumberConstructor
  RegExp: RegExpConstructor
  Object: ObjectConstructor
  ObjectPrototype: ObjectConstructor['prototype']
  ObjectCreate: ObjectConstructor['create']
  Array: ArrayConstructor
  ArrayFrom: ArrayConstructor['from']
  ArrayPrototypeValues: ArrayConstructor['prototype']['values']
  Function: FunctionConstructor
  FunctionPrototype: FunctionConstructor['prototype']
  AsyncFunction: FunctionConstructor
  AsyncFunctionPrototype: FunctionConstructor['prototype']
  FunctionPrototypeToString: FunctionConstructor['prototype']['toString']
  FunctionPrototypeCall: FunctionConstructor['prototype']['call']
  FunctionPrototypeApply: FunctionConstructor['prototype']['apply']
  FunctionPrototypeBind: FunctionConstructor['prototype']['bind']
  Error: ErrorConstructor
  ErrorStackGetter: (this: Error) => string
  ErrorStackSetter: (this: Error, stack: string) => void
  ErrorCaptureStackTrace: ErrorConstructor['captureStackTrace']
  SyntaxError: SyntaxErrorConstructor
  RangeError: RangeErrorConstructor
  TypeError: TypeErrorConstructor
  ReferenceError: ReferenceErrorConstructor
  EvalError: EvalErrorConstructor
  URIError: URIErrorConstructor
  Promise: PromiseConstructor
  WeakMap: WeakMapConstructor
  WeakSet: WeakSetConstructor
  WeakRef: WeakRefConstructor
  WeakMapPrototypeSet: WeakMapConstructor['prototype']['set']
  WeakMapPrototypeDelete: WeakMapConstructor['prototype']['delete']
  WeakSetPrototypeAdd: WeakSetConstructor['prototype']['add']
  WeakSetPrototypeDelete: WeakSetConstructor['prototype']['delete']
  Proxy: ProxyConstructor
}

export type Source = {
  content: string
}

export class Metadata {
  functions: WeakMap<Function, FunctionMetadata> = new WeakMap()
  promises: WeakMap<Promise<unknown>, PromiseMetadata> = new WeakMap()
  weakMaps: WeakMap<WeakMap<WeakKey, unknown>, WeakMapMetadata> = new WeakMap()
  weakSets: WeakMap<WeakSet<WeakKey>, WeakSetMetadata> = new WeakMap()
  proxies: WeakMap<object, ProxyMetadata> = new WeakMap()
  privateElements: WeakMap<object, PrivateElementMap> = new WeakMap()
  globals: MetadataGlobals = Object.create(null)
  sources: Map<string, Source> = new Map()

  constructor(global: typeof globalThis) {
    this.globals.String = global.String
    this.globals.Number = global.Number
    this.globals.RegExp = global.RegExp
    this.globals.Object = global.Object
    this.globals.ObjectPrototype = global.Object.prototype
    this.globals.ObjectCreate = global.Object.create
    this.globals.Array = global.Array
    this.globals.ArrayFrom = global.Array.from
    this.globals.ArrayPrototypeValues = global.Array.prototype.values
    this.globals.Function = global.Function
    this.globals.FunctionPrototype = global.Function.prototype
    this.globals.AsyncFunction = getAsyncFunctionConstructor(global)
    this.globals.AsyncFunctionPrototype = this.globals.AsyncFunction.prototype
    this.globals.FunctionPrototypeToString = global.Function.prototype.toString
    this.globals.FunctionPrototypeCall = global.Function.prototype.call
    this.globals.FunctionPrototypeApply = global.Function.prototype.apply
    this.globals.FunctionPrototypeBind = global.Function.prototype.bind
    this.globals.Error = global.Error
    const dummyError = global.Error()
    this.globals.ErrorStackGetter = findGetter(dummyError, 'stack')!
    this.globals.ErrorStackSetter = findSetter(dummyError, 'stack')!
    this.globals.ErrorCaptureStackTrace = global.Error.captureStackTrace
    this.globals.SyntaxError = global.SyntaxError
    this.globals.RangeError = global.RangeError
    this.globals.TypeError = global.TypeError
    this.globals.ReferenceError = global.ReferenceError
    this.globals.EvalError = global.EvalError
    this.globals.URIError = global.URIError
    this.globals.Promise = global.Promise
    this.globals.WeakMap = global.WeakMap
    this.globals.WeakSet = global.WeakSet
    this.globals.WeakRef = global.WeakRef
    this.globals.WeakMapPrototypeSet = global.WeakMap.prototype.set
    this.globals.WeakMapPrototypeDelete = global.WeakMap.prototype.delete
    this.globals.WeakSetPrototypeAdd = global.WeakSet.prototype.add
    this.globals.WeakSetPrototypeDelete = global.WeakSet.prototype.delete
    this.globals.Proxy = global.Proxy
  }
}

function getAsyncFunctionConstructor(global: typeof globalThis): FunctionConstructor {
  if (global === globalThis) {
    const fn = async function () {}
    return fn.constructor as FunctionConstructor
  }

  if ('AsyncFunction' in global && typeof global.AsyncFunction === 'function') {
    return global.AsyncFunction as FunctionConstructor
  }

  try {
    const fn = new global.Function('return async function() {}')()
    return fn.constructor as FunctionConstructor
  } catch (cause) {
    const err = new InternalError('Failed to obtain async function prototype')
    err.cause = cause
    throw err
  }
}

export function getOrCreatePrivateElements(obj: object, context: Context): PrivateElementMap {
  let map = context.metadata.privateElements.get(obj)
  if (map) {
    return map
  }

  map = Object.create(null)
  context.metadata.privateElements.set(obj, map!)
  return map!
}
