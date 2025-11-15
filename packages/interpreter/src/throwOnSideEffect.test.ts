import { describe, expect, test } from 'vitest'
import { ExpectToThrowPossibleSideEffectError, getTestGlobalObject, it } from './test-utils'
import { Metadata } from './lib/Metadata'
import { evaluate, PossibleSideEffectError } from '.'

test('existing function evaluates with right throwOnSideEffect', () => {
  const globalObject = getTestGlobalObject()
  const globalScope = { bindings: new Map() }
  const metadata = new Metadata(globalObject)

  evaluate('function fn() { globalThis.x = 1 }', { globalObject, globalScope, metadata })
  expect(() =>
    evaluate('fn()', { globalObject, globalScope, metadata, throwOnSideEffect: true }),
  ).toThrow(PossibleSideEffectError)
})

describe('Date', () => {
  it('new Date("2025-06-18").getDate()', 18, {
    throwOnSideEffect: true,
  })
  it('var a = new Date("2025-06-18"); a.getDate()', ExpectToThrowPossibleSideEffectError, {
    throwOnSideEffect: true,
  })
  it('let a = new Date("2025-06-18"); a.getDate()', ExpectToThrowPossibleSideEffectError, {
    throwOnSideEffect: true,
  })
  it('{ let a = new Date("2025-06-18"); a.getDate() }', 18, {
    throwOnSideEffect: true,
  })
  it('{ let a = new Date("2025-06-18"); a.setDate(19) }', +new Date('2025-06-19'), {
    throwOnSideEffect: true,
  })
  it('a.setDate(19)', ExpectToThrowPossibleSideEffectError, {
    globalObject: Object.assign(getTestGlobalObject(), { a: new Date('2025-06-18') }),
    throwOnSideEffect: true,
  })
})

describe('Array', () => {
  it('Array.isArray([])', true, {
    throwOnSideEffect: true,
  })
  it('Array.isArray(new Array())', true, {
    throwOnSideEffect: true,
  })
  it('[1,2,3][0]', 1, {
    throwOnSideEffect: true,
  })
  it('[1,2,3].push(4)', 4, {
    throwOnSideEffect: true,
  })
  it('a.push(4)', ExpectToThrowPossibleSideEffectError, {
    globalObject: Object.assign(getTestGlobalObject(), { a: [1, 2, 3] }),
    throwOnSideEffect: true,
  })
  it('[...[1,2,3]]', [1, 2, 3], {
    throwOnSideEffect: true,
  })
})

test('catch block is not executed when PossibleSideEffectError (or any other InternalError) is thrown', () => {
  const globalObject = getTestGlobalObject()
  expect(() =>
    evaluate('try { x = 1 } catch {}', { globalObject, throwOnSideEffect: true }),
  ).toThrow(PossibleSideEffectError)
})

test('finally block is not executed when PossibleSideEffectError (or any other InternalError) is thrown', () => {
  const globalObject = getTestGlobalObject()
  expect(() =>
    evaluate('try { x = 1 } finally { x = 2 }', { globalObject, throwOnSideEffect: true }),
  ).toThrow(PossibleSideEffectError)
  expect(globalObject.x).toBeUndefined()
})

it('({ toString: fn }) in {}', ExpectToThrowPossibleSideEffectError, {
  globalObject: Object.assign(getTestGlobalObject(), { fn: () => {} }),
  throwOnSideEffect: true,
})

it('class A { constructor() { return Number } }', ExpectToThrowPossibleSideEffectError, {
  throwOnSideEffect: true,
})
it('{ class A { constructor() { return Number } } }', undefined, {
  throwOnSideEffect: true,
})
it(
  '{ class A { constructor() { return Number } }; (new A()).a = 1 }',
  ExpectToThrowPossibleSideEffectError,
  {
    throwOnSideEffect: true,
  },
)
