import { TesterContext } from '@vitest/expect'
import util, { inspect } from 'node:util'
import vm from 'node:vm'
import { expect, test } from 'vitest'
import { evaluate, EvaluateResult, InternalError, Metadata } from '.'
import { isProbablyGlobalThis } from './lib/isProbablyGlobalThis'
import { PossibleSideEffectError } from './lib/PossibleSideEffectError'
import { EvaluateOptions, PublicGlobalScope } from './types'

type NotFunction<T> = T extends Function ? never : T
type TestEvaluateResult = EvaluateResult<any> & {
  error?: unknown
  /**
   * Rethrow the error thrown by `evaluate`.
   * noop if `evaluate` didn't throw an error.
   */
  thrown: () => void | never
  globalObject: any
  globalScope: PublicGlobalScope
  metadata: Metadata
}

type TAssert = (result: TestEvaluateResult) => void | Promise<void>

inspect.defaultOptions.showProxy = true

const setGlobalObjectScript = new vm.Script('globalThis = this')

class WrongValueRealmError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WrongRealmError'
  }
}

function areErrorsEqual(this: TesterContext, a: Error, b: Error): boolean {
  return a.name === b.name && a.message === b.message && this.equals(a.cause, b.cause)
}

function customTester(this: TesterContext, a: unknown, b: unknown): boolean | undefined {
  // https://github.com/vitest-dev/vitest/issues/8898
  if (util.types.isNativeError(a) && util.types.isNativeError(b)) {
    return areErrorsEqual.call(this, a, b)
  }

  return undefined
}

expect.addEqualityTesters([customTester])

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
    const globalObject: object = options?.globalObject ?? getTestGlobalObject()
    const globalScope: PublicGlobalScope = options?.globalScope ?? { bindings: new Map() }
    const _globalThis = isProbablyGlobalThis(globalObject) ? globalObject : getTestGlobalObject()
    const metadata: Metadata = options?.metadata ?? new Metadata(_globalThis)
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
        error,
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

    if (result.error instanceof Object) {
      const isAcornParseError = result.error instanceof SyntaxError && 'raisedAt' in result.error
      const isInternalError = result.error instanceof InternalError
      if (!isAcornParseError && !isInternalError) {
        const error = new WrongValueRealmError(
          `It is not expected that the result error instance is of the topmost realm. Original error: ${inspect(result.error)}`,
        )
        error.cause = result.error
        throw error
      }
    }

    if (!result.error && result.value instanceof Object) {
      throw new WrongValueRealmError(
        `It is not expected that the result value instance is of the topmost realm. Result value: ${inspect(result.value)}`,
      )
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

export function getTestGlobalObject(): typeof globalThis & Record<PropertyKey, unknown> {
  const context: any = Object.create(null, {
    setTimeout: { value: setTimeout, configurable: true, enumerable: true, writable: true },
    clearTimeout: { value: clearTimeout, configurable: true, enumerable: true, writable: true },
    setInterval: { value: setInterval, configurable: true, enumerable: true, writable: true },
    clearInterval: { value: clearInterval, configurable: true, enumerable: true, writable: true },
    [Symbol.toStringTag]: { value: 'global' },
    [inspect.custom]: {
      value(this: any) {
        return '[TestGlobalObject]'
      },
    },
  })

  vm.createContext(context)
  setGlobalObjectScript.runInContext(context)
  return context.globalThis
}

export function ExpectToThrowPossibleSideEffectError(x: TestEvaluateResult) {
  expect(x.thrown).toThrow(PossibleSideEffectError)
}
