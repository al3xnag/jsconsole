import { expect } from 'vitest'
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
it('new WeakMap([[{}, {}]])', ({ value, metadata }) => {
  expect(value).toBeInstanceOf(WeakMap)
  expect(metadata.weakMaps.get(value)).toEqual<WeakMapMetadata>({
    entries: new Map([[new WeakRef({}), new WeakRef({})]]),
  })
})
it('new (WeakMap.bind(null, [[{}, {}]]))', ({ value, metadata }) => {
  expect(value).toBeInstanceOf(WeakMap)
  expect(metadata.weakMaps.get(value)).toEqual<WeakMapMetadata>({
    entries: new Map([[new WeakRef({}), new WeakRef({})]]),
  })
})
it('new WeakSet([{}, {}])', ({ value, metadata }) => {
  expect(value).toBeInstanceOf(WeakSet)
  expect(metadata.weakSets.get(value)).toEqual<WeakSetMetadata>({
    values: new Set([new WeakRef({}), new WeakRef({})]),
  })
})
it('new Proxy({ x: 1 }, { get() { return 2 } })', ({ value, metadata }) => {
  expect(value).toBeInstanceOf(Object)
  expect(value).toEqual({ x: 2 })
  expect(metadata.proxies.get(value)).toEqual<ProxyMetadata>({
    target: { x: 1 },
    handler: {
      get: expect.any(Function),
    },
  })
})
it('({ ...new Proxy({ x: 1 }, { get() { return 2 } }) })', { x: 2 })
