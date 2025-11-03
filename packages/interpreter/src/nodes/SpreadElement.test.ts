import { expect } from 'vitest'
import { it } from '../test-utils'

it('({...(Object.defineProperty({}, "a", { get() { return 1 } }))})', {})
it('({...(Object.defineProperty([], "a", { get() { return 1 } }))})', {})
it('({...(Object.defineProperty({}, "a", { get() { return 1 }, enumerable: true }))})', { a: 1 })
it('({...(Object.defineProperty([], "a", { get() { return 1 }, enumerable: true }))})', { a: 1 })
it('({...[1,2]})', { 0: 1, 1: 2 })

it('[...(Object.defineProperty([], 2, { get() { return "a" } }))]', [undefined, undefined, 'a'])
it('[...(Object.defineProperty([], "2", { get() { return "a" } }))]', [undefined, undefined, 'a'])
it('[...(Object.defineProperty([], 2, { get() { return "a" } })).values()]', [
  undefined,
  undefined,
  'a',
])
it('[...(Object.defineProperty([], "a", { get() { return 1 } }))]', [])
it('[...(Object.defineProperty([], "a", { get() { return 1 }, enumerable: true }))]', [])
it('[...(Object.defineProperty({}, "a", { get() { return 1 } }))]', ({ thrown }) => {
  expect(thrown).toThrow(
    new TypeError('Object.defineProperty({}, "a", { get() { return 1 } }) is not iterable'),
  )
})
it('[...{ a: 1 }]', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError('{ a: 1 } is not iterable'))
})
it('[...new Map()]', [])
it('console.log(...{ a: 1 })', ({ thrown }) => {
  // It's 'Spread syntax requires ...iterable[Symbol.iterator] to be a function' in V8,
  // and '({a:1}) is not iterable' in SpiderMonkey.
  expect(thrown).toThrow(new TypeError('{ a: 1 } is not iterable'))
})
it('new Array(...{})', ({ thrown }) => {
  // It's 'Spread syntax requires ...iterable[Symbol.iterator] to be a function' in V8,
  // and '({}) is not iterable' in SpiderMonkey.
  expect(thrown).toThrow(new TypeError('{} is not iterable'))
})
it('new Array(...[1,2])', [1, 2])
it('({...null})', {})
it('({...undefined})', {})
it('[...null]', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError('null is not iterable'))
})
it('[...undefined]', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError('undefined is not iterable'))
})
it('const a = undefined; [...a]', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError('a is not iterable'))
})
