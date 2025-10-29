// @vitest-environment happy-dom

import { describe, expect, test } from 'vitest'
import {
  ExpectToThrowPossibleSideEffectError,
  getBasicGlobalObject,
  it,
  TestWindow,
} from './test-utils'
import { Metadata } from './lib/Metadata'
import { evaluate, PossibleSideEffectError } from '.'

const sharedTestWindow = new TestWindow()

test('existing function evaluates with right throwOnSideEffect', () => {
  const globalObject = new TestWindow()
  const globalScope = { bindings: new Map() }
  const metadata = new Metadata(globalThis)

  evaluate('function fn() { window.x = 1 }', { globalObject, globalScope, metadata })
  expect(() =>
    evaluate('fn()', { globalObject, globalScope, metadata, throwOnSideEffect: true }),
  ).toThrow(PossibleSideEffectError)
})

describe('DOM', () => {
  it('document.body', document.body, { globalObject: sharedTestWindow, throwOnSideEffect: true })
  it('document.querySelector("body")', document.body, {
    globalObject: sharedTestWindow,
    throwOnSideEffect: true,
  })
  it('location.reload()', ExpectToThrowPossibleSideEffectError, {
    globalObject: new TestWindow(),
    throwOnSideEffect: true,
  })
  it('document.body.remove()', ExpectToThrowPossibleSideEffectError, {
    globalObject: new TestWindow(),
    throwOnSideEffect: true,
  })
})

describe('Date', () => {
  it('new Date("2025-06-18").getDate()', 18, {
    globalObject: sharedTestWindow,
    throwOnSideEffect: true,
  })
  it('var a = new Date("2025-06-18"); a.getDate()', ExpectToThrowPossibleSideEffectError, {
    globalObject: sharedTestWindow,
    throwOnSideEffect: true,
  })
  it('let a = new Date("2025-06-18"); a.getDate()', ExpectToThrowPossibleSideEffectError, {
    globalObject: sharedTestWindow,
    throwOnSideEffect: true,
  })
  it('{ let a = new Date("2025-06-18"); a.getDate() }', 18, {
    globalObject: sharedTestWindow,
    throwOnSideEffect: true,
  })
  it('{ let a = new Date("2025-06-18"); a.setDate(19) }', +new Date('2025-06-19'), {
    globalObject: sharedTestWindow,
    throwOnSideEffect: true,
  })
  it('a.setDate(19)', ExpectToThrowPossibleSideEffectError, {
    globalObject: Object.assign(getBasicGlobalObject(), { a: new Date('2025-06-18') }),
    throwOnSideEffect: true,
  })
})

describe('Array', () => {
  it('Array.isArray([])', true, {
    globalObject: sharedTestWindow,
    throwOnSideEffect: true,
  })
  it('Array.isArray(new Array())', true, {
    globalObject: sharedTestWindow,
    throwOnSideEffect: true,
  })
  it('[1,2,3][0]', 1, {
    globalObject: sharedTestWindow,
    throwOnSideEffect: true,
  })
  it('[1,2,3].push(4)', 4, {
    globalObject: sharedTestWindow,
    throwOnSideEffect: true,
  })
  it('a.push(4)', ExpectToThrowPossibleSideEffectError, {
    globalObject: Object.assign(getBasicGlobalObject(), { a: [1, 2, 3] }),
    throwOnSideEffect: true,
  })
  it('[...[1,2,3]]', [1, 2, 3], {
    globalObject: sharedTestWindow,
    throwOnSideEffect: true,
  })
})
