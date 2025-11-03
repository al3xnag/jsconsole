import { expect, test } from 'vitest'
import { getTestGlobalObject, it } from './test-utils'
import { toShortStringTag } from './lib/toShortStringTag'

it('globalThis != null', true)
it('globalThis === this', true)
it('globalThis.globalThis === globalThis', true)
it('Object.isFrozen(globalThis)', false)
it('Object.isSealed(globalThis)', false)
it('Object.isExtensible(globalThis)', true)
it('Object.prototype.x = 1', ({ value, globalObject }) => {
  expect(value).toBe(1)
  expect(globalObject.Object.prototype.x).toBe(1)
  expect('x' in Object.prototype).toBe(false)
})
it('Object.getOwnPropertyDescriptor(globalThis, "isNaN")', ({ value, globalObject }) => {
  expect(value).toEqual({
    configurable: true,
    enumerable: false,
    value: globalObject.isNaN,
    writable: true,
  })
})
it('throw new TypeError("message")', ({ thrown, globalObject }) => {
  expect(thrown).toThrow(new TypeError('message'))
  expect(thrown).not.toThrow(new TypeError('another message'))
  expect(thrown).not.toThrow(new ReferenceError('oops'))
  expect(thrown).not.toThrow(new EvalError('no way'))

  expect(thrown).toThrow(globalObject.TypeError)
  expect(thrown).not.toThrow(TypeError)
})
it('new Set([1, 2])', ({ value, globalObject }) => {
  expect(value).toEqual(new globalObject.Set([1, 2]))
  expect(value).not.toEqual(new globalObject.Set([1, 2, 3]))
  expect(value).not.toEqual(new Set([1, 2]))
})
it('({ a: 1 })', ({ value, globalObject }) => {
  expect(value).toEqual({ a: 1 })
  expect(value).toEqual(Object.create(Object.prototype, { a: { value: 1, enumerable: true } }))
  expect(value).toEqual(Object.create(null, { a: { value: 1, enumerable: true } }))
  expect(value).toEqual(
    Object.create(null, {
      a: { value: 1, enumerable: true },
      b: { value: 2, enumerable: false },
    }),
  )
  expect(value).toEqual(
    globalObject.Object.create(globalObject.Object.prototype, {
      a: { value: 1, enumerable: true },
    }),
  )
  expect(value).not.toEqual({ a: 1, b: 2 })
})
it('[1,2,3]', ({ value, globalObject }) => {
  expect(value).toEqual([1, 2, 3])
  expect(value).toEqual(new globalObject.Array(1, 2, 3))
  expect(value).not.toEqual([1, 2, 3, 4])
})
test('getTestGlobalObject', () => {
  const globalObject = getTestGlobalObject()
  expect(globalObject).not.toBe(globalThis)
  expect(globalObject.Array).not.toBe(Array)
  expect(globalObject.Array.prototype).not.toBe(Array.prototype)
  expect(Object.prototype.toString.call(globalObject)).toBe('[object global]')
  expect(toShortStringTag(getTestGlobalObject())).toBe('#<Object>')
})
