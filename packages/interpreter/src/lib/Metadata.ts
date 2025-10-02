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

export class Metadata {
  functions: WeakMap<Function, FunctionMetadata> = new WeakMap()
  promises: WeakMap<Promise<unknown>, PromiseMetadata> = new WeakMap()
  weakMaps: WeakMap<WeakMap<WeakKey, unknown>, WeakMapMetadata> = new WeakMap()
  weakSets: WeakMap<WeakSet<WeakKey>, WeakSetMetadata> = new WeakMap()
  proxies: WeakMap<object, ProxyMetadata> = new WeakMap()
  classes: WeakMap<object, ClassMetadata> = new WeakMap()
}
