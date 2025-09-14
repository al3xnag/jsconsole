import { describe, expect, test } from 'vitest'
import { getObjectStringTag } from './getObjectStringTag'

describe('built-in objects', () => {
  test.each([
    [{}, 'Object'],
    [Object.create(null), null],
    [[], 'Array'],
    [new Set(), 'Set'],
    [new Map(), 'Map'],
    [new WeakSet(), 'WeakSet'],
    [new WeakMap(), 'WeakMap'],
    [Promise.resolve(), 'Promise'],
    [new Error(), 'Error'],
    [new SyntaxError(), 'SyntaxError'],
    [new TypeError(), 'TypeError'],
    [new Number(1), 'Number'],
    [new String(''), 'String'],
    [new Boolean(true), 'Boolean'],
    [Object(Symbol()), 'Symbol'],
    [Object(BigInt(1)), 'BigInt'],
    [Math, 'Math'],
    [JSON, 'JSON'],
    [new AbortController(), 'AbortController'],
    [new AbortController().signal, 'AbortSignal'],
    [new ArrayBuffer(), 'ArrayBuffer'],
    [new DataView(new ArrayBuffer(1)), 'DataView'],
    [new Int8Array(), 'Int8Array'],
    [new Int16Array(), 'Int16Array'],
    [new Int32Array(), 'Int32Array'],
    [new Uint8Array(), 'Uint8Array'],
    [new Uint16Array(), 'Uint16Array'],
    [new Uint32Array(), 'Uint32Array'],
    [new Uint8ClampedArray(), 'Uint8ClampedArray'],
    [new Float32Array(), 'Float32Array'],
    [new Float64Array(), 'Float64Array'],
    [new URL('https://example.com'), 'URL'],
    [new URLSearchParams(), 'URLSearchParams'],
  ])('$1', (value, expected) => {
    expect(getObjectStringTag(value)).toBe(expected)
  })
})

describe('prototype of built-in objects', () => {
  test.each([
    [Object.getPrototypeOf({}), 'Object'],
    [Object.getPrototypeOf([]), 'Array'],
    [Object.getPrototypeOf(new Set()), 'Set'],
    [Object.getPrototypeOf(new Map()), 'Map'],
    [Object.getPrototypeOf(new WeakSet()), 'WeakSet'],
    [Object.getPrototypeOf(new WeakMap()), 'WeakMap'],
    [Object.getPrototypeOf(Promise.resolve()), 'Promise'],
    [Object.getPrototypeOf(new Error()), 'Error'],
    [Object.getPrototypeOf(new SyntaxError()), 'SyntaxError'],
    [Object.getPrototypeOf(new TypeError()), 'TypeError'],
    [Object.getPrototypeOf(Object.getPrototypeOf(new TypeError())), 'Error'],
    [Object.getPrototypeOf(new AbortController()), 'AbortController'],
    [Object.getPrototypeOf(new Int32Array()), 'Int32Array'],
    [Object.getPrototypeOf(Object.getPrototypeOf(new Int32Array())), 'TypedArray'],
    [Object.getPrototypeOf(Math), 'Object'],
    [Object.getPrototypeOf(JSON), 'Object'],
  ])('$1 prototype', (value, expected) => {
    expect(getObjectStringTag(value)).toBe(expected)
  })
})

describe('classes', () => {
  test.each([
    [new (class A {})(), 'A'],
    [new (class A extends Array {})(), 'A'],
    [new (class A extends Error {})(), 'A'],
    [new (class A extends AbortController {})(), 'A'],
    [new (function A() {})(), 'A'],
    [new (function () {})(), ''],
    [Object.create({ constructor: function A() {} }), 'A'],
  ])('%#. $1', (value, expected) => {
    expect(getObjectStringTag(value)).toBe(expected)
  })
})

describe('prototype of classes', () => {
  test.each([
    [Object.getPrototypeOf(new (class A {})()), 'A'],
    [Object.getPrototypeOf(Object.getPrototypeOf(new (class A {})())), 'Object'],
    [Object.getPrototypeOf(new (class A extends Array {})()), 'A'],
    [Object.getPrototypeOf(Object.getPrototypeOf(new (class A extends Array {})())), 'Array'],
    [Object.getPrototypeOf(new (class A extends Error {})()), 'A'],
    [Object.getPrototypeOf(Object.getPrototypeOf(new (class A extends Error {})())), 'Error'],
    [Object.getPrototypeOf(new (class A extends AbortController {})()), 'A'],
    [Object.getPrototypeOf(new (function A() {})()), 'A'],
    [Object.getPrototypeOf(Object.getPrototypeOf(new (function A() {})())), 'Object'],
    [Object.getPrototypeOf(new (function () {})()), ''],
    [Object.getPrototypeOf(Object.getPrototypeOf(new (function () {})())), 'Object'],
  ])('%#. $1', (value, expected) => {
    expect(getObjectStringTag(value)).toBe(expected)
  })
})

describe('toStringTag', () => {
  test.each([
    [{ [Symbol.toStringTag]: 'A' }, 'A'],
    [
      new (function () {
        this[Symbol.toStringTag] = 'A'
      })(),
      'A',
    ],
    [
      new (function B() {
        this[Symbol.toStringTag] = 'A'
      })(),
      'A',
    ],
    [Object.create({ [Symbol.toStringTag]: 'A' }), 'A'],
    [
      Object.create(
        new (function () {
          this[Symbol.toStringTag] = 'A'
        })(),
      ),
      'A',
    ],
    [
      Object.create(
        new (function B() {
          this[Symbol.toStringTag] = 'A'
        })(),
      ),
      'A',
    ],
    [Object.create({ constructor: function A() {}, [Symbol.toStringTag]: 'B' }), 'B'],
  ])('%#. $1', (value, expected) => {
    expect(getObjectStringTag(value)).toBe(expected)
  })
})
