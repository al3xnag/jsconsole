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

export type ClassMetadata = {
  privateDescriptors: Map<string, PropertyDescriptor>
}

export type MetadataGlobals = {
  Object?: ObjectConstructor
  ObjectPrototype?: ObjectConstructor['prototype']
  ObjectCreate?: ObjectConstructor['create']
  Array?: ArrayConstructor
  FunctionPrototype?: FunctionConstructor['prototype']
  AsyncFunctionPrototype?: FunctionConstructor['prototype']
  FunctionPrototypeToString?: FunctionConstructor['prototype']['toString']
  FunctionPrototypeCall?: FunctionConstructor['prototype']['call']
  FunctionPrototypeApply?: FunctionConstructor['prototype']['apply']
  FunctionPrototypeBind?: FunctionConstructor['prototype']['bind']
  TypeError?: TypeErrorConstructor
  ReferenceError?: ReferenceErrorConstructor
  EvalError?: EvalErrorConstructor
  Promise?: PromiseConstructor
  RegExp?: RegExpConstructor
  WeakMap?: WeakMapConstructor
  WeakSet?: WeakSetConstructor
  WeakRef?: WeakRefConstructor
  WeakMapPrototypeSet?: WeakMapConstructor['prototype']['set']
  WeakMapPrototypeDelete?: WeakMapConstructor['prototype']['delete']
  WeakSetPrototypeAdd?: WeakSetConstructor['prototype']['add']
  WeakSetPrototypeDelete?: WeakSetConstructor['prototype']['delete']
  Proxy?: ProxyConstructor
}

export class Metadata {
  functions: WeakMap<Function, FunctionMetadata> = new WeakMap()
  promises: WeakMap<Promise<unknown>, PromiseMetadata> = new WeakMap()
  weakMaps: WeakMap<WeakMap<WeakKey, unknown>, WeakMapMetadata> = new WeakMap()
  weakSets: WeakMap<WeakSet<WeakKey>, WeakSetMetadata> = new WeakMap()
  proxies: WeakMap<object, ProxyMetadata> = new WeakMap()
  classes: WeakMap<object, ClassMetadata> = new WeakMap()
  globals: MetadataGlobals = Object.create(null)

  constructor(globalObject: Partial<typeof globalThis>) {
    this.globals.Object = globalObject.Object
    this.globals.ObjectPrototype = globalObject.Object?.prototype
    this.globals.ObjectCreate = globalObject.Object?.create
    this.globals.Array = globalObject.Array
    this.globals.FunctionPrototype = globalObject.Function?.prototype
    if (typeof globalObject.eval === 'function') {
      const asyncFunction = globalObject.eval('(async function(){})') as Function
      this.globals.AsyncFunctionPrototype = Object.getPrototypeOf(asyncFunction)
    }

    this.globals.FunctionPrototypeToString = globalObject.Function?.prototype.toString
    this.globals.FunctionPrototypeCall = globalObject.Function?.prototype.call
    this.globals.FunctionPrototypeApply = globalObject.Function?.prototype.apply
    this.globals.FunctionPrototypeBind = globalObject.Function?.prototype.bind
    this.globals.TypeError = globalObject.TypeError
    this.globals.ReferenceError = globalObject.ReferenceError
    this.globals.EvalError = globalObject.EvalError
    this.globals.Promise = globalObject.Promise
    this.globals.RegExp = globalObject.RegExp
    this.globals.WeakMap = globalObject.WeakMap
    this.globals.WeakSet = globalObject.WeakSet
    this.globals.WeakRef = globalObject.WeakRef
    this.globals.WeakMapPrototypeSet = globalObject.WeakMap?.prototype.set
    this.globals.WeakMapPrototypeDelete = globalObject.WeakMap?.prototype.delete
    this.globals.WeakSetPrototypeAdd = globalObject.WeakSet?.prototype.add
    this.globals.WeakSetPrototypeDelete = globalObject.WeakSet?.prototype.delete
    this.globals.Proxy = globalObject.Proxy
  }
}

export function requireGlobal<T>(value: T, name: string): NonNullable<T> {
  if (value == null) {
    throw new EvalError(`Unable to obtain ${name} from the global object`)
  }

  return value
}
