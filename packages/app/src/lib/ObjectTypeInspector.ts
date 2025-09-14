/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */

import { Metadata } from '@jsconsole/interpreter'
import { ValueContext } from './ValueContextContext'
import { AsyncFunction, Globals } from '@/types'

// https://github.com/ChromeDevTools/devtools-frontend/blob/b3a0ca161c3ba054d40b29547204d48e1262df9f/front_end/panels/console/ConsoleViewMessage.ts#L773
// https://github.com/inspect-js/object-inspect/blob/main/index.js
export type ObjectType =
  | 'proxy'
  | 'string-object'
  | 'number-object'
  | 'bigint-object'
  | 'boolean-object'
  | 'symbol-object'
  | 'date'
  | 'regexp'
  | 'array'
  | 'error'
  | 'element'
  | 'node'
  | 'promise'
  | 'map'
  | 'set'
  | 'weakmap'
  | 'weakset'
  | 'weakref'
  | 'other'

export class ObjectTypeInspector {
  #globals: Globals
  #metadata: Metadata
  #canTrustToString: boolean
  #isForeignObject: boolean | undefined

  constructor({ value, context }: { value: object; context: ValueContext }) {
    this.#globals = context.globals
    this.#metadata = context.metadata
    this.#canTrustToString = canTrustToString(value)
    this.#isForeignObject =
      Object.getPrototypeOf(value) === null ? undefined : !(value instanceof this.#globals.Object)
  }

  isProxy(value: object) {
    return this.#metadata.proxies.has(value)
  }

  isSyncBasicFunction(value: object): value is Function {
    return (
      typeof value === 'function' &&
      !(value instanceof this.#globals.AsyncFunction) &&
      !(value instanceof this.#globals.GeneratorFunction) &&
      !(value instanceof this.#globals.AsyncGeneratorFunction)
    )
  }

  isAsyncBasicFunction(value: object): value is AsyncFunction {
    return typeof value === 'function' && value instanceof this.#globals.AsyncFunction
  }

  isSyncGeneratorFunction(value: object): value is GeneratorFunction {
    return typeof value === 'function' && value instanceof this.#globals.GeneratorFunction
  }

  isAsyncGeneratorFunction(value: object): value is AsyncGeneratorFunction {
    return typeof value === 'function' && value instanceof this.#globals.AsyncGeneratorFunction
  }

  // new String('')
  isStringObject(value: object): value is String {
    if (value instanceof this.#globals.String) {
      return true
    }

    if (this.#isForeignObject && this.#toStr(value) === '[object String]') {
      return true
    }

    return false
  }

  // new Number(123)
  isNumberObject(value: object): value is Number {
    if (value instanceof this.#globals.Number) {
      return true
    }

    if (this.#isForeignObject && this.#toStr(value) === '[object Number]') {
      return true
    }

    return false
  }

  // Object(123n) - BigInt class instance
  isBigIntObject(value: object): value is BigInt {
    if (value instanceof this.#globals.BigInt) {
      return true
    }

    // BigInt has Symbol.toStringTag by spec, so we can't use `this.#toStr(value) === '[object BigInt]'` technique.
    if (this.#isForeignObject && value.constructor.name === 'BigInt') {
      try {
        bigIntValueOf.call(value)
        return true
      } catch {
        return false
      }
    }

    return false
  }

  // new Boolean(true)
  isBooleanObject(value: object): value is Boolean {
    if (value instanceof this.#globals.Boolean) {
      return true
    }

    if (this.#isForeignObject && this.#toStr(value) === '[object Boolean]') {
      return true
    }

    return false
  }

  // Object(Symbol()) - Symbol class instance
  isSymbolObject(value: object): value is Symbol {
    if (value instanceof this.#globals.Symbol) {
      return true
    }

    // Symbol has Symbol.toStringTag by spec, so we can't use `this.#toStr(value) === '[object Symbol]'` technique.
    if (this.#isForeignObject && value.constructor.name === 'Symbol') {
      try {
        symbolValueOf.call(value)
        return true
      } catch {
        return false
      }
    }

    return false
  }

  isDate(value: object): value is Date {
    if (value instanceof this.#globals.Date) {
      return true
    }

    if (this.#isForeignObject && this.#toStr(value) === '[object Date]') {
      return true
    }

    return false
  }

  isRegExp(value: object): value is RegExp {
    if (value instanceof this.#globals.RegExp) {
      return true
    }

    if (this.#isForeignObject && this.#toStr(value) === '[object RegExp]') {
      return true
    }

    return false
  }

  isArray(value: object): value is unknown[] {
    return Array.isArray(value)
  }

  isError(value: object): value is Error {
    if ('isError' in Error && typeof Error.isError === 'function') {
      return Error.isError(value)
    }

    if (value instanceof this.#globals.Error) {
      return true
    }

    if (value instanceof this.#globals.DOMException) {
      return true
    }

    if (this.#isForeignObject) {
      const str = this.#toStr(value)
      if (str === '[object Error]' || str === '[object DOMException]') {
        return true
      }
    }

    return false
  }

  isElement(value: object): value is Element {
    if (value instanceof this.#globals.Element) {
      return true
    }

    if (
      this.#isForeignObject &&
      'ELEMENT_NODE' in value &&
      value.ELEMENT_NODE === Node.ELEMENT_NODE &&
      'nodeName' in value &&
      'nodeType' in value
    ) {
      return true
    }

    return false
  }

  isNode(value: object): value is Node {
    if (value instanceof this.#globals.Node) {
      return true
    }

    if (
      this.#isForeignObject &&
      'ELEMENT_NODE' in value &&
      'nodeName' in value &&
      'nodeType' in value
    ) {
      return true
    }

    return false
  }

  isPromise(value: object): value is Promise<unknown> {
    if (value instanceof this.#globals.Promise) {
      return true
    }

    if (
      this.#isForeignObject &&
      'then' in value &&
      typeof value.then === 'function' &&
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(value), Symbol.toStringTag)?.value ===
        'Promise'
    ) {
      return true
    }

    return false
  }

  isMap(value: object): value is Map<unknown, unknown> {
    if (value instanceof this.#globals.Map) {
      return true
    }

    if (this.#isForeignObject && value.constructor.name === 'Map') {
      try {
        mapSizeGetter!.call(value)
        try {
          setSizeGetter!.call(value)
        } catch {
          return true
        }
      } catch {
        return false
      }
    }

    return false
  }

  isSet(value: object): value is Set<unknown> {
    if (value instanceof this.#globals.Set) {
      return true
    }

    if (this.#isForeignObject && value.constructor.name === 'Set') {
      try {
        setSizeGetter!.call(value)
        try {
          mapSizeGetter!.call(value)
        } catch {
          return true
        }
      } catch {
        return false
      }
    }

    return false
  }

  isWeakMap(value: object): value is WeakMap<WeakKey, unknown> {
    if (value instanceof this.#globals.WeakMap) {
      return true
    }

    if (this.#isForeignObject && value.constructor.name === 'WeakMap') {
      try {
        weakMapHas.call(value, weakMapHas)
        try {
          weakSetHas.call(value, weakSetHas)
        } catch {
          return true
        }
      } catch {
        return false
      }
    }

    return false
  }

  isWeakSet(value: object): value is WeakSet<WeakKey> {
    if (value instanceof this.#globals.WeakSet) {
      return true
    }

    if (this.#isForeignObject && value.constructor.name === 'WeakSet') {
      try {
        weakSetHas.call(value, weakSetHas)
        try {
          weakMapHas.call(value, weakMapHas)
        } catch {
          return true
        }
      } catch {
        return false
      }
    }

    return false
  }

  isWeakRef(value: object): value is WeakRef<WeakKey> {
    if (value instanceof this.#globals.WeakRef) {
      return true
    }

    if (this.#isForeignObject && value.constructor.name === 'WeakRef') {
      try {
        weakRefDeref.call(value)
        return true
      } catch {
        return false
      }
    }

    return false
  }

  #toStr(value: object): string | undefined {
    return this.#canTrustToString ? objectToString.call(value) : undefined
  }
}

const objectToString = Object.prototype.toString
const symbolValueOf = Symbol.prototype.valueOf
const bigIntValueOf = BigInt.prototype.valueOf
const toStringTag = Symbol.toStringTag

const mapSizeGetter = Object.getOwnPropertyDescriptor(Map.prototype, 'size')!.get
const setSizeGetter = Object.getOwnPropertyDescriptor(Set.prototype, 'size')!.get

const weakMapHas = WeakMap.prototype.has
const weakSetHas = WeakSet.prototype.has
const weakRefDeref = WeakRef.prototype.deref

function canTrustToString(obj: object) {
  return !(toStringTag in obj)
}
