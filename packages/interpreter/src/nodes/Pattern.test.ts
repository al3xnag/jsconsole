import { expect } from 'vitest'
import { it } from '../test-utils'

it('let {a} = {a: 1}', undefined)
it('let {a} = {a: 1}; a', 1)
it('let [a] = [1]', undefined)
it('let [a] = [1]; a', 1)
it('let {a} = 1; a', undefined)
it('let [a] = 1; a', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError('1 is not iterable'))
})
it('let {a = 0} = 1; a', 0)
it('let [a = 0] = 1; a', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError('1 is not iterable'))
})
it('let {a} = null; a', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError("Cannot destructure 'null' as it is null"))
})
it('let [a] = null; a', ({ thrown }) => {
  expect(thrown).toThrow(new TypeError('null is not iterable'))
})
