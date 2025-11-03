import { describe, expect } from 'vitest'
import { it } from '../test-utils'
import { ProxyMetadata, WeakMapMetadata, WeakSetMetadata } from '../lib/Metadata'

it('function fn() {}; const a = new fn(); a', {})
it('function fn() { this.x = 1 }; const a = new fn(); a', { x: 1 })
it('function fn() { this.x = new.target }; const a = new fn(); [a, a.x === fn]', [
  {
    x: expect.any(Function),
  },
  true,
])
it('new Map().size', 0)
it('new Set().size', 0)
it('new Set([1, 2]).size', 2)
it('Array.from(new Set([1, 1]))', [1])
it('new (Array.bind(1, 2, 3))()', [2, 3])
it('new (Array.bind(1, 2, 3))', [2, 3])
it('new WeakMap([[{}, {}]])', ({ value, metadata, globalObject }) => {
  expect(value).toBeInstanceOf(globalObject.WeakMap)
  expect(metadata.weakMaps.get(value)).toEqual<WeakMapMetadata>({
    entries: new Map([[new globalObject.WeakRef({}), new globalObject.WeakRef({})]]),
  })
})
it('new (WeakMap.bind(null, [[{}, {}]]))', ({ value, metadata, globalObject }) => {
  expect(value).toBeInstanceOf(globalObject.WeakMap)
  expect(metadata.weakMaps.get(value)).toEqual<WeakMapMetadata>({
    entries: new Map([[new globalObject.WeakRef({}), new globalObject.WeakRef({})]]),
  })
})
it('new WeakSet([{}, {}])', ({ value, metadata, globalObject }) => {
  expect(value).toBeInstanceOf(globalObject.WeakSet)
  expect(metadata.weakSets.get(value)).toEqual<WeakSetMetadata>({
    values: new Set([new globalObject.WeakRef({}), new globalObject.WeakRef({})]),
  })
})
it('new Proxy({ x: 1 }, { get() { return 2 } })', ({ value, metadata, globalObject }) => {
  expect(value).toBeInstanceOf(globalObject.Object)
  expect(value).toEqual({ x: 2 })
  expect(metadata.proxies.get(value)).toEqual<ProxyMetadata>({
    target: { x: 1 },
    handler: {
      get: expect.any(Function),
    },
  })
})
it('({ ...new Proxy({ x: 1 }, { get() { return 2 } }) })', { x: 2 })

describe('TypeError: ... is not a constructor', () => {
  it('new 1', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('1 is not a constructor'))
  })
  it('new 1()', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('1 is not a constructor'))
  })
  it('new null()', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('null is not a constructor'))
  })
  it('var a = null; new a()', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('a is not a constructor'))
  })
  it('var a = null; new a', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('a is not a constructor'))
  })
  it('new {}', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('{} is not a constructor'))
  })
  it('new {}()', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('{} is not a constructor'))
  })
  it('new Math', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('Math is not a constructor'))
  })
  it('new Function.prototype', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('Function.prototype is not a constructor'))
  })
  it('new Function', expect.any(Function))
  it('var a = function () {}; new a()', {})
  it('var a = async function () {}; new a()', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('a is not a constructor'))
  })
  it('var a = () => {}; new a()', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('a is not a constructor'))
  })
  it('new {method() {}}.method', ({ thrown }) => {
    // It's "TypeError: {(intermediate value)}.method is not a constructor" in Chrome
    expect(thrown).toThrow(new TypeError('{method() {}}.method is not a constructor'))
  })
  it('new {method: function() {}}.method()', {})
  it('new {method: () => {}}.method', ({ thrown }) => {
    // It's "TypeError: {(intermediate value)}.method is not a constructor" in Chrome
    expect(thrown).toThrow(new TypeError('{method: () => {}}.method is not a constructor'))
  })
  it('new Number()', new Number())
  it('new Number(1)', new Number(1))
  it('new (Number.bind())()', new Number())
  it('new Number.bind()', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('Number.bind is not a constructor'))
  })
  it('new BigInt()', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('BigInt is not a constructor'))
  })
  it('new Symbol()', ({ thrown }) => {
    expect(thrown).toThrow(new TypeError('Symbol is not a constructor'))
  })
  it('new Set([1, 2])', ({ value, globalObject }) => {
    expect(value).toEqual(new globalObject.Set([1, 2]))
  })
})
