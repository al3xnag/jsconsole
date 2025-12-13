/* eslint-disable @typescript-eslint/no-wrapper-object-types */
import { JSONObject } from '../types'
import { getObjectStringTag } from './getObjectStringTag'
import { isWellKnownSymbol } from './well-known-symbols'
import { ObjectTypeInspector } from './ObjectTypeInspector'
import { ValueContext } from './ValueContextContext'
import { SPECIAL_RESULTS } from '@/constants'
import { getErrorStackUnsafe } from '@jsconsole/interpreter/src/lib/error-utils'

const MAX_DEPTH = 4
const MAX_PROPS = 30

type InnerContext = {
  refs: Set<object>
  depth: number
} & ValueContext

export type MarshalledType =
  | 'undefined'
  | 'number'
  | 'bigint'
  | 'symbol'
  | 'date'
  | 'regexp'
  | 'function'
  | 'array'
  | 'object'
  | 'unknown-object'
  | 'proxy'
  | 'string-object'
  | 'number-object'
  | 'bigint-object'
  | 'boolean-object'
  | 'symbol-object'
  | 'error'
  | 'element'
  | 'node'
  | 'promise'
  | 'map'
  | 'set'
  | 'weakmap'
  | 'weakset'
  | 'weakref'
  | 'special'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Marshalled<T extends MarshalledType, V extends JSONObject = {}> = { $: T } & V

export type MarshalledPropertyDescriptor = {
  value?: MarshalledValue
  get?: MarshalledFunction
  set?: MarshalledFunction
  writable?: boolean
  enumerable?: boolean
  configurable?: boolean
}

export type MarshalledPropertyDescriptors = {
  names?: Array<[key: string, MarshalledPropertyDescriptor]>
  symbols?: Array<[description: string | null, MarshalledPropertyDescriptor]>
  wellKnownSymbols?: Array<[description: string, MarshalledPropertyDescriptor]>
}

export type MarshalledUndefined = Marshalled<'undefined'>
export type MarshalledNumber = Marshalled<
  'number',
  { value: number | 'NaN' | 'Infinity' | '-Infinity' | '-0' }
>
export type MarshalledBigInt = Marshalled<'bigint', { value: string }>
export type MarshalledSymbol = Marshalled<'symbol', { desc?: string }>
export type MarshalledDate = Marshalled<'date', { value: number | null }>
export type MarshalledRegExp = Marshalled<'regexp', { source: string; flags: string }>
export type MarshalledFunction = Marshalled<
  'function',
  {
    str: string
    name: string
    length: number
    arrow?: boolean
    async?: boolean
    generator?: boolean
    bound?: boolean
    boundThis?: MarshalledValue
    boundArgs?: Array<MarshalledValue>
    targetFunction?: MarshalledFunction
  }
>
// NOTE: We can't simply use "value: Array<MarshalledValue>"
// because [1,,2] (with an empty slot) is not equivalent to [1,undefined,2].
// NOTE:
// [1, 1, 1] // (3) [1, 1, 1]
// Array(3).fill(1) // (3) [1, 1, 1]
// class Foo extends Array {}; new Foo(3).fill(1) // Foo(3) [1, 1, 1]
// class Foo extends Array { x = 1 }; new Foo(3).fill(1) // Foo(3) [1, 1, 1, x: 1]
// var a = [1, 1, 1]; a.x = 1; a // [1, 1, 1, x: 1]
export type MarshalledArray = Marshalled<
  'array',
  {
    props: MarshalledPropertyDescriptors
    proto: MarshalledPrototype
  }
>
export type MarshalledObject = Marshalled<
  'object',
  {
    props: MarshalledPropertyDescriptors
    proto: MarshalledPrototype
  }
>
export type MarshalledUnknownObject = Marshalled<'unknown-object', { tag: string | null }>

export type MarshalledProxy = Marshalled<
  'proxy',
  { target: MarshalledValue; handler: MarshalledValue }
>

export type MarshalledStringObject = Marshalled<'string-object', { value: string }>
export type MarshalledNumberObject = Marshalled<
  'number-object',
  { value: MarshalledNumber['value'] }
>
export type MarshalledBigIntObject = Marshalled<
  'bigint-object',
  { value: MarshalledBigInt['value'] }
>
export type MarshalledBooleanObject = Marshalled<'boolean-object', { value: boolean }>
export type MarshalledSymbolObject = Marshalled<
  'symbol-object',
  { desc?: MarshalledSymbol['desc'] }
>
export type MarshalledError = Marshalled<
  'error',
  {
    props: MarshalledPropertyDescriptors
    proto: MarshalledPrototype
    /** native error stack */
    stack?: string
  }
>
export type MarshalledElement = Marshalled<
  'element',
  {
    /**
     * e.g. HTMLBodyElement, HTMLDivElement, etc.
     */
    objectTag: string | null
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/namespaceURI
     * Omitted for "http://www.w3.org/1999/xhtml" namespace.
     */
    namespaceURI?: string | null
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/tagName
     */
    tagName: string
    /**
     * https://developer.mozilla.org/docs/Web/API/Element/attributes
     */
    attributes: Array<{ name: string; value: string }>
  }
>
export type MarshalledNode = Marshalled<
  'node',
  {
    /**
     * e.g. HTMLDocument, Comment, etc.
     */
    objectTag: string | null
    /**
     * https://developer.mozilla.org/docs/Web/API/Node/nodeType
     *
     * - Node.ATTRIBUTE_NODE: https://developer.mozilla.org/en-US/docs/Web/API/Attr
     * - Node.TEXT_NODE: https://developer.mozilla.org/en-US/docs/Web/API/Text
     * - Node.COMMENT_NODE: https://developer.mozilla.org/en-US/docs/Web/API/Comment
     * - Node.DOCUMENT_NODE: https://developer.mozilla.org/en-US/docs/Web/API/Document
     * - Node.DOCUMENT_TYPE_NODE: https://developer.mozilla.org/en-US/docs/Web/API/DocumentType
     * - Node.DOCUMENT_FRAGMENT_NODE: https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
     */
    nodeType:
      | typeof Node.ATTRIBUTE_NODE
      | typeof Node.TEXT_NODE
      | typeof Node.COMMENT_NODE
      | typeof Node.DOCUMENT_NODE
      | typeof Node.DOCUMENT_TYPE_NODE
      | typeof Node.DOCUMENT_FRAGMENT_NODE
      | number
    /**
     * https://developer.mozilla.org/docs/Web/API/Node/nodeName
     *
     * - Node.ATTRIBUTE_NODE: Attribute name
     * - Node.TEXT_NODE: #text
     * - Node.COMMENT_NODE: #comment
     * - Node.DOCUMENT_NODE: #document
     * - Node.DOCUMENT_TYPE_NODE: Document type name. The value of `DocumentType.name`. It should be 'html'.
     * - Node.DOCUMENT_FRAGMENT_NODE: #document-fragment
     */
    nodeName: string
    /**
     * https://developer.mozilla.org/docs/Web/API/Node/nodeValue
     *
     * - Node.ATTRIBUTE_NODE: Attribute value
     * - Node.TEXT_NODE: Text content
     * - Node.COMMENT_NODE: Comment content
     * - Node.DOCUMENT_NODE: null
     * - Node.DOCUMENT_TYPE_NODE: null
     * - Node.DOCUMENT_FRAGMENT_NODE: null
     */
    nodeValue: string | null
  }
>
export type MarshalledPromise = Marshalled<
  'promise',
  {
    /**
     * [[PromiseState]]
     *
     * It's undefined if the state is unknown.
     */
    state?: 'pending' | 'fulfilled' | 'rejected'

    /**
     * [[PromiseResult]]
     *
     * It's undefined if the state is pending or unknown.
     */
    result?: MarshalledValue
  }
>
export type MarshalledMap = Marshalled<
  'map',
  { entries: Array<[MarshalledValue, MarshalledValue]> }
>
export type MarshalledSet = Marshalled<'set', { values: Array<MarshalledValue> }>
export type MarshalledWeakMap = Marshalled<
  'weakmap',
  { entries?: Array<[MarshalledValue, MarshalledValue]> }
>
export type MarshalledWeakSet = Marshalled<'weakset', { values?: Array<MarshalledValue> }>
export type MarshalledWeakRef = Marshalled<'weakref', { target?: MarshalledValue }>
export type MarshalledSpecial = Marshalled<'special', { value: keyof typeof SPECIAL_RESULTS }>

export type AnyMarshalledObject =
  | MarshalledDate
  | MarshalledRegExp
  | MarshalledFunction
  | MarshalledArray
  | MarshalledObject
  | MarshalledUnknownObject
  | MarshalledProxy
  | MarshalledStringObject
  | MarshalledNumberObject
  | MarshalledBigIntObject
  | MarshalledBooleanObject
  | MarshalledSymbolObject
  | MarshalledError
  | MarshalledElement
  | MarshalledNode
  | MarshalledPromise
  | MarshalledMap
  | MarshalledSet
  | MarshalledWeakMap
  | MarshalledWeakSet
  | MarshalledWeakRef
  | MarshalledSpecial

export type AnyMarshalled =
  | MarshalledUndefined
  | MarshalledNumber
  | MarshalledBigInt
  | MarshalledSymbol
  | AnyMarshalledObject

export type MarshalledValue = null | string | boolean | AnyMarshalled

export type MarshalledStandardPrototype = string

export type MarshalledPrototype = null | MarshalledValue | MarshalledStandardPrototype

export function toMarshalled(value: unknown, context: ValueContext): MarshalledValue {
  return toMarshalledInner(value, {
    ...context,
    refs: new Set(),
    depth: 0,
  })
}

export function isMarshalled(value: unknown): value is AnyMarshalled {
  return value !== null && typeof value === 'object' && '$' in value && typeof value.$ === 'string'
}

// JSON don't have undefined type
function toMarshalledUndefined(): MarshalledUndefined {
  return { $: 'undefined' }
}

function toMarshalledNumber(number: number): MarshalledNumber {
  let value: MarshalledNumber['value'] = number

  if (Number.isNaN(number)) {
    value = 'NaN'
  } else if (number === Infinity) {
    value = 'Infinity'
  } else if (number === -Infinity) {
    value = '-Infinity'
  } else if (Object.is(number, -0)) {
    value = '-0'
  }

  return { $: 'number', value }
}

function toMarshalledBigInt(bigint: bigint): MarshalledBigInt {
  return { $: 'bigint', value: bigint.toString() }
}

function toMarshalledSymbol(symbol: symbol): MarshalledSymbol {
  return { $: 'symbol', desc: symbol.description }
}

function toMarshalledSpecial(symbol: symbol): MarshalledSpecial | null {
  switch (symbol) {
    case SPECIAL_RESULTS.HIDDEN:
      return { $: 'special', value: 'HIDDEN' }
    case SPECIAL_RESULTS.HELP:
      return { $: 'special', value: 'HELP' }
    default:
      return null
  }
}

function toMarshalledDate(date: Date): MarshalledDate {
  // new Date().valueOf() // 1744736016503
  // new Date('invalid').valueOf() // NaN
  const value = date.valueOf()
  return { $: 'date', value: isNaN(value) ? null : value }
}

function toMarshalledRegExp(regexp: RegExp): MarshalledRegExp {
  return { $: 'regexp', source: regexp.source, flags: regexp.flags }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function toMarshalledFunction(fn: Function, context: InnerContext): MarshalledFunction {
  const metadata = context.metadata.functions.get(fn)

  return {
    $: 'function',
    str: metadata?.sourceCode ?? Function.prototype.toString.call(fn),
    name: fn.name,
    length: fn.length,
    arrow: metadata?.arrow,
    async: metadata?.async,
    generator: metadata?.generator,
    bound: metadata?.bound,
    boundThis:
      metadata?.boundThis !== undefined
        ? toMarshalledInner(metadata.boundThis, context)
        : undefined,
    boundArgs:
      metadata?.boundArgs !== undefined
        ? metadata.boundArgs.map((arg) => toMarshalledInner(arg, context))
        : undefined,
    targetFunction:
      metadata?.targetFunction !== undefined
        ? toMarshalledFunction(metadata.targetFunction, context)
        : undefined,
  }
}

// class Foo extends Array { x = 1 }
// NOTE: Object.defineProperty(new Foo(2), '2', { set(x) {} }) // Foo(3) [empty × 3, x: 1] // x: 1, length: 3, set 2: ƒ set(x)
// NOTE: Object.defineProperty(new Foo(2), '2', { set(x) {} }).map(x => 1) // Foo(3) [empty × 2, 1, x: 1] // 2: 1, x: 1, length: 3
function toMarshalledArray(array: unknown[], context: InnerContext): MarshalledArray {
  return {
    $: 'array',
    props: getMarshalledProperties(array, context),
    proto: getMarshalledProto(array, context),
  }
}

function toMarshalledObject(object: object, context: InnerContext): MarshalledObject {
  return {
    $: 'object',
    props: getMarshalledProperties(object, context),
    proto: getMarshalledProto(object, context),
  }
}

function toMarshalledUnknownObject(object: object): MarshalledUnknownObject {
  return {
    $: 'unknown-object',
    tag: getObjectStringTag(object),
  }
}

function toMarshalledProxy(proxy: object, context: InnerContext): MarshalledProxy {
  const metadata = context.metadata.proxies.get(proxy)
  if (!metadata) {
    console.assert(false, 'Proxy metadata not found')
    return {
      $: 'proxy',
      target: toMarshalledUnknownObject({}),
      handler: toMarshalledUnknownObject({}),
    }
  }

  return {
    $: 'proxy',
    target: toMarshalledInner(metadata.target, context),
    handler: toMarshalledInner(metadata.handler, context),
  }
}

function toMarshalledStringObject(stringObject: String): MarshalledStringObject {
  return { $: 'string-object', value: stringObject.valueOf() }
}

function toMarshalledNumberObject(numberObject: Number): MarshalledNumberObject {
  return { $: 'number-object', value: toMarshalledNumber(numberObject.valueOf()).value }
}

function toMarshalledBigIntObject(bigintObject: BigInt): MarshalledBigIntObject {
  return { $: 'bigint-object', value: bigintObject.toString() }
}

function toMarshalledBooleanObject(booleanObject: Boolean): MarshalledBooleanObject {
  return { $: 'boolean-object', value: booleanObject.valueOf() }
}

function toMarshalledSymbolObject(symbolObject: Symbol): MarshalledSymbolObject {
  return { $: 'symbol-object', desc: symbolObject.description }
}

function toMarshalledError(error: Error, context: InnerContext): MarshalledError {
  return {
    $: 'error',
    props: getMarshalledProperties(error, context),
    proto: getMarshalledProto(error, context),
    stack: getErrorStackUnsafe(error, context.metadata) ?? undefined,
  }
}

function toMarshalledElement(element: Element): MarshalledElement {
  return {
    $: 'element',
    objectTag: getObjectStringTag(element),
    ...(element.namespaceURI !== 'http://www.w3.org/1999/xhtml' && {
      namespaceURI: element.namespaceURI,
    }),
    tagName: element.tagName,
    attributes: Array.from(element.attributes).map((attr) => ({
      name: attr.name,
      value: attr.value,
    })),
  }
}

function toMarshalledNode(node: Node): MarshalledNode {
  return {
    $: 'node',
    objectTag: getObjectStringTag(node),
    nodeName: node.nodeName,
    nodeType: node.nodeType,
    nodeValue: node.nodeValue,
  }
}

function toMarshalledPromise(promise: Promise<unknown>, context: InnerContext): MarshalledPromise {
  const metadata = context.metadata.promises.get(promise)
  if (!metadata) {
    return { $: 'promise' }
  }

  return {
    $: 'promise',
    state: metadata.state,
    result: toMarshalledInner(metadata.result, context),
  }
}

function toMarshalledMap(map: Map<unknown, unknown>, context: InnerContext): MarshalledMap {
  return {
    $: 'map',
    entries: Array.from(map.entries()).map(([key, value]) => [
      toMarshalledInner(key, context),
      toMarshalledInner(value, context),
    ]),
  }
}

function toMarshalledSet(set: Set<unknown>, context: InnerContext): MarshalledSet {
  return {
    $: 'set',
    values: Array.from(set.values()).map((value) => toMarshalledInner(value, context)),
  }
}

function toMarshalledWeakMap(
  weakMap: WeakMap<object, unknown>,
  context: InnerContext,
): MarshalledWeakMap {
  const metadata = context.metadata.weakMaps.get(weakMap)
  if (!metadata) {
    return { $: 'weakmap' }
  }

  return {
    $: 'weakmap',
    entries: Array.from(metadata.entries)
      .map<[MarshalledValue, MarshalledValue] | undefined>(([keyRef, valueRef]) => {
        let key = keyRef
        if (key instanceof context.globals.WeakRef) {
          const target = key.deref()
          if (target === undefined) {
            return undefined
          }

          key = target
        }

        let value = valueRef
        if (value instanceof context.globals.WeakRef) {
          const target = value.deref()
          if (target === undefined) {
            return undefined
          }

          value = target
        }

        return [toMarshalledInner(key, context), toMarshalledInner(value, context)]
      })
      .filter((x) => x !== undefined),
  }
}

function toMarshalledWeakSet(set: WeakSet<WeakKey>, context: InnerContext): MarshalledWeakSet {
  const metadata = context.metadata.weakSets.get(set)
  if (!metadata) {
    return { $: 'weakset' }
  }

  return {
    $: 'weakset',
    values: Array.from(metadata.values)
      .map<MarshalledValue | undefined>((valueRef) => {
        let value = valueRef
        if (value instanceof context.globals.WeakRef) {
          const target = value.deref()
          if (target === undefined) {
            return undefined
          }

          value = target
        }

        return toMarshalledInner(value, context)
      })
      .filter((x) => x !== undefined),
  }
}

function toMarshalledWeakRef(ref: WeakRef<WeakKey>, context: InnerContext): MarshalledWeakRef {
  const value = ref.deref()
  return {
    $: 'weakref',
    target: value !== undefined ? toMarshalledInner(value, context) : undefined,
  }
}

function toMarshalledInner(value: unknown, context: InnerContext): MarshalledValue {
  if (value === null) {
    return value
  }

  switch (typeof value) {
    case 'undefined': {
      return toMarshalledUndefined()
    }

    case 'string': {
      return value
    }

    case 'number': {
      return toMarshalledNumber(value)
    }

    case 'bigint': {
      return toMarshalledBigInt(value)
    }

    case 'boolean': {
      return value
    }

    case 'symbol': {
      return toMarshalledSpecial(value) ?? toMarshalledSymbol(value)
    }

    case 'function': {
      return toMarshalledFunction(value, context)
    }

    case 'object': {
      if (context.refs.has(value)) {
        // Circular reference
        return toMarshalledUnknownObject(value)
      }

      context = {
        ...context,
        refs: new Set(context.refs).add(value),
        depth: context.depth + 1,
      }

      const inspector = new ObjectTypeInspector({ value, context })

      if (inspector.isProxy(value)) {
        if (context.depth > MAX_DEPTH) {
          return toMarshalledUnknownObject(value)
        } else {
          return toMarshalledProxy(value, context)
        }
      }

      if (inspector.isDate(value)) {
        return toMarshalledDate(value)
      }

      if (inspector.isRegExp(value)) {
        return toMarshalledRegExp(value)
      }

      if (inspector.isStringObject(value)) {
        return toMarshalledStringObject(value)
      }

      if (inspector.isNumberObject(value)) {
        return toMarshalledNumberObject(value)
      }

      if (inspector.isBigIntObject(value)) {
        return toMarshalledBigIntObject(value)
      }

      if (inspector.isBooleanObject(value)) {
        return toMarshalledBooleanObject(value)
      }

      if (inspector.isSymbolObject(value)) {
        return toMarshalledSymbolObject(value)
      }

      if (inspector.isError(value)) {
        return toMarshalledError(value, context)
      }

      if (inspector.isElement(value)) {
        return toMarshalledElement(value)
      }

      if (inspector.isNode(value)) {
        return toMarshalledNode(value)
      }

      if (inspector.isPromise(value)) {
        return toMarshalledPromise(value, context)
      }

      if (context.depth > MAX_DEPTH) {
        return toMarshalledUnknownObject(value)
      }

      if (inspector.isMap(value)) {
        return toMarshalledMap(value, context)
      }

      if (inspector.isSet(value)) {
        return toMarshalledSet(value, context)
      }

      if (inspector.isWeakMap(value)) {
        return toMarshalledWeakMap(value, context)
      }

      if (inspector.isWeakSet(value)) {
        return toMarshalledWeakSet(value, context)
      }

      if (inspector.isWeakRef(value)) {
        return toMarshalledWeakRef(value, context)
      }

      if (inspector.isArray(value)) {
        return toMarshalledArray(value, context)
      }

      return toMarshalledObject(value, context)
    }

    default: {
      throw new Error(`Unhandled value type: ${typeof value}`)
    }
  }
}

function getMarshalledProperties(
  object: object,
  context: InnerContext,
): MarshalledPropertyDescriptors {
  const descriptors = Object.getOwnPropertyDescriptors(object) as PropertyDescriptorMap
  const keys = Reflect.ownKeys(descriptors).sort((a, b) => {
    if (a === Symbol.toStringTag) return -1
    if (b === Symbol.toStringTag) return 1
    if (a === 'constructor') return -1
    if (b === 'constructor') return 1
    return 0
  })

  const props: MarshalledPropertyDescriptors = {}

  let count = 0

  for (const key of keys) {
    if (count++ >= MAX_PROPS) {
      break
    }

    const descriptor = descriptors[key]
    const marshalledDescriptor = getMarshalledDescriptor(descriptor, context)

    if (typeof key === 'string') {
      props.names ??= []
      props.names.push([key, marshalledDescriptor])
    } else if (isWellKnownSymbol(key)) {
      if (key.description) {
        props.wellKnownSymbols ??= []
        props.wellKnownSymbols.push([key.description, marshalledDescriptor])
      }
    } else {
      props.symbols ??= []
      props.symbols.push([key.description ?? null, marshalledDescriptor])
    }
  }

  return props
}

function getMarshalledDescriptor(
  descriptor: PropertyDescriptor,
  context: InnerContext,
): MarshalledPropertyDescriptor {
  return {
    ...('value' in descriptor && {
      value: toMarshalledInner(descriptor.value, context),
    }),
    ...(typeof descriptor.get === 'function' && {
      get: toMarshalledFunction(descriptor.get, context),
    }),
    ...(typeof descriptor.set === 'function' && {
      set: toMarshalledFunction(descriptor.set, context),
    }),
    writable: descriptor.writable || undefined,
    enumerable: descriptor.enumerable || undefined,
    configurable: descriptor.configurable || undefined,
  }
}

function getMarshalledProto(object: object, context: InnerContext): MarshalledPrototype {
  const proto = Object.getPrototypeOf(object)

  if (proto !== null) {
    for (const [key, value] of Object.entries(context.globals)) {
      if (value == null) {
        continue
      }

      if (value === proto) {
        return key
      }

      if ('prototype' in value && value.prototype === proto) {
        return `${key}.prototype`
      }
    }
  }

  return toMarshalledInner(proto, context)
}
