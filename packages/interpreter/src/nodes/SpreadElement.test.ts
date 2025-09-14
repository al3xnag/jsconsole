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
  // TODO: message should be "<...> is not iterable" instead of "Spread syntax requires ...iterable[Symbol.iterator] to be a function"
  expect(thrown).toThrow(TypeError)
})
it('[...{ a: 1 }]', ({ thrown }) => {
  // TODO: message should be "<...> is not iterable" instead of "Spread syntax requires ...iterable[Symbol.iterator] to be a function"
  expect(thrown).toThrow(TypeError)
})
it('[...new Map()]', [])
it('console.log(...{ a: 1 })', ({ thrown }) => {
  expect(thrown).toThrow(
    new TypeError('Spread syntax requires ...iterable[Symbol.iterator] to be a function'),
  )
})
it('({...null})', {})
it('({...undefined})', {})
it('[...null]', ({ thrown }) => {
  // TODO: message should be "null is not iterable" instead of "items is not iterable (cannot read property undefined)"
  // (see getIterator in Pattern.ts)
  expect(thrown).toThrow(TypeError)
})
it('[...undefined]', ({ thrown }) => {
  // TODO: message should be "undefined is not iterable" instead of "items is not iterable (cannot read property undefined)"
  // (see getIterator in Pattern.ts)
  expect(thrown).toThrow(TypeError)
})
