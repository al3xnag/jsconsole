import { expect, test } from 'vitest'
import { toShortStringTag } from './toShortStringTag'

test('toShortStringTag', () => {
  expect(toShortStringTag(undefined)).toBe('undefined')
  expect(toShortStringTag(null)).toBe('null')
  expect(toShortStringTag(true)).toBe('#<Boolean>')
  expect(toShortStringTag(false)).toBe('#<Boolean>')
  expect(toShortStringTag(1)).toBe('#<Number>')
  expect(toShortStringTag(NaN)).toBe('#<Number>')
  expect(toShortStringTag(Infinity)).toBe('#<Number>')
  expect(toShortStringTag(-Infinity)).toBe('#<Number>')
  expect(toShortStringTag('hello')).toBe('#<String>')
  expect(toShortStringTag(Symbol('hello'))).toBe('#<Symbol>')
  expect(toShortStringTag(new Date())).toBe('#<Date>')
  expect(toShortStringTag({})).toBe('#<Object>')
  expect(toShortStringTag([])).toBe('#<Array>')
  expect(toShortStringTag(/regexp/)).toBe('#<RegExp>')
  expect(toShortStringTag(function () {})).toBe('#<Function>')
  expect(toShortStringTag(() => {})).toBe('#<Function>')
  expect(toShortStringTag(new Set())).toBe('#<Set>')
  expect(toShortStringTag(new Map())).toBe('#<Map>')
  expect(toShortStringTag(new Number(1))).toBe('#<Number>')
  expect(toShortStringTag(new String('hello'))).toBe('#<String>')
  expect(toShortStringTag(new Boolean(true))).toBe('#<Boolean>')
  expect(toShortStringTag(Object.create(null))).toBe('[object Object]')
  expect(toShortStringTag(globalThis)).toBe('#<Object>')

  expect(
    toShortStringTag(
      Object.create(null, {
        constructor: { value: function A() {} },
      }),
    ),
  ).toBe('#<A>')

  expect(
    toShortStringTag(
      Object.create(null, {
        constructor: { value: function () {} },
      }),
    ),
  ).toBe('#<value>')

  expect(
    toShortStringTag(
      Object.create({
        constructor: function A() {},
      }),
    ),
  ).toBe('#<A>')

  expect(toShortStringTag(Object.setPrototypeOf(new Date(), null))).toBe('[object Date]')

  expect(
    toShortStringTag(
      Object.defineProperties(new Map(), {
        constructor: {
          get() {
            return Map
          },
        },
      }),
    ),
  ).toBe('[object Map]')
})
