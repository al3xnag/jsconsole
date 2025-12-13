/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
import { getWellKnownSymbolByDescription } from './well-known-symbols'
import {
  isMarshalled,
  MarshalledArray,
  MarshalledElement,
  MarshalledError,
  MarshalledFunction,
  MarshalledMap,
  MarshalledNode,
  MarshalledNumber,
  MarshalledObject,
  MarshalledPromise,
  MarshalledPropertyDescriptor,
  MarshalledPropertyDescriptors,
  MarshalledPrototype,
  MarshalledProxy,
  MarshalledSet,
  MarshalledSpecial,
  MarshalledUnknownObject,
  MarshalledValue,
  MarshalledWeakMap,
  MarshalledWeakRef,
  MarshalledWeakSet,
} from './marshalled'
import { ValueContext } from './ValueContextContext'
import { SPECIAL_RESULTS } from '@/constants'

export type AnyRevived =
  | Function
  | Array<RevivedValue>
  | object
  | Error
  | Element
  | Node
  | Promise<RevivedValue>
  | Map<RevivedValue, RevivedValue>
  | Set<RevivedValue>
  | WeakMap<WeakKey, RevivedValue>
  | WeakSet<WeakKey>
  | WeakRef<WeakKey>

export type RevivedValue =
  | undefined
  | null
  | number
  | bigint
  | string
  | symbol
  | boolean
  | Date
  | RegExp
  | String
  | Number
  | BigInt
  | Boolean
  | Symbol
  | AnyRevived

const revivedRefs = new WeakMap<object, symbol>()
const REVIVED_DATE = Symbol('RevivedDate')
const REVIVED_REGEXP = Symbol('RevivedRegExp')
const REVIVED_FUNCTION = Symbol('RevivedFunction')
const REVIVED_ARRAY = Symbol('RevivedArray')
const REVIVED_OBJECT = Symbol('RevivedObject')
const REVIVED_UNKNOWN_OBJECT = Symbol('RevivedUnknownObject')
const REVIVED_PROXY = Symbol('RevivedProxy')
const REVIVED_STRING_OBJECT = Symbol('RevivedStringObject')
const REVIVED_NUMBER_OBJECT = Symbol('RevivedNumberObject')
const REVIVED_BIGINT_OBJECT = Symbol('RevivedBigIntObject')
const REVIVED_BOOLEAN_OBJECT = Symbol('RevivedBooleanObject')
const REVIVED_SYMBOL_OBJECT = Symbol('RevivedSymbolObject')
const REVIVED_ERROR = Symbol('RevivedError')
const REVIVED_ELEMENT = Symbol('RevivedElement')
const REVIVED_NODE = Symbol('RevivedNode')
const REVIVED_PROMISE = Symbol('RevivedPromise')
const REVIVED_MAP = Symbol('RevivedMap')
const REVIVED_SET = Symbol('RevivedSet')
const REVIVED_WEAK_MAP = Symbol('RevivedWeakMap')
const REVIVED_WEAK_SET = Symbol('RevivedWeakSet')
const REVIVED_WEAK_REF = Symbol('RevivedWeakRef')

export function toRevived(value: MarshalledValue, context: ValueContext): RevivedValue {
  if (value === null) {
    return value
  }

  switch (typeof value) {
    case 'string': {
      return value
    }

    case 'boolean': {
      return value
    }
  }

  if (!isMarshalled(value)) {
    console.assert(false, 'Marshalled value expected', value)
    return value
  }

  switch (value.$) {
    case 'undefined': {
      return undefined
    }

    case 'number': {
      return toRevivedNumber(value)
    }

    case 'bigint': {
      return BigInt(value.value)
    }

    case 'symbol': {
      return Symbol(value.desc)
    }

    case 'date': {
      const date = new context.globals.Date(value.value !== null ? value.value : NaN)
      revivedRefs.set(date, REVIVED_DATE)
      return date
    }

    case 'regexp': {
      const regexp = new context.globals.RegExp(value.source, value.flags)
      revivedRefs.set(regexp, REVIVED_REGEXP)
      return regexp
    }

    case 'function': {
      return toRevivedFunction(value, context)
    }

    case 'array': {
      return toRevivedArray(value, context)
    }

    case 'object': {
      return toRevivedObject(value, context)
    }

    case 'unknown-object': {
      return toRevivedUnknownObject(value, context)
    }

    case 'proxy': {
      return toRevivedProxy(value, context)
    }

    case 'string-object': {
      const strObj = new context.globals.String(value.value)
      revivedRefs.set(strObj, REVIVED_STRING_OBJECT)
      return strObj
    }

    case 'number-object': {
      const numObj = new context.globals.Number(value.value)
      revivedRefs.set(numObj, REVIVED_NUMBER_OBJECT)
      return numObj
    }

    case 'bigint-object': {
      const bigintObj = context.globals.Object(BigInt(value.value))
      revivedRefs.set(bigintObj, REVIVED_BIGINT_OBJECT)
      return bigintObj
    }

    case 'boolean-object': {
      const boolObj = new context.globals.Boolean(value.value)
      revivedRefs.set(boolObj, REVIVED_BOOLEAN_OBJECT)
      return boolObj
    }

    case 'symbol-object': {
      const symbolObj = context.globals.Object(Symbol(value.desc))
      revivedRefs.set(symbolObj, REVIVED_SYMBOL_OBJECT)
      return symbolObj
    }

    case 'error': {
      return toRevivedError(value, context)
    }

    case 'element': {
      return toRevivedElement(value)
    }

    case 'node': {
      try {
        return toRevivedNode(value)
      } catch {
        return toRevivedUnknownObject(
          {
            $: 'unknown-object',
            tag: value.objectTag,
          },
          context,
        )
      }
    }

    case 'promise': {
      return toRevivedPromise(value, context)
    }

    case 'map': {
      return toRevivedMap(value, context)
    }

    case 'set': {
      return toRevivedSet(value, context)
    }

    case 'weakmap': {
      return toRevivedWeakMap(value, context)
    }

    case 'weakset': {
      return toRevivedWeakSet(value, context)
    }

    case 'weakref': {
      return toRevivedWeakRef(value, context)
    }

    case 'special': {
      return toRevivedSpecial(value)
    }

    default: {
      console.assert(false, 'Unexpected marshalled value', value)
      return value
    }
  }
}

function toRevivedNumber({ value }: MarshalledNumber): number {
  switch (value) {
    case 'NaN': {
      return Number.NaN
    }

    case 'Infinity': {
      return Infinity
    }

    case '-Infinity': {
      return -Infinity
    }

    case '-0': {
      return -0
    }

    default: {
      return value
    }
  }
}

export function isRevived(value: unknown): value is AnyRevived {
  return revivedRefs.has(value as object)
}

interface RevivedUnknownObject {
  [key: string]: never
}

export function isRevivedUnknownObject(value: unknown): value is RevivedUnknownObject {
  return revivedRefs.get(value as object) === REVIVED_UNKNOWN_OBJECT
}

function toRevivedFunction(
  {
    str,
    name,
    length,
    arrow,
    async,
    generator,
    bound,
    boundThis,
    boundArgs,
    targetFunction,
  }: MarshalledFunction,
  context: ValueContext,
): Function {
  let fn: Function
  if (arrow) {
    fn = async
      ? async () => {
          throw 'Function unavailable'
        }
      : () => {
          throw 'Function unavailable'
        }
  } else if (generator) {
    fn = async
      ? // eslint-disable-next-line require-yield
        async function* () {
          throw 'Function unavailable'
        }
      : // eslint-disable-next-line require-yield
        function* () {
          throw 'Function unavailable'
        }
  } else {
    fn = async
      ? async function () {
          throw 'Function unavailable'
        }
      : function () {
          throw 'Function unavailable'
        }
  }

  Object.defineProperties(fn, {
    name: { value: name },
    length: { value: length },
  })

  if (Function.prototype !== context.globals.Function.prototype) {
    let prototype: Function

    if (generator) {
      prototype = async
        ? context.globals.AsyncGeneratorFunction.prototype
        : context.globals.GeneratorFunction.prototype
    } else {
      prototype = async
        ? context.globals.AsyncFunction.prototype
        : context.globals.Function.prototype
    }

    Object.setPrototypeOf(fn, prototype)
  }

  context.metadata.functions.set(fn, {
    sourceCode: str,
    arrow,
    async,
    generator,
    bound,
    boundThis: boundThis !== undefined ? toRevived(boundThis, context) : undefined,
    boundArgs:
      boundArgs !== undefined ? boundArgs.map((arg) => toRevived(arg, context)) : undefined,
    targetFunction:
      targetFunction !== undefined ? toRevivedFunction(targetFunction, context) : undefined,
  })
  revivedRefs.set(fn, REVIVED_FUNCTION)
  return fn
}

function toRevivedArray(
  { props: marshalledProps, proto: marshalledProto }: MarshalledArray,
  context: ValueContext,
): Array<RevivedValue> {
  const arr: Array<RevivedValue> = context.globals.Array()
  revivedRefs.set(arr, REVIVED_ARRAY)

  const proto = getRevivedProto(marshalledProto, context)
  const props = getRevivedProperties(marshalledProps, context)

  if (proto !== context.globals.Array.prototype) {
    Object.setPrototypeOf(arr, proto)
  }

  Object.defineProperties(arr, props)

  return arr
}

function toRevivedObject(
  { props: marshalledProps, proto: marshalledProto }: MarshalledObject,
  context: ValueContext,
): object {
  const proto = getRevivedProto(marshalledProto, context)
  const props = getRevivedProperties(marshalledProps, context)

  const obj = context.globals.Object.create(proto, props)
  revivedRefs.set(obj, REVIVED_OBJECT)
  return obj
}

function toRevivedUnknownObject({ tag }: MarshalledUnknownObject, context: ValueContext): object {
  const props: PropertyDescriptorMap = {}

  if (tag !== null) {
    props[Symbol.toStringTag] = { value: tag }
  }

  const obj = context.globals.Object.create(null, props)
  revivedRefs.set(obj, REVIVED_UNKNOWN_OBJECT)
  return obj
}

function toRevivedProxy({ target, handler }: MarshalledProxy, context: ValueContext): object {
  const obj = context.globals.Object()
  revivedRefs.set(obj, REVIVED_PROXY)

  let revivedTarget = toRevived(target, context)
  if (
    revivedTarget === null ||
    (typeof revivedTarget !== 'object' && typeof revivedTarget !== 'function')
  ) {
    console.assert(false, 'Invalid RevivedProxy target', revivedTarget)
    revivedTarget = toRevivedUnknownObject({ $: 'unknown-object', tag: null }, context)
  }

  let revivedHandler = toRevived(handler, context)
  if (
    revivedHandler === null ||
    (typeof revivedHandler !== 'object' && typeof revivedHandler !== 'function')
  ) {
    console.assert(false, 'Invalid RevivedProxy handler', revivedTarget)
    revivedHandler = toRevivedUnknownObject({ $: 'unknown-object', tag: null }, context)
  }

  context.metadata.proxies.set(obj, {
    target: revivedTarget,
    handler: revivedHandler as ProxyHandler<object>,
  })

  return obj
}

function toRevivedError(
  { props: marshalledProps, proto: marshalledProto, stack }: MarshalledError,
  context: ValueContext,
): Error {
  const err = new context.globals.Error()
  revivedRefs.set(err, REVIVED_ERROR)

  const proto = getRevivedProto(marshalledProto, context)
  const props = getRevivedProperties(marshalledProps, context)

  if (stack != null) {
    err.stack = stack
    delete props.stack
  }

  if (proto !== context.globals.Error.prototype) {
    Object.setPrototypeOf(err, proto)
  }

  Object.defineProperties(err, props)

  return err
}

function toRevivedElement({
  /* objectTag, */
  namespaceURI,
  tagName,
  attributes,
}: MarshalledElement): Element {
  // TODO: custom elements? 2nd/3rd param: `ElementCreationOptions.is`.
  const el =
    namespaceURI === undefined
      ? document.createElement(tagName)
      : document.createElementNS(namespaceURI, tagName)

  revivedRefs.set(el, REVIVED_ELEMENT)

  attributes.forEach((attr) => {
    el.setAttribute(attr.name, attr.value)
  })

  return el
}

function toRevivedNode({ /* objectTag, */ nodeType, nodeName, nodeValue }: MarshalledNode): Node {
  let node: Node

  switch (nodeType) {
    case Node.ATTRIBUTE_NODE: {
      node = document.createAttribute(nodeName)
      node.nodeValue = nodeValue
      break
    }

    case Node.TEXT_NODE: {
      node = document.createTextNode(nodeValue ?? '')
      break
    }

    case Node.COMMENT_NODE: {
      node = document.createComment(nodeValue ?? '')
      break
    }

    case Node.DOCUMENT_NODE: {
      node = document.implementation.createHTMLDocument()
      break
    }

    case Node.DOCUMENT_TYPE_NODE: {
      node = document.implementation.createDocumentType(nodeName, '', '')
      break
    }

    case Node.DOCUMENT_FRAGMENT_NODE: {
      node = document.createDocumentFragment()
      break
    }

    default: {
      throw new Error('Unsupported node type')
    }
  }

  revivedRefs.set(node, REVIVED_NODE)

  return node
}

function toRevivedPromise(
  { state, result }: MarshalledPromise,
  context: ValueContext,
): Promise<RevivedValue> {
  let promise: Promise<RevivedValue>
  const revivedResult = result !== undefined ? toRevived(result, context) : undefined

  switch (state) {
    case undefined: {
      promise = new context.globals.Promise(() => {})
      revivedRefs.set(promise, REVIVED_PROMISE)
      return promise // Skip metadata.
    }

    case 'pending': {
      promise = new context.globals.Promise(() => {})
      break
    }

    case 'fulfilled': {
      promise = new context.globals.Promise((resolve) => {
        resolve(revivedResult)
      })
      break
    }

    case 'rejected': {
      promise = new context.globals.Promise((_, reject) => {
        reject(revivedResult)
      })
      break
    }

    default: {
      console.assert(false, 'Unsupported promise state', state)
      promise = new context.globals.Promise(() => {})
      break
    }
  }

  revivedRefs.set(promise, REVIVED_PROMISE)

  context.metadata.promises.set(promise, {
    state,
    result: revivedResult,
  })

  return promise
}

function toRevivedMap(
  { entries }: MarshalledMap,
  context: ValueContext,
): Map<RevivedValue, RevivedValue> {
  const revivedEntries = entries.map<[RevivedValue, RevivedValue]>(([key, value]) => [
    toRevived(key, context),
    toRevived(value, context),
  ])

  const map = new context.globals.Map(revivedEntries)
  revivedRefs.set(map, REVIVED_MAP)

  return map
}

function toRevivedSet({ values }: MarshalledSet, context: ValueContext): Set<RevivedValue> {
  const revivedValues = values.map((value) => toRevived(value, context))
  const set = new context.globals.Set(revivedValues)
  revivedRefs.set(set, REVIVED_SET)
  return set
}

function toRevivedWeakMap(
  { entries }: MarshalledWeakMap,
  context: ValueContext,
): WeakMap<WeakKey, RevivedValue> {
  if (entries === undefined) {
    const weakmap = new context.globals.WeakMap()
    revivedRefs.set(weakmap, REVIVED_WEAK_MAP)
    return weakmap
  }

  const revivedEntries = entries.map<[WeakKey, RevivedValue]>(([key, value]) => [
    toRevived(key, context) as WeakKey,
    toRevived(value, context),
  ])

  const weakmap = new context.globals.WeakMap(revivedEntries)
  revivedRefs.set(weakmap, REVIVED_WEAK_MAP)

  context.metadata.weakMaps.set(weakmap, {
    entries: new Map(revivedEntries),
  })

  return weakmap
}

function toRevivedWeakSet({ values }: MarshalledWeakSet, context: ValueContext): WeakSet<WeakKey> {
  if (values === undefined) {
    const weakset = new context.globals.WeakSet()
    revivedRefs.set(weakset, REVIVED_WEAK_SET)
    return weakset
  }

  const revivedValues = values.map((value) => toRevived(value, context) as WeakKey)
  const weakset = new context.globals.WeakSet(revivedValues)
  revivedRefs.set(weakset, REVIVED_WEAK_SET)

  context.metadata.weakSets.set(weakset, {
    values: new Set(revivedValues),
  })

  return weakset
}

function toRevivedWeakRef({ target }: MarshalledWeakRef, context: ValueContext): WeakRef<WeakKey> {
  const revivedTarget =
    target !== undefined
      ? (toRevived(target, context) as WeakKey)
      : toRevivedUnknownObject({ $: 'unknown-object', tag: null }, context)
  const weakref = new WeakRef(revivedTarget)
  revivedRefs.set(weakref, REVIVED_WEAK_REF)
  return weakref
}

function toRevivedSpecial({ value }: MarshalledSpecial): symbol | null {
  switch (value) {
    case 'HIDDEN':
      return SPECIAL_RESULTS.HIDDEN
    case 'HELP':
      return SPECIAL_RESULTS.HELP
    default:
      return null
  }
}

function getRevivedProperties(
  props: MarshalledPropertyDescriptors,
  context: ValueContext,
): PropertyDescriptorMap {
  const descriptors: PropertyDescriptorMap = {}

  for (const [key, prop] of props.names ?? []) {
    descriptors[key] = getRevivedProperty(prop, context)
  }

  for (const [desc, prop] of props.symbols ?? []) {
    descriptors[Symbol(desc ?? undefined)] = getRevivedProperty(prop, context)
  }

  for (const [desc, prop] of props.wellKnownSymbols ?? []) {
    const symbol = getWellKnownSymbolByDescription(desc)
    if (symbol) {
      descriptors[symbol] = getRevivedProperty(prop, context)
    } else {
      console.assert(false, 'Invalid well-known symbol', desc)
    }
  }

  return descriptors
}

function getRevivedProperty(
  prop: MarshalledPropertyDescriptor,
  context: ValueContext,
): PropertyDescriptor {
  return prop.value !== undefined
    ? {
        value: toRevived(prop.value, context),
        writable: prop.writable,
        enumerable: prop.enumerable,
        configurable: prop.configurable,
      }
    : {
        get:
          prop.get !== undefined
            ? (toRevivedFunction(prop.get, context) as unknown as () => unknown)
            : undefined,
        set:
          prop.set !== undefined
            ? (toRevivedFunction(prop.set, context) as unknown as (v: unknown) => void)
            : undefined,
        enumerable: prop.enumerable,
        configurable: prop.configurable,
      }
}

function getRevivedProto(marshalled: MarshalledPrototype, context: ValueContext): object | null {
  const proto = toRevived(marshalled, context)

  if (typeof proto === 'string') {
    const isPrototypeProp = proto.endsWith('.prototype')
    const globalObjName = isPrototypeProp ? proto.slice(0, -'.prototype'.length) : proto
    const globalObj = context.globals[globalObjName]
    if (!globalObj) {
      console.assert(false, `${globalObjName} is expected to be present in context.globals`)
      return null
    }

    if (isPrototypeProp) {
      if ('prototype' in globalObj && typeof globalObj.prototype === 'object') {
        return globalObj.prototype
      } else {
        console.assert(false, `${globalObjName} is expected to have a prototype property`)
        return null
      }
    } else {
      return globalObj
    }
  }

  // typeof null === 'object' is taken into account here.
  if (typeof proto !== 'object' && typeof proto !== 'function') {
    console.assert(false, 'Invalid RevivedObject prototype', proto)
    return null
  }

  return proto
}
