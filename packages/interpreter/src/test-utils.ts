import { inspect, InspectOptions } from 'node:util'
import { GlobalWindow } from 'happy-dom'
import { expect, test } from 'vitest'
import { evaluate, EvaluateResult, Metadata } from '.'
import { PossibleSideEffectError } from './lib/PossibleSideEffectError'
import { EvaluateOptions, PublicGlobalScope } from './types'

inspect.defaultOptions.showProxy = true
setCustomInspect(Object.getPrototypeOf(globalThis), Object2String)

type NotFunction<T> = T extends Function ? never : T
type TestEvaluateResult = EvaluateResult<any> & {
  /**
   * Rethrow the error thrown by `evaluate`.
   * noop if `evaluate` didn't throw an error.
   */
  thrown: () => void | never
  globalObject: object
  globalScope: PublicGlobalScope
  metadata: Metadata
}
type TAssert = (result: TestEvaluateResult) => void | Promise<void>

/**
 * Test `evaluate`.
 *
 * @example
 * it('a = 1', 1)
 * it('a = 1', ({ value }) => expect(value).toBe(1))
 * it('a = 1', ({ value }) => {
 *   expect(value).toBe(1)
 *   expect(value).not.toBe(2)
 * })
 * it('a = 1', (x) => {
 *   expect(() => x.value).toThrow(new ReferenceError('a is not defined'))
 * })
 * it('a = 1', ({ thrown }) => {
 *   expect(thrown).toThrow(new ReferenceError('a is not defined'))
 * })
 * it('a', 1, { globalObject: { a: 1 } })
 * it.skip('a = 1', 1)
 * it.todo('a = 1', 1)
 * it.fails('a = 1', 1)
 * it.debug('a = 1', 1)
 */
export function it<T>(
  this: any,
  code: string,
  assert: TAssert | NotFunction<T>,
  options?: EvaluateOptions,
  testName?: string,
) {
  const defaultTestName = () => {
    let name = `${code}`

    if (options !== undefined) {
      name += ` (${inspect(options)})`
    }

    return name
  }

  const testFn = this?.testFn ?? test
  testFn(testName ?? defaultTestName(), async () => {
    let result: TestEvaluateResult
    const globalObject: object = options?.globalObject ?? getBasicGlobalObject()
    const globalScope: PublicGlobalScope = options?.globalScope ?? { bindings: new Map() }
    const metadata: Metadata = options?.metadata ?? new Metadata(globalObject)
    const debug = this?.debug ?? options?.debug
    try {
      const evalResult = await evaluate(code, {
        ...options,
        globalObject,
        globalScope,
        metadata,
        debug,
      })

      result = Object.assign(evalResult, {
        thrown() {},
        globalObject,
        globalScope,
        metadata,
      })
    } catch (error) {
      result = {
        get value() {
          throw error
        },
        thrown() {
          throw error
        },
        globalObject,
        globalScope,
        metadata,
      }
    }

    if (typeof assert === 'function') {
      await (assert as TAssert)(result)
    } else {
      result.thrown()
      const value = result.value
      if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
        expect(value).toEqual(assert)
      } else {
        expect(value).toBe(assert)
      }
    }
  })
}

it.skip = it.bind({ testFn: test.skip }) as typeof it
it.todo = it.bind({ testFn: test.todo }) as typeof it
it.fails = it.bind({ testFn: test.fails }) as typeof it
it.debug = it.bind({ debug: console.debug }) as typeof it

export function ExpectToThrowPossibleSideEffectError(x: TestEvaluateResult) {
  expect(x.thrown).toThrow(PossibleSideEffectError)
}

export class TestWindow extends GlobalWindow {
  constructor(...args: ConstructorParameters<typeof GlobalWindow>) {
    super(...args)

    setCustomInspect(Object.getPrototypeOf(this), Object2String)
    setCustomInspect(Object.getPrototypeOf(this.document), Object2String)
    setCustomInspect(this.HTMLElement.prototype, Object2String)
  }

  get [Symbol.toStringTag]() {
    return 'TestWindow'
  }
}

function setCustomInspect(
  target: any,
  fn: (this: any, depth: number, inspectOptions: InspectOptions, inspect_: typeof inspect) => any,
) {
  target[inspect.custom] = fn
}

function Object2String(this: any) {
  return Object.prototype.toString.call(this)
}

const basicGlobalObjectProperties = getBasicGlobalObjectProperties()

export function getBasicGlobalObject(): object {
  const obj = {
    get [Symbol.toStringTag]() {
      return 'BasicGlobalObject'
    },
    [inspect.custom]: Object2String,
  }

  Object.defineProperties(obj, basicGlobalObjectProperties)
  Object.defineProperties(obj, {
    globalThis: {
      value: obj,
      configurable: true,
      enumerable: false,
      writable: true,
    },
    window: {
      get: () => obj,
      configurable: false,
      enumerable: true,
    },
  })

  return obj
}

function getBasicGlobalObjectProperties() {
  const p = (key: PropertyKey): PropertyDescriptor => {
    const desc = Object.getOwnPropertyDescriptor(globalThis, key)
    if (!desc) {
      throw new Error(`globalThis['${String(key)}'] is expected to be defined in tests`)
    }
    return desc
  }

  const props: PropertyDescriptorMap = {
    undefined: p('undefined'),
    Infinity: p('Infinity'),
    NaN: p('NaN'),
    isNaN: p('isNaN'),
    isFinite: p('isFinite'),
    parseFloat: p('parseFloat'),
    parseInt: p('parseInt'),
    String: p('String'),
    Number: p('Number'),
    Boolean: p('Boolean'),
    BigInt: p('BigInt'),
    Symbol: p('Symbol'),
    RegExp: p('RegExp'),
    Date: p('Date'),
    Array: p('Array'),
    Object: p('Object'),
    Function: p('Function'),
    Promise: p('Promise'),
    Map: p('Map'),
    Set: p('Set'),
    WeakMap: p('WeakMap'),
    WeakSet: p('WeakSet'),
    WeakRef: p('WeakRef'),
    Proxy: p('Proxy'),
    Error: p('Error'),
    TypeError: p('TypeError'),
    SyntaxError: p('SyntaxError'),
    DOMException: p('DOMException'),
    RangeError: p('RangeError'),
    ReferenceError: p('ReferenceError'),
    EvalError: p('EvalError'),
    JSON: p('JSON'),
    Math: p('Math'),
    URL: p('URL'),
    console: p('console'),
    setTimeout: p('setTimeout'),
    clearTimeout: p('clearTimeout'),
    setInterval: p('setInterval'),
    clearInterval: p('clearInterval'),
    Reflect: p('Reflect'),
    eval: p('eval'),
  } satisfies Partial<Record<Exclude<keyof typeof globalThis, 'toString'>, PropertyDescriptor>>

  return props
}
